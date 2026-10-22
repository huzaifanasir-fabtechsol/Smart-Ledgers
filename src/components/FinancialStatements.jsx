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
  { key: 'tax', label: 'Tax settings' },
  { key: 'assets', label: 'Fixed assets' },
  { key: 'preview', label: 'Preview & PDF' },
];

const CATEGORIES = [
  ['building', 'Building'],
  ['equipment', 'Tools, furniture & fixtures'],
  ['vehicle', 'Vehicle'],
  ['other_tangible', 'Other tangible'],
  ['deferred', 'Deferred asset'],
];
const METHODS = [
  ['straight_line', 'Straight-line'],
  ['declining_200', '200% declining balance'],
  ['lump_sum', 'Lump-sum write-off'],
  ['none', 'No depreciation'],
];
const ASSET_KINDS = [['', 'Auto'], ['receivable', 'Receivable'], ['advance', 'Advance paid'], ['loan', 'Loan'],
  ['deposit_paid', 'Guarantee deposit']];
const LIABILITY_KINDS = [['', 'Auto'], ['payable', 'Payable'], ['deposit_received', 'Deposit received'],
  ['borrowing', 'Borrowing'], ['tax_payable', 'Taxes payable']];

const OVERRIDE_FIELDS = [
  ['sales', 'Sales'],
  ['purchases', 'Merchandise purchases'],
  ['cash', 'Cash & deposits'],
];
const AMOUNT_FIELDS = [
  ['purchase_discounts', 'Purchase discounts'],
  ['opening_inventory', 'Opening inventory'],
  ['closing_inventory', 'Closing inventory'],
  ['income_taxes', 'Corporate, inhabitant & enterprise taxes'],
  ['prior_year_taxes', 'Prior-year taxes'],
  ['capital', 'Capital'],
  ['opening_retained_earnings', 'Opening retained earnings'],
  ['dividends', 'Dividends'],
];
// [key, title, allowExecutive, kind options, extra text fields]
const LISTS = [
  ['other_current_assets', 'Other current assets (advances paid, tax refunds receivable, loans to executives …)', true, ASSET_KINDS, ['counterparty', 'address', 'note']],
  ['investments', 'Investments & other assets (security deposits …)', false, ASSET_KINDS, ['counterparty', 'address', 'note']],
  ['current_liabilities', 'Current liabilities (loans from executives, accounts payable, taxes payable, deposits received …)', false, LIABILITY_KINDS, ['counterparty', 'address', 'note']],
  ['fixed_liabilities', 'Fixed liabilities', false, LIABILITY_KINDS, ['counterparty', 'address', 'note']],
  ['extra_sga', 'Extra SG&A lines not recorded as expenses', false, null, []],
  ['non_operating_income', 'Non-operating income (interest, miscellaneous …)', false, null, ['counterparty', 'note']],
  ['non_operating_expenses', 'Non-operating expenses', false, null, ['counterparty', 'note']],
  ['rent_details', 'Rent details for the rent schedule (label = usage)', false, null, ['counterparty', 'address', 'note', 'registration']],
];
const PROFILE_FIELDS = [
  ['legal_name', 'Legal name (Japanese)'], ['legal_name_en', 'Legal name (English)'], ['legal_name_kana', 'Legal name (kana)'],
  ['representative_name', 'Representative (Japanese)'], ['representative_name_en', 'Representative (English)'],
  ['representative_name_kana', 'Representative (kana)'],
  ['corporate_number', 'Corporate number (13 digits)'], ['capital', 'Capital (¥)'],
  ['address', 'Address (Japanese)'], ['address_en', 'Address (English)'], ['phone', 'Phone'],
  ['tax_office', 'Tax office'], ['business_description', 'Business description'],
  ['accountant_name', 'Tax accountant name'], ['accountant_address', 'Tax accountant address'],
  ['accountant_phone', 'Tax accountant phone'], ['accountant_registration', 'Tax accountant registration no.'],
];
const OFFICE_FIELDS = [
  ['prefecture', 'Prefecture', 'text'], ['prefecture_office', 'Prefectural tax office', 'text'],
  ['municipality', 'Municipality', 'text'], ['employees', 'Employees', 'number'], ['months', 'Months (per-capita levy)', 'number'],
  ['pref_levy', 'Prefectural per-capita levy / yr', 'number'], ['city_levy', 'Municipal per-capita levy / yr', 'number'],
  ['pref_rate', 'Prefectural corporate-tax rate %', 'number'], ['city_rate', 'Municipal corporate-tax rate %', 'number'],
];
const HOLDER_FIELDS = [
  ['name', 'Name', 'text'], ['address', 'Address', 'text'], ['relationship', 'Relationship', 'text'],
  ['shares', 'Shares / contribution', 'number'], ['group', 'Family group (optional)', 'text'],
];
const CONSUMPTION_FIELDS = [
  ['sales_incl_10', 'Taxable sales 10% (tax incl.)', true], ['sales_incl_8', 'Taxable sales 8% reduced (tax incl.)', true],
  ['nontaxable_sales', 'Non-taxable sales', true],
  ['purchase_incl_10', 'Taxable purchases 10% (tax incl.)', true], ['purchase_incl_8', 'Taxable purchases 8% reduced (tax incl.)', true],
  ['purchase_returns_10', 'Purchase returns 10%'], ['purchase_returns_8', 'Purchase returns 8%'],
  ['transitional_incl_10', '80% transitional purchases 10% (tax incl.)'], ['transitional_incl_8', '80% transitional purchases 8% (tax incl.)'],
  ['interim_paid', 'Interim consumption tax paid'], ['interim_paid_local', 'Interim local consumption tax paid'],
];
const CORPORATE_FIELDS = [
  ['entertainment_expenses', 'Entertainment expenses', true],
  ['entertainment_food', 'Of which business meals'], ['withholding_credit', 'Withholding tax credit'],
  ['interim_paid', 'Interim corporate tax paid'], ['opening_provision', 'Opening provision for taxes'],
  ['unpaid_corporate', 'Unpaid corporate tax at year end', true],
  ['unpaid_pref', 'Unpaid prefectural tax at year end', true],
  ['unpaid_city', 'Unpaid municipal tax at year end', true],
];
const PARTS = [
  ['kessan', 'Financial statements'],
  ['shohizei', 'Consumption tax'],
  ['hojinzei', 'Corporate tax'],
  ['schedules', 'Account schedules & depreciation'],
  ['chihozei', 'Local taxes'],
  ['other', 'Business overview, payments, next year'],
];

