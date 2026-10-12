import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import paperCss from "./Letterhead.css?inline";

const STORAGE_KEY = "letterhead_settings_v1";
const PAPER_PX = 794; // A4 width at 96dpi

const todayString = () => new Date().toISOString().slice(0, 10);

const buildDefaults = (profile) => ({
  logo: "",
  companyName: profile?.company_name || "",
  tagline: "",
  address: profile?.company_address || "",
  phone: profile?.company_phone || "",
  email: profile?.company_email || "",
  website: profile?.company_website || "",
  registration: profile?.business_registration || "",
  accent: "#1e3a8a",
  layout: "left",
  showFooter: true,
  footerText: "",
  refNo: "",
  date: todayString(),
  recipient: "",
  title: "",
  body: "",
  closing: "Sincerely,",
  signerName: "",
  signerRole: "",
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

const LetterheadPrinter = ({ profile }) => {
  const [form, setForm] = useState(() => {
    const defaults = buildDefaults(profile);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) return { ...defaults, ...saved, date: todayString() };
    } catch { /* ignore corrupt storage */ }
    return defaults;
  });
  const [scale, setScale] = useState(0.6);
  const stageRef = useRef(null);
  const paperRef = useRef(null);

  // Keep the saved letterhead (everything except the per-letter content) between visits.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch { /* storage full or blocked: preview and print still work */ }
  }, [form]);

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
    setForm((prev) => ({ ...prev, ...buildDefaults(profile), logo: prev.logo, accent: prev.accent, layout: prev.layout }));
    toast.success("Company details loaded from your settings");
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
      `<!doctype html><html><head><meta charset="utf-8"><title>${(form.companyName || "Letterhead").replace(/[<&]/g, "")}</title>` +
        `<style>${paperCss}@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}.lh-paper{min-height:296mm}</style></head><body>${paperRef.current.outerHTML}</body></html>`
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

  const contact = [
    form.address && ["Address", form.address],
    form.phone && ["Phone", form.phone],
    form.email && ["Email", form.email],
    form.website && ["Web", form.website],
    form.registration && ["Reg. No", form.registration],
  ].filter(Boolean);
  const centered = form.layout === "center";
  const footerLine =
    form.footerText || [form.companyName, form.email, form.website].filter(Boolean).join("  |  ");

  return (
    <div className="table-section">
      <div className="table-header"><h3>Letterhead</h3></div>
      <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
        Design your company letterhead, check the preview, then print it or save it as a PDF.
        Your letterhead details are remembered on this device.
      </p>

      <div className="lh-layout">
        <div className="lh-form">
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <button type="button" className="btn-secondary" onClick={fillFromProfile}>Use my company details</button>
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
          <div className="form-row">
            <div className="form-group">
              <label>Header Layout</label>
              <select name="layout" value={form.layout} onChange={onChange}>
                <option value="left">Logo left, name beside it</option>
                <option value="center">Centered</option>
              </select>
            </div>
            <div className="form-group" style={{ maxWidth: 140 }}>
              <label>Accent Color</label>
              <input type="color" name="accent" value={form.accent} onChange={onChange} style={{ height: 42, padding: 4 }} />
            </div>
          </div>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <input type="checkbox" name="showFooter" checked={form.showFooter} onChange={onChange} style={{ width: "auto" }} />
            Show footer line
          </label>
          {form.showFooter && (
            <div className="form-group"><label>Footer Text (optional)</label><input type="text" name="footerText" value={form.footerText} onChange={onChange} placeholder="Leave blank to use name, email and website" /></div>
          )}

          <h4 className="lh-section-title">Letter Content (optional)</h4>
          <div className="form-row">
            <div className="form-group"><label>Reference No.</label><input type="text" name="refNo" value={form.refNo} onChange={onChange} /></div>
            <div className="form-group"><label>Date</label><input type="date" name="date" value={form.date} onChange={onChange} /></div>
          </div>
          <div className="form-group"><label>Recipient</label><textarea name="recipient" value={form.recipient} onChange={onChange} rows="3" placeholder={"To,\nMr. Name\nCompany"} /></div>
          <div className="form-group"><label>Subject / Title</label><input type="text" name="title" value={form.title} onChange={onChange} /></div>
          <div className="form-group"><label>Letter Body</label><textarea name="body" value={form.body} onChange={onChange} rows="8" placeholder="Leave empty to print a blank letterhead" /></div>
          <div className="form-row">
            <div className="form-group"><label>Closing</label><input type="text" name="closing" value={form.closing} onChange={onChange} /></div>
            <div className="form-group"><label>Signatory Name</label><input type="text" name="signerName" value={form.signerName} onChange={onChange} /></div>
            <div className="form-group"><label>Signatory Title</label><input type="text" name="signerRole" value={form.signerRole} onChange={onChange} /></div>
          </div>
        </div>

        <div className="lh-preview">
          <div className="lh-preview-bar">
            <strong>Preview</strong>
            <button type="button" className="btn-primary" onClick={handlePrint}>Print / Save as PDF</button>
          </div>
          <div className="lh-stage" ref={stageRef}>
            <div style={{ width: PAPER_PX * scale, height: 1123 * scale, overflow: "hidden" }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PAPER_PX }}>
                <style>{paperCss}</style>
                <div className="lh-paper" ref={paperRef} style={{ "--lh-accent": form.accent }}>
                  <div className={`lh-head ${centered ? "lh-center" : ""}`}>
                    {form.logo && <img className="lh-logo" src={form.logo} alt="" />}
                    <div>
                      <h1 className="lh-name">{form.companyName || "Your Company Name"}</h1>
                      {form.tagline && <p className="lh-tagline">{form.tagline}</p>}
                    </div>
                  </div>
                  {contact.length > 0 && (
                    <div className={`lh-contact ${centered ? "lh-center" : ""}`}>
                      {contact.map(([label, value]) => (
                        <span key={label}><b>{label}:</b> {value}</span>
                      ))}
                    </div>
                  )}

                  {(form.refNo || form.date) && (
                    <div className="lh-meta">
                      <div>{form.refNo && <><b>Ref No:</b> {form.refNo}</>}</div>
                      <div className="lh-right">{form.date && <><b>Date:</b> {form.date}</>}</div>
                    </div>
                  )}
                  {form.recipient && <div className="lh-recipient">{form.recipient}</div>}
                  {form.title && <h2 className="lh-title"><span>{form.title}</span></h2>}
                  <div className="lh-body">{form.body}</div>

                  {(form.signerName || form.signerRole) && (
                    <div className="lh-sign">
                      {form.closing && <div className="lh-closing">{form.closing}</div>}
                      {form.signerName && <div className="lh-signer">{form.signerName}</div>}
                      {form.signerRole && <div className="lh-role">{form.signerRole}</div>}
                    </div>
                  )}

                  {form.showFooter && footerLine && <div className="lh-foot">{footerLine}</div>}
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
