import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FileText } from "lucide-react";
import { apiRequest, getErrorMessage, exportLetterheadDocxFromPayload, exportLetterheadDocxById } from "../api";
import paperCss from "./Letterhead.css?inline";

const STORAGE_KEY = "letterhead_settings_v2";
const PAPER_PX = 794; // A4 width at 96dpi

const todayString = () => new Date().toISOString().slice(0, 10);

// Decorative artwork, drawn on an A4 canvas of 210 x 297 units (mm). c1 = primary, c2 = secondary.
const chevron = (x, y, w, h, fill, key) => (
  <polygon
    key={key}
    fill={fill}
    points={`${x},${y} ${x + w},${y} ${x + w + h / 2},${y + h / 2} ${x + w},${y + h} ${x},${y + h} ${x + h / 2},${y + h / 2}`}
  />
);

const TEMPLATES = {
  angles: {
    label: "Angles",
    top: "36mm",
    bottom: "24mm",
    head: "lh-left",
    art: (c1, c2) => (
      <>
        <polygon fill={c1} points="0,0 125,0 98,17 0,17" />
        <polygon fill={c2} points="0,17 98,17 86,25 0,25" />
        <polygon fill={c2} points="160,0 210,0 210,14" />
        <polygon fill={c1} points="210,297 210,276 150,297" />
        <polygon fill={c2} points="210,297 210,287 176,297" />
        <polygon fill={c2} points="0,297 0,287 30,297" />
      </>
    ),
  },
  chevron: {
    label: "Chevron",
    top: "26mm",
    bottom: "22mm",
    head: "lh-left",
    art: (c1, c2) => (
      <>
        {[c1, c2, c1].map((c, i) => chevron(i * 10 - 4, 0, 7, 13, c, `t${i}`))}
        <g transform="translate(210,297) rotate(180)">
          {[c1, c2, c1].map((c, i) => chevron(i * 10 - 4, 0, 7, 13, c, `b${i}`))}
        </g>
        <rect x="0" y="294" width="150" height="3" fill={c1} />
      </>
    ),
  },
  wave: {
    label: "Wave",
    top: "32mm",
    bottom: "26mm",
    head: "lh-center",
    art: (c1, c2) => (
      <>
        <polygon fill={c1} points="0,0 210,0 210,10 105,22 0,10" />
        <polygon fill={c2} points="0,10 105,22 210,10 210,12.5 105,24.5 0,12.5" />
        <polygon fill={c1} points="0,297 0,291 105,284 210,291 210,297" />
        <polygon fill={c2} points="0,289 105,282 210,289 210,291 105,284 0,291" />
      </>
    ),
  },
  corner: {
    label: "Corner Cut",
    top: "18mm",
    bottom: "22mm",
    head: "lh-left lh-narrow",
    art: (c1, c2) => (
      <>
        <polygon fill={c1} points="210,0 210,44 118,0" />
        <polygon fill={c2} points="210,0 210,28 150,0" />
        <polygon fill={c1} points="0,297 0,278 42,297" />
        <polygon fill={c2} points="0,297 0,288 20,297" />
      </>
    ),
  },
  classic: {
    label: "Classic Bars",
    top: "20mm",
    bottom: "18mm",
    head: "lh-center",
    art: (c1, c2) => (
      <>
        <rect x="0" y="0" width="210" height="7" fill={c1} />
        <rect x="0" y="7" width="210" height="1.6" fill={c2} />
        <rect x="0" y="293" width="210" height="4" fill={c1} />
        <rect x="0" y="291.2" width="210" height="1.2" fill={c2} />
      </>
    ),
  },
};

const buildDefaults = (profile) => ({
  logo: "",
  companyName: profile?.company_name || "",
  tagline: "",
  address: profile?.company_address || "",
  phone: profile?.company_phone || "",
  email: profile?.company_email || "",
  website: profile?.company_website || "",
  registration: profile?.business_registration || "",
  template: "angles",
  color1: "#1e3a8a",
  color2: "#3b82f6",
  showDate: true,
  date: todayString(),
});