const STATUS_LABELS = { ok: 'Done', todo: 'To do', check: 'Check' };

const yen = (n) => (n === null || n === undefined ? '' : Number(n).toLocaleString('ja-JP'));
const EMPTY_ASSET = {
  name: '', category: 'equipment', acquired_on: '', cost: '', method: 'declining_200',
  useful_life: '', opening_book_value: 0,
};

const readJson = async (response) => {
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
};

const LineList = ({ title, items, onChange, allowExecutive, kinds, extras = [] }) => {
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
        <div className="fs-line-block" key={index}>
          <div className="fs-line">
            <input className="form-input" placeholder="Label" value={item.label}
                   onChange={(e) => update(index, { label: e.target.value })} />
            <input className="form-input fs-amount" type="number" value={item.amount}
                   onChange={(e) => update(index, { amount: Number(e.target.value) || 0 })} />
            {allowExecutive && (
              <label className="fs-check" title="Counts toward monetary claims on executive members in the notes">
                <input type="checkbox" checked={!!item.executive}
                       onChange={(e) => update(index, { executive: e.target.checked })} /> Exec.
              </label>
            )}
            <button type="button" className="btn-remove" aria-label="Remove line"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}>
              <Trash2 size={14} />
            </button>
          </div>
          {(kinds || extras.length > 0) && (
            <div className="fs-line fs-line-extra">
              {kinds && (
                <select className="form-input fs-kind" value={item.kind || ''} aria-label="Schedule category"
                        onChange={(e) => update(index, { kind: e.target.value })}>
                  {kinds.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
              {extras.map((field) => (
                <input key={field} className="form-input" placeholder={field} value={item[field] || ''}
                       onChange={(e) => update(index, { [field]: e.target.value })} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Editable list of flat records (offices, shareholders); numeric fields are sent as numbers.
const RecordList = ({ title, rows, fields, onChange, blank }) => (
  <div className="fs-card">
    <div className="fs-card-head">
      <h3>{title}</h3>
      <button type="button" className="btn-secondary btn-small" onClick={() => onChange([...rows, { ...blank }])}>
        <Plus size={14} /> Add
      </button>
    </div>
    {rows.length === 0 && <p className="fs-muted">None</p>}
    {rows.map((row, index) => (
      <div className="fs-record" key={index}>
        <div className="fs-grid">
          {fields.map(([key, label, type]) => (
            <div className="form-group" key={key}><label>{label}</label>
              <input type={type} value={row[key] ?? ''}
                     onChange={(e) => onChange(rows.map((r, i) => (i === index ? { ...r, [key]: e.target.value } : r)))} />
            </div>
          ))}
        </div>
        <button type="button" className="btn-remove" aria-label="Remove row"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}><Trash2 size={14} /></button>
      </div>
    ))}
  </div>
);

// A figure that is calculated automatically but can be overridden. ``value`` is the saved override
// (null = auto); the field shows the calculated value until the user types something else.
const AutoField = ({ label, value, auto, onChange }) => {
  const overridden = value !== null && value !== undefined;
  const hasAuto = auto !== null && auto !== undefined;
  return (
    <div className="form-group">
      <label>{label}</label>
      <input type="number" className={overridden ? '' : 'fs-auto-input'} placeholder="Auto"
             value={overridden ? value : (hasAuto ? auto : '')}
             onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      <div className="fs-meta">
        {overridden ? (
          <button type="button" className="fs-link" onClick={() => onChange(null)}>
            Overridden - reset to auto{hasAuto ? ` (¥${yen(auto)})` : ''}
          </button>
        ) : <span className="fs-badge">Auto-calculated</span>}
      </div>
    </div>
  );
};

const PlainField = ({ label, value, onChange }) => (
  <div className="form-group">
    <label>{label}</label>
    <input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    <div className="fs-meta" />
  </div>
);

// Lists what each auto figure is made of so it can be checked against your records.
const AutoDetails = ({ fields, details, prefix = '' }) => {
  const rows = fields.filter(([key]) => details?.[prefix + key]?.length);
  if (rows.length === 0) return null;
  return (
    <details className="fs-details">
      <summary>How the auto values are calculated</summary>
      {rows.map(([key, label]) => (
        <div className="fs-detail" key={key}>
          <strong>{label}</strong>
          {details[prefix + key].map(([name, amount]) => (
            <div className="fs-detail-line" key={name}><span>{name}</span><span>¥ {yen(amount)}</span></div>
          ))}
        </div>
      ))}
    </details>
  );
};

const toNumbers = (rows, fields) => rows.map((row) => {
  const out = { ...row };
  fields.filter(([, , type]) => type === 'number').forEach(([key]) => {
    if (out[key] === '' || out[key] === undefined || out[key] === null) delete out[key];
    else out[key] = Number(out[key]);
  });
  return out;
});

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
  const [auto, setAuto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('full');
  const [parts, setParts] = useState(PARTS.map(([key]) => key));

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

  const loadAuto = useCallback(async () => {
    if (!yearId) return;
    try {
      setAuto(await readJson(await apiRequest(`/reports/fiscal-years/${yearId}/auto-values/`)));
    } catch (error) {
      toast.error(error.message || 'Could not calculate the automatic values');
    }
  }, [yearId]);

  // Auto values depend on saved data, so refresh them whenever one of the tabs that shows them opens.
  useEffect(() => {
    if (tab === 'inputs' || tab === 'tax') loadAuto();
  }, [tab, loadAuto]);

  useEffect(() => {
    setPreview(null);
    setAuto(null);
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

  const startNextTerm = () => {
    if (!year || !window.confirm(`Create term ${year.term_no + 1} from the closing balances of term ${year.term_no}?`)) return;
    run(async () => {
      const created = await readJson(await apiRequest(`/reports/fiscal-years/${year.id}/roll-forward/`, { method: 'POST' }));
      await loadYears(created.id);
      setTab('inputs');
    }, 'Next term created with balances carried forward');
  };

  const deleteYear = () => {
    if (!year || !window.confirm(`Delete term ${year.term_no} and all its inputs and fixed assets?`)) return;
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
      body: JSON.stringify({
        ...profile,
        capital: Number(profile.capital) || 0,
        offices: toNumbers(profile.offices || [], OFFICE_FIELDS),
        shareholders: toNumbers(profile.shareholders || [], HOLDER_FIELDS),
      }),
    })));
  }, 'Company details saved');

  const saveInputs = () => run(async () => {
    const saved = await readJson(await apiRequest(`/reports/fiscal-years/${yearId}/inputs/`, {
      method: 'PUT', body: JSON.stringify({ data: inputs }),
    }));
    setInputs(saved.data);
    await loadAuto();
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

  const loadPreview = useCallback(() => run(async () => {
    setPreview(await readJson(await apiRequest(`/reports/fiscal-years/${yearId}/preview/`)));
  }), [run, yearId]);

  // Opening the Preview tab calculates it, so the checklist is always current with the saved inputs.
  useEffect(() => {
    if (tab === 'preview' && yearId) loadPreview();
  }, [tab, yearId, loadPreview]);

  const download = (lang) => run(
    () => downloadFinancialStatementsPdf(year.id, year.term_no, { parts, lang, mode }),
    lang === 'en' ? 'English PDF downloaded' : 'Japanese PDF downloaded',
  );

  const togglePart = (key) => setParts((current) => (
    current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));

  const setInput = (key, value) => setInputs((current) => ({ ...current, [key]: value }));
  const setTax = (group, key, value) => setInputs((current) => ({
    ...current, tax: { ...current.tax, [group]: { ...current.tax[group], [key]: value } },
  }));
  const allAccountIds = (auto?.accounts || []).map((a) => a.id);
  const selectedAccountIds = inputs?.cash_accounts ?? allAccountIds;
  const toggleAccount = (id) => {
    const next = selectedAccountIds.includes(id)
      ? selectedAccountIds.filter((x) => x !== id)
      : [...selectedAccountIds, id];
    // every account ticked = "all accounts" (null), so accounts added later are included automatically
    setInput('cash_accounts', next.length === allAccountIds.length ? null : next);
  };
  const needsYear = !yearId && !['year', 'company'].includes(tab);

  return (
    <div className="fs-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <PageHeader
        title="Financial Statements & Tax Filing"
        subtitle="Financial statements, consumption tax, corporate tax and local taxes. English and Japanese PDFs, full or simple"
        icon={FileText}
      />

      <div className="fs-notice">
        Generated PDFs are working copies for review. They are not valid tax filings; submit through e-Tax/eLTAX and
        have your tax accountant check the figures first. Form line captions are a best-effort reconstruction of the official forms.
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
            <option key={y.id} value={y.id}>Term {y.term_no}: {y.start_date} - {y.end_date}</option>
          ))}
        </select>
      </div>

      {needsYear && <p className="fs-muted">Create a fiscal year first (Fiscal year tab).</p>}

      {tab === 'year' && (
        <div className="fs-card">
          <h3>New fiscal year</h3>
          <div className="fs-grid">
            <div className="form-group"><label>Term no.</label>
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
            {year && <button className="btn-secondary" disabled={busy} onClick={startNextTerm}
                             title="Creates the next term with this term's closing balances, fixed assets and losses carried forward">
              <Plus size={14} /> Start term {year.term_no + 1} (carry balances forward)</button>}
            {year && <button className="btn-secondary" disabled={busy} onClick={deleteYear}>
              <Trash2 size={14} /> Delete term {year.term_no}</button>}
          </div>
          {year && (
            <p className="fs-muted">
              Starting the next term copies capital, retained earnings, inventory, balance-sheet items, fixed assets
              and loss carry-forwards. Afterwards remove anything that was settled (for example last year&apos;s taxes
              payable) and enter the bank and inventory balances.
            </p>
          )}
        </div>
      )}

      {tab === 'company' && profile && (
        <>
          <div className="fs-card">
            <h3>Company details</h3>
            <p className="fs-muted">English fields are used on the English PDFs; if empty the Japanese values are printed.</p>
            <div className="fs-grid">
              {PROFILE_FIELDS.map(([key, label]) => (
                <div className="form-group" key={key}><label>{label}</label>
                  <input value={profile[key] ?? ''} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
          <RecordList title="Offices (for local tax allocation)" rows={profile.offices || []} fields={OFFICE_FIELDS}
                      blank={{ prefecture: '', prefecture_office: '', municipality: '', employees: 1, months: 12 }}
                      onChange={(rows) => setProfile({ ...profile, offices: rows })} />
          <RecordList title="Shareholders / members (family-company test)" rows={profile.shareholders || []} fields={HOLDER_FIELDS}
                      blank={{ name: '', address: '', relationship: '', shares: '' }}
                      onChange={(rows) => setProfile({ ...profile, shareholders: rows })} />
          <div className="fs-actions">
            <button className="btn-primary" disabled={busy} onClick={saveProfile}><Save size={16} /> Save</button>
          </div>
        </>
      )}

      {tab === 'inputs' && inputs && yearId && (
        <>
          <div className="fs-card">
            <h3>Figures derived from your data</h3>
            <p className="fs-muted">
              Each field shows the calculated value. Type a different number to override it, or reset to go back to
              auto. Auto values refresh when you save.
            </p>
            <div className="fs-grid">
              {OVERRIDE_FIELDS.map(([key, label]) => (
                <AutoField key={key} label={label} value={inputs[key]} auto={auto?.[key]}
                           onChange={(value) => setInput(key, value)} />
              ))}
            </div>
            <AutoDetails fields={OVERRIDE_FIELDS} details={auto?.details} />
            {auto?.accounts?.length > 0 && (
              <div className="fs-accounts">
                <strong>Bank accounts counted in cash &amp; deposits</strong>
                <p className="fs-muted">
                  Tick only the accounts that are on the company&apos;s books (for example, leave out personal or
                  card accounts). Balances are as of the period end. The cash figure updates after you save.
                </p>
                {auto.accounts.map((account) => (
                  <label className="fs-check" key={account.id}>
                    <input type="checkbox" checked={selectedAccountIds.includes(account.id)}
                           onChange={() => toggleAccount(account.id)} />
                    {account.label} - ¥{yen(account.balance)} ({account.transactions} transactions)
                  </label>
                ))}
              </div>
            )}
            <label className="fs-check">
              <input type="checkbox" checked={inputs.include_salaries}
                     onChange={(e) => setInput('include_salaries', e.target.checked)} />
              Add payroll (gross pay) as salaries — leave off if salaries are already entered as expenses
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
          {LISTS.map(([key, title, allowExecutive, kinds, extras]) => (
            <LineList key={key} title={title} items={inputs[key]} allowExecutive={allowExecutive} kinds={kinds}
                      extras={extras} onChange={(items) => setInput(key, items)} />
          ))}
          <div className="fs-actions">
            <button className="btn-primary" disabled={busy} onClick={saveInputs}><Save size={16} /> Save inputs</button>
          </div>
        </>
      )}

      {tab === 'tax' && inputs && yearId && (
        <>
          <div className="fs-card">
            <h3>Consumption tax</h3>
            <p className="fs-muted">
              Fields marked auto are estimated from your sales, purchases, expenses and fixed assets. Type a number to
              override (for example with the figures from your tax software).
            </p>
            <div className="fs-grid">
              {CONSUMPTION_FIELDS.map(([key, label, nullable]) => (nullable ? (
                <AutoField key={key} label={label} value={inputs.tax.consumption[key]} auto={auto?.consumption?.[key]}
                           onChange={(value) => setTax('consumption', key, value)} />
              ) : (
                <PlainField key={key} label={label} value={inputs.tax.consumption[key]}
                            onChange={(value) => setTax('consumption', key, value)} />
              )))}
            </div>
            <AutoDetails fields={CONSUMPTION_FIELDS.filter(([, , nullable]) => nullable)} details={auto?.details}
                         prefix="consumption." />
            <div className="form-group"><label>Special circumstances (refund return note)</label>
              <input value={inputs.tax.consumption.refund_note}
                     onChange={(e) => setTax('consumption', 'refund_note', e.target.value)} /></div>
          </div>
          <div className="fs-card">
            <h3>Corporate tax</h3>
            <div className="fs-grid">
              {CORPORATE_FIELDS.map(([key, label, nullable]) => (nullable ? (
                <AutoField key={key} label={label} value={inputs.tax.corporate[key]} auto={auto?.corporate?.[key]}
                           onChange={(value) => setTax('corporate', key, value)} />
              ) : (
                <PlainField key={key} label={label} value={inputs.tax.corporate[key]}
                            onChange={(value) => setTax('corporate', key, value)} />
              )))}
            </div>
            <AutoDetails fields={CORPORATE_FIELDS.filter(([, , nullable]) => nullable)} details={auto?.details}
                         prefix="corporate." />
          </div>
          <LineList title="Prior-year losses carried forward (label = fiscal year)"
                    items={inputs.tax.corporate.prior_losses} onChange={(items) => setTax('corporate', 'prior_losses', items)} />
          <LineList title="Other additions to taxable income"
                    items={inputs.tax.corporate.addbacks} onChange={(items) => setTax('corporate', 'addbacks', items)} />
          <LineList title="Other deductions from taxable income"
                    items={inputs.tax.corporate.deductions} onChange={(items) => setTax('corporate', 'deductions', items)} />
          <div className="fs-card">
            <h3>Local taxes</h3>
            <div className="fs-grid">
              {[['interim_pref', 'Interim prefectural tax paid'], ['interim_city', 'Interim municipal tax paid']].map(([key, label]) => (
                <div className="form-group" key={key}><label>{label}</label>
                  <input type="number" value={inputs.tax.local[key]}
                         onChange={(e) => setTax('local', key, Number(e.target.value) || 0)} /></div>
              ))}
            </div>
            <p className="fs-muted">Offices, per-capita levies and rates are set on the Company tab.</p>
          </div>
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
        <>
          {preview?.readiness && (
            <div className="fs-card">
              <div className="fs-card-head">
                <h3>Readiness checklist</h3>
                <span className="fs-muted">
                  {preview.readiness.filter((i) => i.status === 'todo').length} to do,{' '}
                  {preview.readiness.filter((i) => i.status === 'check').length} to check
                </span>
              </div>
              <p className="fs-muted">
                Fix the items marked To do, then confirm the ones marked Check against your records. Save your
                changes, then reopen this tab to refresh.
              </p>
              <ul className="fs-checklist">
                {preview.readiness.map((item) => (
                  <li key={item.key} className={`fs-check-item ${item.status}`}>
                    <span className="fs-status">{STATUS_LABELS[item.status]}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <div className="fs-muted">{item.detail}</div>
                    </div>
                    {item.status !== 'ok' && (
                      <button type="button" className="btn-secondary btn-small" onClick={() => setTab(item.tab)}>
                        Open
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="fs-card">
            <div className="fs-card-head">
              <h3>Download PDF</h3>
            </div>
            <p className="fs-muted">Each language is a separate file. Save your inputs first — unsaved changes are not included.</p>
            <div className="fs-options">
              <div>
                <strong>Style</strong>
                <label className="fs-check"><input type="radio" name="fs-mode" checked={mode === 'full'}
                  onChange={() => setMode('full')} /> Full — one form per page, like the official layout</label>
                <label className="fs-check"><input type="radio" name="fs-mode" checked={mode === 'simple'}
                  onChange={() => setMode('simple')} /> Simple — condensed, empty lines removed</label>
              </div>
              <div>
                <strong>Sections</strong>
                {PARTS.map(([key, label]) => (
                  <label className="fs-check" key={key}><input type="checkbox" checked={parts.includes(key)}
                    onChange={() => togglePart(key)} /> {label}</label>
                ))}
              </div>
            </div>
            <div className="fs-actions">
              <button className="btn-primary" disabled={busy || parts.length === 0} onClick={() => download('en')}>
                <Download size={16} /> English PDF
              </button>
              <button className="btn-primary" disabled={busy || parts.length === 0} onClick={() => download('ja')}>
                <Download size={16} /> Japanese PDF
              </button>
            </div>
          </div>
          <div className="fs-card">
            <div className="fs-card-head">
              <h3>Preview</h3>
              <button className="btn-secondary" disabled={busy} onClick={loadPreview}>
                <RefreshCw size={14} /> {preview ? 'Refresh' : 'Calculate'}
              </button>
            </div>
            {preview && (
              <>
                {[...preview.warnings, ...preview.tax_notes].map((w) => <div className="fs-warning" key={w}>{w}</div>)}
                <table className="fs-summary">
                  <tbody>
                    {[
                      ['Sales', preview.pl.sales, preview.sources.sales],
                      ['Gross profit', preview.pl.gross_profit],
                      ['Operating income', preview.pl.operating_income],
                      ['Net income', preview.pl.net_income],
                      ['Total assets', preview.bs.assets_total],
                      ['Total liabilities', preview.bs.liabilities_total],
                      ['Net assets', preview.bs.equity_total],
                      ['Consumption tax total (payable +, refund -)', preview.consumption.lines['26']],
                      ['Taxable income / loss', preview.corporate.income],
                      ['Corporate tax', preview.corporate.corp_tax],
                      ['Loss carried forward', preview.corporate.carry_total],
                      ['Local per-capita levies', preview.local.levy_total],
                    ].map(([label, value, source]) => (
                      <tr key={label}>
                        <td>{label}</td><td className="fs-num">{value === null ? '–' : `¥ ${yen(value)}`}</td>
                        <td className="fs-muted">{source === 'derived' ? 'from app data' : source === 'input' ? 'entered' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialStatements;
