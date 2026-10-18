import { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FileText, Plus, Trash2, Download, RefreshCw, Save } from 'lucide-react';
import { apiRequest, getErrorMessage, downloadFinancialStatementsPdf } from '../api';
import PageHeader from './PageHeader';
import './FinancialStatements.css';

const TABS = [
  { key: 'year', label: 'Fiscal year' },
  { key: 'company', label: 'Company' },
  { key: 'inputs', label: 'Balances & adjustments' },
  { key: 'assets', label: 'Fixed assets' },
  { key: 'preview', label: 'Preview & PDF' },
];

const CATEGORIES = [
  ['building', '建物 Building'],
  ['equipment', '工具器具備品 Equipment'],
  ['vehicle', '車両運搬具 Vehicle'],
  ['other_tangible', 'Other tangible'],
  ['deferred', '繰延資産 Deferred asset'],
];
const METHODS = [
  ['straight_line', '定額法 Straight-line'],
  ['declining_200', '200%定率法 Declining'],
  ['lump_sum', '一時償却 Lump sum'],
  ['none', 'No depreciation'],
];

const OVERRIDE_FIELDS = [
  ['sales', '売上高 Sales', 'Blank = total of Sale orders in the period'],
  ['purchases', '商品仕入高 Purchases', 'Blank = total of Purchase orders in the period'],
  ['cash', '現金及び預金 Cash & deposits', 'Blank = latest bank balance on or before period end'],
];
const AMOUNT_FIELDS = [
  ['purchase_discounts', '仕入値引高 Purchase discounts'],
  ['opening_inventory', '期首商品棚卸高 Opening inventory'],
  ['closing_inventory', '期末商品棚卸高 Closing inventory'],
  ['income_taxes', '法人税・住民税及び事業税 Corporate taxes'],
  ['prior_year_taxes', '過年度法人税等 Prior-year taxes'],
  ['capital', '資本金 Capital'],
  ['opening_retained_earnings', '期首繰越利益剰余金 Opening retained earnings'],
  ['dividends', '剰余金の配当 Dividends'],
];
const LISTS = [
  ['other_current_assets', 'Other current assets (立替金, 未収還付法人税等, 役員貸付金 …)', true],
  ['investments', 'Investments & other assets (差入保証金 …)', false],
  ['current_liabilities', 'Current liabilities (役員借入金, 未払金, 未払法人税等, 預り金 …)', false],
  ['fixed_liabilities', 'Fixed liabilities', false],
  ['extra_sga', 'Extra SG&A lines not recorded as expenses', false],
  ['non_operating_income', 'Non-operating income (受取利息, 雑収入 …)', false],
  ['non_operating_expenses', 'Non-operating expenses', false],
];
const PROFILE_FIELDS = [
  ['legal_name', 'Legal name'], ['legal_name_kana', 'Legal name (kana)'],
  ['representative_name', 'Representative'], ['representative_name_kana', 'Representative (kana)'],
  ['corporate_number', 'Corporate number (13 digits)'], ['capital', 'Capital (¥)'],
  ['address', 'Address'], ['phone', 'Phone'],
  ['tax_office', 'Tax office'], ['business_description', 'Business description'],
];

const yen = (n) => (n === null || n === undefined ? '' : Number(n).toLocaleString('ja-JP'));
const EMPTY_ASSET = {
  name: '', category: 'equipment', acquired_on: '', cost: '', method: 'declining_200',
  useful_life: '', opening_book_value: 0,
};

const readJson = async (response) => {
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
};

