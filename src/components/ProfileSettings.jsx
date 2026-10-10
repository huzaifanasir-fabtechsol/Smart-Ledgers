import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequest } from "../api";
import "./ProfileSettings.css";

const INITIAL_PROFILE = {
  username: "",
  email: "",
  company_email: "",
  company_name: "",
  company_phone: "",
  company_website: "",
  company_address: "",
  business_registration: "",
  tax_rate: "10.00",
};

const INITIAL_PASSWORD = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

const INITIAL_TAX_FORM = { name: "", rate: "" };

const extractErrorMessage = async (response, fallbackMessage) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length > 0)
      return data.non_field_errors[0];
    if (data && typeof data === "object") {
      const [field, value] = Object.entries(data)[0] || [];
      if (Array.isArray(value) && value.length > 0) return `${field}: ${value[0]}`;
      if (typeof value === "string") return `${field}: ${value}`;
    }
  } catch { /* ignore */ }
  return fallbackMessage;
};

const ProfileSettings = ({ onUserUpdate }) => {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingTax, setSavingTax] = useState(false);

  const [taxRates, setTaxRates] = useState([]);
  const [loadingTaxRates, setLoadingTaxRates] = useState(false);
  const [taxForm, setTaxForm] = useState(INITIAL_TAX_FORM);
  const [editingTaxRate, setEditingTaxRate] = useState(null);
  const [savingTaxRate, setSavingTaxRate] = useState(false);
  const [deletingTaxRateId, setDeletingTaxRateId] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchTaxRates();
  }, []);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await apiRequest("/account/profile/");
      if (!response.ok) {
        const message = await extractErrorMessage(response, "Failed to load settings");
        throw new Error(message);
      }
      const data = await response.json();
      setProfile({
        username: data.username || "",
        email: data.email || "",
        company_email: data.company_email || "",
        company_name: data.company_name || "",
        company_phone: data.company_phone || "",
        company_website: data.company_website || "",
        company_address: data.company_address || "",
        business_registration: data.business_registration || "",
        tax_rate: data.tax_rate != null ? String(data.tax_rate) : "10.00",
      });
    } catch (error) {
      toast.error(error.message || "Failed to load settings");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await apiRequest("/account/profile/", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        const message = await extractErrorMessage(response, "Failed to update settings");
        throw new Error(message);
      }
      const updatedProfile = await response.json();
      const normalizedProfile = {
        username: updatedProfile.username || "",
        email: updatedProfile.email || "",
        company_email: updatedProfile.company_email || "",
        company_name: updatedProfile.company_name || "",
        company_phone: updatedProfile.company_phone || "",
        company_website: updatedProfile.company_website || "",
        company_address: updatedProfile.company_address || "",
        business_registration: updatedProfile.business_registration || "",
        tax_rate: updatedProfile.tax_rate != null ? String(updatedProfile.tax_rate) : "",
      };
      setProfile(normalizedProfile);
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const mergedUser = { ...parsed, ...normalizedProfile };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        if (onUserUpdate) onUserUpdate(mergedUser);
      }
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    setSavingTax(true);
    try {
      const response = await apiRequest("/account/profile/", {
        method: "PATCH",
        body: JSON.stringify({ tax_rate: profile.tax_rate }),
      });
      if (!response.ok) {
        const message = await extractErrorMessage(response, "Failed to update default tax rate");
        throw new Error(message);
      }
      const updatedProfile = await response.json();
      const updatedTaxRate = updatedProfile.tax_rate != null ? String(updatedProfile.tax_rate) : profile.tax_rate;
      setProfile((prev) => ({ ...prev, tax_rate: updatedTaxRate }));
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const mergedUser = { ...parsed, tax_rate: updatedTaxRate };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        if (onUserUpdate) onUserUpdate(mergedUser);
      }
      toast.success("Default tax rate updated");
    } catch (error) {
      toast.error(error.message || "Failed to update default tax rate");
    } finally {
      setSavingTax(false);
    }
  };

  const fetchTaxRates = async () => {
    setLoadingTaxRates(true);
    try {
      const response = await apiRequest("/account/tax-rates/");
      if (!response.ok) throw new Error("Failed to load tax rates");
      const data = await response.json();
      setTaxRates(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load tax rates");
    } finally {
      setLoadingTaxRates(false);
    }
  };

  const handleTaxRateFormChange = (e) => {
    const { name, value } = e.target;
    setTaxForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaxRateSubmit = async (e) => {
    e.preventDefault();
    if (!taxForm.name.trim()) { toast.error("Tax rate name is required"); return; }
    if (taxForm.rate === "" || isNaN(Number(taxForm.rate))) { toast.error("A valid rate is required"); return; }
    setSavingTaxRate(true);
    try {
      const url = editingTaxRate ? `/account/tax-rates/${editingTaxRate.id}/` : "/account/tax-rates/";
      const method = editingTaxRate ? "PATCH" : "POST";
      const response = await apiRequest(url, {
        method,
        body: JSON.stringify({ name: taxForm.name.trim(), rate: Number(taxForm.rate) }),
      });
      if (!response.ok) {
        const message = await extractErrorMessage(response, "Failed to save tax rate");
        throw new Error(message);
      }
      toast.success(editingTaxRate ? "Tax rate updated" : "Tax rate added");
      setTaxForm(INITIAL_TAX_FORM);
      setEditingTaxRate(null);
      await fetchTaxRates();
    } catch (error) {
      toast.error(error.message || "Failed to save tax rate");
    } finally {
      setSavingTaxRate(false);
    }
  };

  const handleEditTaxRate = (tr) => {
    setEditingTaxRate(tr);
    setTaxForm({ name: tr.name, rate: String(tr.rate) });
  };

  const handleDeleteTaxRate = async (id) => {
    setDeletingTaxRateId(id);
    try {
      const response = await apiRequest(`/account/tax-rates/${id}/`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error("Failed to delete");
      toast.success("Tax rate deleted");
      await fetchTaxRates();
    } catch (error) {
      toast.error(error.message || "Failed to delete tax rate");
    } finally {
      setDeletingTaxRateId(null);
    }
  };

  const submitPasswordChange = async () => {
    const payload = {
      current_password: passwordForm.current_password,
      old_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
      confirm_password: passwordForm.confirm_password,
    };
    return await apiRequest("/account/profile/", { method: "PATCH", body: JSON.stringify(payload) });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New password and confirmation do not match");
      return;
    }
    setSavingPassword(true);
    try {
      const response = await submitPasswordChange();
      if (!response || !response.ok) {
        const message = response
          ? await extractErrorMessage(response, "Failed to change password")
          : "Password endpoint not found";
        throw new Error(message);
      }
      setPasswordForm(INITIAL_PASSWORD);
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingProfile) {
    return <div className="loader">Loading settings...</div>;
  }

  return (
    <div className="profile-settings">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h3>Account &amp; Company Information</h3>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1.25rem", marginBottom:"2rem", padding:"0 0.5rem" }}>
          <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"var(--color-violet-soft)", color:"var(--color-ink)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", fontWeight:"800", fontFamily:"var(--font-display)", textTransform:"uppercase", boxShadow:"var(--shadow-card)" }}>
            {profile.username ? profile.username.substring(0, 2) : "SL"}
          </div>
          <div>
            <h4 style={{ margin:0, fontSize:"1.1rem", fontWeight:700, color:"var(--ink)" }}>{profile.username || "User"}</h4>
            <p style={{ margin:"0.25rem 0 0 0", fontSize:"0.8125rem", color:"var(--muted-foreground)" }}>{profile.email || "No email set"}</p>
          </div>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-group"><label>Username</label><input type="text" name="username" value={profile.username} onChange={handleProfileChange} required /></div>
            <div className="form-group"><label>Email</label><input type="email" name="email" value={profile.email} onChange={handleProfileChange} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Company Name</label><input type="text" name="company_name" value={profile.company_name} onChange={handleProfileChange} /></div>
            <div className="form-group"><label>Company Email</label><input type="email" name="company_email" value={profile.company_email} onChange={handleProfileChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Company Phone</label><input type="text" name="company_phone" value={profile.company_phone} onChange={handleProfileChange} /></div>
            <div className="form-group"><label>Company Website</label><input type="text" name="company_website" value={profile.company_website} onChange={handleProfileChange} /></div>
          </div>
          <div className="form-group"><label>Company Address</label><textarea name="company_address" value={profile.company_address} onChange={handleProfileChange} rows="3" /></div>
          <div className="form-group"><label>Business Registration</label><textarea name="business_registration" value={profile.business_registration} onChange={handleProfileChange} rows="3" /></div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Settings"}</button>
        </form>
      </div>

      <div className="table-section">
        <div className="table-header"><h3>Tax Settings</h3></div>
        <p style={{ margin:"0 0 1.5rem 0", fontSize:"0.875rem", color:"var(--muted-foreground)" }}>
          Define named tax rates to choose from when recording expenses. Also set a system-wide default rate.
        </p>

        <form onSubmit={handleTaxSubmit} style={{ marginBottom:"2rem", paddingBottom:"1.5rem", borderBottom:"1px solid var(--border)" }}>
          <div className="form-row">
            <div className="form-group" style={{ maxWidth:"300px" }}>
              <label>Default Tax Rate (%)</label>
              <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                <input type="number" step="0.01" min="0" max="100" name="tax_rate" value={profile.tax_rate} onChange={handleProfileChange} placeholder="10.00" style={{ paddingRight:"2.5rem" }} required />
                <span style={{ position:"absolute", right:"12px", color:"var(--muted-foreground)", fontWeight:600, fontSize:"0.9rem", pointerEvents:"none" }}>%</span>
              </div>
              <small style={{ color:"var(--muted-foreground)", marginTop:"0.35rem", display:"block" }}>System-wide default preset for new expenses.</small>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={savingTax}>{savingTax ? "Saving..." : "Save Default Rate"}</button>
        </form>

        <h4 style={{ margin:"0 0 1rem 0", fontWeight:700, fontSize:"0.95rem" }}>Saved Tax Rates</h4>
        <div className="table-container" style={{ marginBottom:"1.5rem" }}>
          <table>
            <thead><tr><th>Name</th><th style={{ width:"100px" }}>Rate (%)</th><th style={{ width:"130px" }}>Actions</th></tr></thead>
            <tbody>
              {loadingTaxRates ? (
                <tr><td colSpan="3"><div style={{ padding:"1rem", textAlign:"center" }}>Loading...</div></td></tr>
              ) : taxRates.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign:"center", color:"var(--muted-foreground)", padding:"1.5rem" }}>No tax rates defined yet</td></tr>
              ) : (
                taxRates.map((tr) => (
                  <tr key={tr.id}>
                    <td style={{ fontWeight:600 }}>{tr.name}</td>
                    <td>{Number(tr.rate).toFixed(2)}%</td>
                    <td>
                      <div style={{ display:"flex", gap:"0.4rem" }}>
                        <button className="btn-secondary" style={{ padding:"0.25rem 0.65rem", fontSize:"0.78rem" }} onClick={() => handleEditTaxRate(tr)}>✏️ Edit</button>
                        <button className="btn-secondary" style={{ padding:"0.25rem 0.65rem", fontSize:"0.78rem", color:"#dc2626", borderColor:"#fca5a5" }} onClick={() => handleDeleteTaxRate(tr.id)} disabled={deletingTaxRateId === tr.id}>{deletingTaxRateId === tr.id ? "..." : "🗑️"}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ background:"var(--secondary)", borderRadius:"16px", padding:"1.25rem", border:"1px solid var(--border)" }}>
          <h4 style={{ margin:"0 0 1rem 0", fontWeight:700, fontSize:"0.9rem" }}>
            {editingTaxRate ? `Editing: ${editingTaxRate.name}` : "Add New Tax Rate"}
          </h4>
          <form onSubmit={handleTaxRateSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={taxForm.name} onChange={handleTaxRateFormChange} placeholder="e.g. Consumption Tax" required />
              </div>
              <div className="form-group" style={{ maxWidth:"180px" }}>
                <label>Rate (%)</label>
                <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                  <input type="number" step="0.01" min="0" max="100" name="rate" value={taxForm.rate} onChange={handleTaxRateFormChange} placeholder="10.00" style={{ paddingRight:"2.5rem" }} required />
                  <span style={{ position:"absolute", right:"12px", color:"var(--muted-foreground)", fontWeight:600, pointerEvents:"none" }}>%</span>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button type="submit" className="btn-primary" disabled={savingTaxRate}>{savingTaxRate ? "Saving..." : editingTaxRate ? "Update Rate" : "Add Tax Rate"}</button>
              {editingTaxRate && (
                <button type="button" className="btn-secondary" onClick={() => { setEditingTaxRate(null); setTaxForm(INITIAL_TAX_FORM); }}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="table-section">
        <div className="table-header"><h3>Change Password</h3></div>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-row">
            <div className="form-group"><label>Current Password</label><input type="password" name="current_password" value={passwordForm.current_password} onChange={handlePasswordChange} required /></div>
            <div className="form-group"><label>New Password</label><input type="password" name="new_password" value={passwordForm.new_password} onChange={handlePasswordChange} required /></div>
            <div className="form-group"><label>Confirm New Password</label><input type="password" name="confirm_password" value={passwordForm.confirm_password} onChange={handlePasswordChange} required /></div>
          </div>
          <button type="submit" className="btn-primary" disabled={savingPassword}>{savingPassword ? "Updating..." : "Update Password"}</button>
        </form>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ProfileSettings;