// Shrink the uploaded logo so it is cheap to keep in localStorage and to print.
const fileToLogoDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a valid image"));
      img.onload = () => {
        const max = 600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

// The editor works with camelCase form fields; the API uses snake_case record fields.
const toPayload = (form) => ({
  name: form.companyName.trim(),
  logo: form.logo,
  tagline: form.tagline,
  address: form.address,
  phone: form.phone,
  email: form.email,
  website: form.website,
  registration: form.registration,
  template: form.template,
  color1: form.color1,
  color2: form.color2,
  show_date: form.showDate,
});

const fromRecord = (r) => ({
  logo: r.logo || "",
  companyName: r.name || "",
  tagline: r.tagline || "",
  address: r.address || "",
  phone: r.phone || "",
  email: r.email || "",
  website: r.website || "",
  registration: r.registration || "",
  template: r.template,
  color1: r.color1,
  color2: r.color2,
  showDate: r.show_date,
});

const LetterheadPrinter = ({ profile }) => {
  const [form, setForm] = useState(() => {
    const defaults = buildDefaults(profile);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) return { ...defaults, ...saved, date: todayString() };
    } catch { /* ignore corrupt storage */ }
    return defaults;
  });
  const [saved, setSaved] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [scale, setScale] = useState(0.6);
  const stageRef = useRef(null);
  const paperRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch { /* storage full or blocked: preview and print still work */ }
  }, [form]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiRequest("/account/letterheads/");
        if (!response.ok) throw new Error(await getErrorMessage(response));
        const data = await response.json();
        if (!cancelled) setSaved(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) toast.error(error.message || "Failed to load saved letterheads");
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fit the A4 paper to the width of the preview column.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, (el.clientWidth - 2) / PAPER_PX));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const onChange = (e) => set(e.target.name, e.target.type === "checkbox" ? e.target.checked : e.target.value);

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      set("logo", await fileToLogoDataUrl(file));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fillFromProfile = () => {
    const d = buildDefaults(profile);
    setForm((prev) => ({
      ...prev,
      companyName: d.companyName,
      address: d.address,
      phone: d.phone,
      email: d.email,
      website: d.website,
      registration: d.registration,
    }));
    toast.success("Company details loaded from your settings");
  };

  const activeRecord = saved.find((r) => r.id === activeId) || null;
  const dirty = !!activeRecord && JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(fromRecord(activeRecord)));

  // Create (no id) or update (id) a saved letterhead on the server.
  const persist = async (id) => {
    if (!form.companyName.trim()) {
      toast.error("Enter a company name first, it is used as the saved name");
      return;
    }
    setBusy(true);
    try {
      const response = await apiRequest(id ? `/account/letterheads/${id}/` : "/account/letterheads/", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(toPayload(form)),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const record = await response.json();
      setSaved((prev) => (id ? prev.map((r) => (r.id === id ? record : r)) : [record, ...prev]));
      setActiveId(record.id);
      toast.success(id ? `Updated "${record.name}"` : `Saved "${record.name}"`);
    } catch (error) {
      toast.error(error.message || "Failed to save letterhead");
    } finally {
      setBusy(false);
    }
  };

  const loadRecord = (record) => {
    setForm({ ...buildDefaults(profile), ...fromRecord(record), date: todayString() });
    setActiveId(record.id);
    toast.info(`Loaded "${record.name}"`);
  };

  const deleteRecord = async (id) => {
    setBusy(true);
    try {
      const response = await apiRequest(`/account/letterheads/${id}/`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(await getErrorMessage(response));
      setSaved((prev) => prev.filter((r) => r.id !== id));
      if (activeId === id) setActiveId(null);
      toast.success("Letterhead deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete letterhead");
    } finally {
      setBusy(false);
      setConfirmDeleteId(null);
    }
  };

  const startBlank = () => {
    setForm(buildDefaults(profile));
    setActiveId(null);
  };

  const handlePrint = () => {
    if (!form.companyName.trim()) {
      toast.error("Please enter a company name first");
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${form.companyName.replace(/[<&]/g, "")} letterhead</title>` +
        `<style>${paperCss}@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}.lh-paper{height:296mm}</style></head><body>${paperRef.current.outerHTML}</body></html>`
    );
    doc.close();

    const cleanup = () => setTimeout(() => iframe.remove(), 500);
    const run = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.addEventListener("afterprint", cleanup);
      iframe.contentWindow.print();
    };
    // Wait for the logo to decode so it is not missing from the printout.
    const img = doc.querySelector("img");
    if (img && !img.complete) {
      img.onload = run;
      img.onerror = run;
    } else {
      setTimeout(run, 100);
    }
  };

  const handleExportDocx = async () => {
    if (!form.companyName.trim()) {
      toast.error("Please enter a company name first");
      return;
    }
    setExportingDocx(true);
    try {
      toast.info("Generating editable Word (.docx) letterhead...");
      const payload = {
        ...toPayload(form),
        date: form.date,
      };
      await exportLetterheadDocxFromPayload(payload, form.companyName);
      toast.success("Letterhead Word document (.docx) downloaded successfully");
    } catch (err) {
      toast.error(err.message || "Failed to export letterhead document");
    } finally {
      setExportingDocx(false);
    }
  };

  const handleExportSavedDocx = async (record) => {
    try {
      toast.info(`Exporting ${record.name} as Word document...`);
      await exportLetterheadDocxById(record.id, record.name);
      toast.success("Letterhead Word document (.docx) downloaded successfully");
    } catch (err) {
      toast.error(err.message || "Failed to export letterhead document");
    }
  };

  const tpl = TEMPLATES[form.template] || TEMPLATES.angles;
  const contact = [
    form.address && ["Address", form.address],
    form.phone && ["Phone", form.phone],
    form.email && ["Email", form.email],
    form.website && ["Web", form.website],
    form.registration && ["Reg. No", form.registration],
  ].filter(Boolean);

  return (
    <div className="table-section">
      <div className="table-header"><h3>Letterhead</h3></div>
      <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
        Pick a design, choose your colors, check the preview, then print it or save it as a PDF.
        Your letterhead details are remembered on this device.
      </p>

      <div className="lh-layout">
        <div className="lh-form">
          <h4 className="lh-section-title" style={{ marginTop: 0 }}>Saved Letterheads</h4>
          {loadingSaved ? (
            <p className="lh-empty">Loading...</p>
          ) : saved.length === 0 ? (
            <p className="lh-empty">Nothing saved yet. Design a letterhead below and press "Save as new".</p>
          ) : (
            <div className="lh-saved">
              {saved.map((r) => {
                const t = TEMPLATES[r.template] || TEMPLATES.angles;
                return (
                  <div key={r.id} className={`lh-saved-item ${r.id === activeId ? "active" : ""}`}>
                    <svg viewBox="0 0 210 297" width="30" height="42" style={{ flexShrink: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 2 }}>
                      {t.art(r.color1, r.color2)}
                    </svg>
                    <div className="lh-saved-info">
                      <strong>{r.name}</strong>
                      <small>{t.label} &middot; {new Date(r.updated_at).toLocaleDateString()}</small>
                    </div>
                    {confirmDeleteId === r.id ? (
                      <div className="lh-saved-actions">
                        <button type="button" className="btn-secondary" style={{ color: "#dc2626", borderColor: "#fca5a5" }} disabled={busy} onClick={() => deleteRecord(r.id)}>Delete?</button>
                        <button type="button" className="btn-secondary" onClick={() => setConfirmDeleteId(null)}>No</button>
                      </div>
                    ) : (
                      <div className="lh-saved-actions">
                        <button type="button" className="btn-secondary" onClick={() => loadRecord(r)}>{r.id === activeId ? "Reload" : "Use / Edit"}</button>
                        <button type="button" className="btn-secondary" title="Export as editable Word document (.docx)" onClick={() => handleExportSavedDocx(r)} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <FileText size={13} style={{ color: '#2563eb' }} /> Docs
                        </button>
                        <button type="button" className="btn-secondary" style={{ color: "#dc2626", borderColor: "#fca5a5" }} onClick={() => setConfirmDeleteId(r.id)} aria-label={`Delete ${r.name}`}>🗑️</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="lh-savebar">
            {activeRecord && (
              <span className="lh-editing">
                Editing <strong>{activeRecord.name}</strong>{dirty ? " (unsaved changes)" : ""}
              </span>
            )}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {activeRecord && <button type="button" className="btn-primary" onClick={() => persist(activeRecord.id)} disabled={busy || !dirty}>Update saved</button>}
              <button type="button" className={activeRecord ? "btn-secondary" : "btn-primary"} onClick={() => persist(null)} disabled={busy}>Save as new</button>
              <button type="button" className="btn-secondary" onClick={startBlank}>New blank</button>
              <button type="button" className="btn-secondary" onClick={fillFromProfile}>Use my company details</button>
            </div>
          </div>

          <h4 className="lh-section-title">Design</h4>
          <div className="lh-templates">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button
                type="button"
                key={key}
                className={`lh-template-btn ${form.template === key ? "active" : ""}`}
                onClick={() => set("template", key)}
              >
                <svg viewBox="0 0 210 297" width="54" height="76" style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 3 }}>
                  {t.art(form.color1, form.color2)}
                </svg>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="form-row">
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>Primary Color</label>
              <input type="color" name="color1" value={form.color1} onChange={onChange} style={{ height: 42, padding: 4 }} />
            </div>
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>Secondary Color</label>
              <input type="color" name="color2" value={form.color2} onChange={onChange} style={{ height: 42, padding: 4 }} />
            </div>
          </div>

          <h4 className="lh-section-title">Company</h4>
          <div className="form-group">
            <label>Logo</label>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              {form.logo && <img src={form.logo} alt="Logo" style={{ height: 44, maxWidth: 120, objectFit: "contain", border: "1px solid var(--border)", borderRadius: 8, padding: 4, background: "#fff" }} />}
              <input type="file" accept="image/*" onChange={onLogo} />
              {form.logo && <button type="button" className="btn-secondary" onClick={() => set("logo", "")}>Remove</button>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Company Name *</label><input type="text" name="companyName" value={form.companyName} onChange={onChange} /></div>
            <div className="form-group"><label>Tagline / Description</label><input type="text" name="tagline" value={form.tagline} onChange={onChange} placeholder="e.g. Automotive Group" /></div>
          </div>
          <div className="form-group"><label>Address</label><textarea name="address" value={form.address} onChange={onChange} rows="2" /></div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input type="text" name="phone" value={form.phone} onChange={onChange} /></div>
            <div className="form-group"><label>Email</label><input type="text" name="email" value={form.email} onChange={onChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Website</label><input type="text" name="website" value={form.website} onChange={onChange} /></div>
            <div className="form-group"><label>Registration No.</label><input type="text" name="registration" value={form.registration} onChange={onChange} /></div>
          </div>

          <h4 className="lh-section-title">Date</h4>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <input type="checkbox" name="showDate" checked={form.showDate} onChange={onChange} style={{ width: "auto" }} />
            Print a date above the footer
          </label>
          {form.showDate && (
            <div className="form-group" style={{ maxWidth: 220 }}>
              <label>Date</label>
              <input type="date" name="date" value={form.date} onChange={onChange} />
            </div>
          )}
        </div>

        <div className="lh-preview">
          <div className="lh-preview-bar">
            <strong>Preview</strong>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleExportDocx}
                disabled={exportingDocx}
                title="Export as editable Microsoft Word document (.docx)"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <FileText size={15} style={{ color: '#2563eb' }} />
                {exportingDocx ? "Exporting..." : "Export as Docs (.docx)"}
              </button>
              <button type="button" className="btn-primary" onClick={handlePrint}>
                Print / Save as PDF
              </button>
            </div>
          </div>
          <div className="lh-stage" ref={stageRef}>
            <div style={{ width: PAPER_PX * scale, height: 1123 * scale, overflow: "hidden" }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PAPER_PX }}>
                <style>{paperCss}</style>
                <div
                  className="lh-paper"
                  ref={paperRef}
                  style={{ "--lh-c1": form.color1, "--lh-c2": form.color2, "--lh-top": tpl.top, "--lh-bottom": tpl.bottom }}
                >
                  <svg className="lh-art" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">
                    {tpl.art(form.color1, form.color2)}
                  </svg>

                  <div className={`lh-head ${tpl.head}`}>
                    {form.logo && <img className="lh-logo" src={form.logo} alt="" />}
                    <div>
                      <h1 className="lh-name">{form.companyName || "Your Company Name"}</h1>
                      {form.tagline && <p className="lh-tagline">{form.tagline}</p>}
                    </div>
                  </div>

                  <div className="lh-spacer" />

                  {form.showDate && form.date && (
                    <div className="lh-date"><span><b>Date:</b> {form.date}</span></div>
                  )}
                  {contact.length > 0 && (
                    <div className="lh-foot">
                      {contact.map(([label, value]) => (
                        <span key={label}><b>{label}:</b> {value}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterheadPrinter;