const LineList = ({ title, items, onChange, allowExecutive }) => {
  const update = (index, patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  return (
    <div className="fs-card">
      <div className="fs-card-head">
        <h3>{title}</h3>
        <button type="button" className="btn-secondary btn-small" onClick={() => onChange([...items, { label: '', amount: 0 }])}>
          <Plus size={14} /> Add
        </button>
      </div>
      {items.length === 0 && <p className="fs-muted">None</p>}
      {items.map((item, index) => (
        <div className="fs-line" key={index}>
          <input className="form-input" placeholder="Label" value={item.label}
                 onChange={(e) => update(index, { label: e.target.value })} />
          <input className="form-input fs-amount" type="number" value={item.amount}
                 onChange={(e) => update(index, { amount: Number(e.target.value) || 0 })} />
          {allowExecutive && (
            <label className="fs-check" title="Counts toward 業務執行社員等に対する金銭債権 in the notes">
              <input type="checkbox" checked={!!item.executive}
                     onChange={(e) => update(index, { executive: e.target.checked })} /> Exec.
            </label>
          )}
          <button type="button" className="btn-remove" aria-label="Remove line"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

const FinancialStatements = () => {
  const [tab, setTab] = useState('year');
  const [years, setYears] = useState([]);
  const [yearId, setYearId] = useState('');
  const [newYear, setNewYear] = useState({ term_no: '', start_date: '', end_date: '' });
  const [profile, setProfile] = useState(null);
  const [inputs, setInputs] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetForm, setAssetForm] = useState(EMPTY_ASSET);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (fn, successMessage) => {
    setBusy(true);
    try {
      const result = await fn();
      if (successMessage) toast.success(successMessage);
      return result;
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  const loadYears = useCallback(async (selectId) => {
    const list = await readJson(await apiRequest('/reports/fiscal-years/'));
    setYears(list);
    setYearId((current) => String(selectId || current || list[0]?.id || ''));
  }, []);

  useEffect(() => {
    run(async () => {
      await loadYears();
      setProfile(await readJson(await apiRequest('/reports/company-profile/')));
    });
  }, [run, loadYears]);

  useEffect(() => {
    setPreview(null);
    if (!yearId) { setInputs(null); setAssets([]); return; }
    run(async () => {
      const [inputRes, assetRes] = await Promise.all([
        apiRequest(`/reports/fiscal-years/${yearId}/inputs/`),
        apiRequest(`/reports/fixed-assets/?fiscal_year=${yearId}`),
      ]);
      setInputs((await readJson(inputRes)).data);
      setAssets(await readJson(assetRes));
    });
  }, [yearId, run]);

  const year = years.find((y) => String(y.id) === String(yearId));

  const createYear = () => run(async () => {
    const created = await readJson(await apiRequest('/reports/fiscal-years/', {
      method: 'POST',
      body: JSON.stringify({ ...newYear, term_no: Number(newYear.term_no) }),
    }));
    setNewYear({ term_no: '', start_date: '', end_date: '' });
    await loadYears(created.id);
  }, 'Fiscal year created');

  const deleteYear = () => {
    if (!year || !window.confirm(`Delete 第${year.term_no}期 and all its inputs and fixed assets?`)) return;
    run(async () => {
      const res = await apiRequest(`/reports/fiscal-years/${year.id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await getErrorMessage(res));
      setYearId('');
      await loadYears();
    }, 'Fiscal year deleted');
  };

  const saveProfile = () => run(async () => {
    setProfile(await readJson(await apiRequest('/reports/company-profile/', {
      method: 'PUT',
      body: JSON.stringify({ ...profile, capital: Number(profile.capital) || 0 }),
    })));
  }, 'Company details saved');

  const saveInputs = () => run(async () => {
    const saved = await readJson(await apiRequest(`/reports/fiscal-years/${yearId}/inputs/`, {
      method: 'PUT', body: JSON.stringify({ data: inputs }),
    }));
    setInputs(saved.data);
  }, 'Inputs saved');

  const addAsset = () => run(async () => {
    const created = await readJson(await apiRequest('/reports/fixed-assets/', {
      method: 'POST',
      body: JSON.stringify({
        ...assetForm, fiscal_year: Number(yearId), cost: Number(assetForm.cost),
        useful_life: Number(assetForm.useful_life) || 0,
        opening_book_value: Number(assetForm.opening_book_value) || 0,
      }),
    }));
    setAssets((list) => [...list, created]);
    setAssetForm(EMPTY_ASSET);
  }, 'Asset added');

  const removeAsset = (id) => run(async () => {
    const res = await apiRequest(`/reports/fixed-assets/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await getErrorMessage(res));
    setAssets((list) => list.filter((a) => a.id !== id));
  });

  const loadPreview = () => run(async () => {
    setPreview(await readJson(await apiRequest(`/reports/fiscal-years/${yearId}/preview/`)));
  });

  const download = () => run(() => downloadFinancialStatementsPdf(year.id, year.term_no, ['kessan']));

  const setInput = (key, value) => setInputs((current) => ({ ...current, [key]: value }));
  const needsYear = !yearId && tab !== 'year' && tab !== 'company';

  return (
    <div className="fs-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <PageHeader
        title="Financial Statements"
        subtitle="決算報告書 — balance sheet, P&L, SG&A schedule, equity statement and notes"
        icon={FileText}
      />

      <div className="fs-notice">
        Generated PDFs are working copies for review. They are not valid tax filings; submit through e-Tax/eLTAX and
        have your 税理士 check the figures first.
      </div>

      <div className="fs-toolbar">
        <div className="fs-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key}
                    className={`fs-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <select className="form-input fs-year-select" value={yearId} onChange={(e) => setYearId(e.target.value)}
                aria-label="Fiscal year">
          {years.length === 0 && <option value="">No fiscal year yet</option>}
          {years.map((y) => (
            <option key={y.id} value={y.id}>第{y.term_no}期 {y.start_date} – {y.end_date}</option>
          ))}
        </select>
      </div>

      {needsYear && <p className="fs-muted">Create a fiscal year first (Fiscal year tab).</p>}

      {tab === 'year' && (
        <div className="fs-card">
          <h3>New fiscal year</h3>
          <div className="fs-grid">
            <div className="form-group"><label>Term no. (第◯期)</label>
              <input type="number" min="1" value={newYear.term_no}
                     onChange={(e) => setNewYear({ ...newYear, term_no: e.target.value })} /></div>
            <div className="form-group"><label>Start date</label>
              <input type="date" value={newYear.start_date}
                     onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })} /></div>
            <div className="form-group"><label>End date</label>
              <input type="date" value={newYear.end_date}
                     onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })} /></div>
          </div>
          <div className="fs-actions">
            <button className="btn-primary" disabled={busy || !newYear.term_no || !newYear.start_date || !newYear.end_date}
                    onClick={createYear}><Plus size={16} /> Create</button>
            {year && <button className="btn-secondary" disabled={busy} onClick={deleteYear}>
              <Trash2 size={14} /> Delete 第{year.term_no}期</button>}
          </div>
        </div>
      )}

      {tab === 'company' && profile && (
        <div className="fs-card">
          <h3>Company details</h3>
          <div className="fs-grid">
            {PROFILE_FIELDS.map(([key, label]) => (
              <div className="form-group" key={key}><label>{label}</label>
                <input value={profile[key] ?? ''} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="fs-actions">
            <button className="btn-primary" disabled={busy} onClick={saveProfile}><Save size={16} /> Save</button>
          </div>
        </div>
      )}

      {tab === 'inputs' && inputs && yearId && (
        <>
          <div className="fs-card">
            <h3>Figures derived from your data (leave blank to auto-calculate)</h3>
            <div className="fs-grid">
              {OVERRIDE_FIELDS.map(([key, label, hint]) => (
                <div className="form-group" key={key}><label>{label}</label>
                  <input type="number" value={inputs[key] ?? ''} placeholder="Auto"
                         onChange={(e) => setInput(key, e.target.value === '' ? null : Number(e.target.value))} />
                  <small className="fs-muted">{hint}</small></div>
              ))}
            </div>
            <label className="fs-check">
              <input type="checkbox" checked={inputs.include_salaries}
                     onChange={(e) => setInput('include_salaries', e.target.checked)} />
              Add payroll (gross pay) as 給料手当 — leave off if salaries are already entered as expenses
            </label>
          </div>
          <div className="fs-card">
            <h3>Amounts</h3>
            <div className="fs-grid">
              {AMOUNT_FIELDS.map(([key, label]) => (
                <div className="form-group" key={key}><label>{label}</label>
                  <input type="number" value={inputs[key]}
                         onChange={(e) => setInput(key, Number(e.target.value) || 0)} /></div>
              ))}
            </div>
          </div>
          {LISTS.map(([key, title, allowExecutive]) => (
            <LineList key={key} title={title} items={inputs[key]} allowExecutive={allowExecutive}
                      onChange={(items) => setInput(key, items)} />
          ))}
          <div className="fs-actions">
            <button className="btn-primary" disabled={busy} onClick={saveInputs}><Save size={16} /> Save inputs</button>
          </div>
        </>
      )}

      {tab === 'assets' && yearId && (
        <div className="fs-card">
          <h3>Fixed assets &amp; deferred assets</h3>
          <p className="fs-muted">
            Assets acquired in this fiscal year start at their cost. For older assets enter the book value at the
            start of the year. Depreciation is calculated automatically.
          </p>
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Acquired</th><th>Cost</th><th>Method</th>
                <th>Life (yrs)</th><th>Opening book value</th><th /></tr></thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td><td>{CATEGORIES.find((c) => c[0] === a.category)?.[1]}</td>
                    <td>{a.acquired_on}</td><td>{yen(a.cost)}</td>
                    <td>{METHODS.find((m) => m[0] === a.method)?.[1]}</td>
                    <td>{a.useful_life || '–'}</td><td>{yen(a.opening_book_value)}</td>
                    <td><button className="btn-remove" aria-label={`Delete ${a.name}`} disabled={busy}
                                onClick={() => removeAsset(a.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {assets.length === 0 && <tr><td colSpan="8" className="fs-muted">No assets yet</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="fs-grid fs-asset-form">
            <input className="form-input" placeholder="Name" value={assetForm.name}
                   onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
            <select className="form-input" value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input className="form-input" type="date" value={assetForm.acquired_on}
                   onChange={(e) => setAssetForm({ ...assetForm, acquired_on: e.target.value })} />
            <input className="form-input" type="number" placeholder="Cost" value={assetForm.cost}
                   onChange={(e) => setAssetForm({ ...assetForm, cost: e.target.value })} />
            <select className="form-input" value={assetForm.method}
                    onChange={(e) => setAssetForm({ ...assetForm, method: e.target.value })}>
              {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input className="form-input" type="number" placeholder="Useful life (yrs)" value={assetForm.useful_life}
                   onChange={(e) => setAssetForm({ ...assetForm, useful_life: e.target.value })} />
            <input className="form-input" type="number" placeholder="Opening book value"
                   value={assetForm.opening_book_value}
                   onChange={(e) => setAssetForm({ ...assetForm, opening_book_value: e.target.value })} />
            <button className="btn-primary" disabled={busy || !assetForm.name || !assetForm.acquired_on || !assetForm.cost}
                    onClick={addAsset}><Plus size={16} /> Add asset</button>
          </div>
        </div>
      )}

      {tab === 'preview' && yearId && (
        <div className="fs-card">
          <div className="fs-card-head">
            <h3>Preview</h3>
            <div className="fs-actions">
              <button className="btn-secondary" disabled={busy} onClick={loadPreview}>
                <RefreshCw size={14} /> {preview ? 'Refresh' : 'Calculate'}
              </button>
              <button className="btn-primary" disabled={busy} onClick={download}>
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
          <p className="fs-muted">Unsaved changes on other tabs are not included. Save inputs first.</p>
          {preview && (
            <>
              {preview.warnings.map((w) => <div className="fs-warning" key={w}>{w}</div>)}
              <table className="fs-summary">
                <tbody>
                  {[
                    ['売上高 Sales', preview.pl.sales, preview.sources.sales],
                    ['売上原価 Cost of sales', preview.pl.cost_of_sales],
                    ['売上総利益 Gross profit', preview.pl.gross_profit],
                    ['販売管理費 SG&A', preview.pl.sga_total],
                    ['営業利益 Operating income', preview.pl.operating_income],
                    ['経常利益 Ordinary income', preview.pl.ordinary_income],
                    ['当期純利益 Net income', preview.pl.net_income],
                    ['現金及び預金 Cash', preview.bs.current_assets.find((i) => i.label === '現金及び預金')?.amount ?? 0, preview.sources.cash],
                    ['資産合計 Total assets', preview.bs.assets_total],
                    ['負債合計 Total liabilities', preview.bs.liabilities_total],
                    ['純資産合計 Net assets', preview.bs.equity_total],
                  ].map(([label, value, source]) => (
                    <tr key={label}>
                      <td>{label}</td><td className="fs-num">¥ {yen(value)}</td>
                      <td className="fs-muted">{source === 'derived' ? 'from app data' : source === 'input' ? 'entered' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialStatements;
