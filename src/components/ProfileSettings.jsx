import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Settings,
  Building2,
  Percent,
  KeyRound,
  Lock,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  MapPin,
  Hash,
  Check,
  Plus,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { apiRequest } from "../api";
import { useUser } from "../context/UserContext";
import PageHeader from "./PageHeader";
import FormHero from "./FormHero";
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
    if (typeof data?.error === "string") return data.error;
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

const ProfileSettings = ({ onUserUpdate, onLockPinChange }) => {
  const location = useLocation();
  const { refreshUser } = useUser();
  const [hasLockPin, setHasLockPin] = useState(false);
  const [pinForm, setPinForm] = useState({ pin: "", confirm_pin: "", password: "" });
  const [savingPin, setSavingPin] = useState(false);
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
    if (location.state?.needLockPin) toast.info("Set a 6-digit lock PIN below to use Ctrl + Q");
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
      setHasLockPin(Boolean(data.has_lock_pin));
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

  const submitLockPin = async (method, body, successMessage) => {
    setSavingPin(true);
    try {
      const response = await apiRequest("/account/lock-pin/", { method, body: JSON.stringify(body) });
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Failed to update lock PIN"));
      }
      const data = await response.json();
      setHasLockPin(Boolean(data.has_lock_pin));
      if (onLockPinChange) onLockPinChange(Boolean(data.has_lock_pin));
      setPinForm({ pin: "", confirm_pin: "", password: "" });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message || "Failed to update lock PIN");
    } finally {
      setSavingPin(false);
    }
  };

  const handleSetPin = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinForm.pin)) return toast.error("PIN must be exactly 6 digits");
    if (pinForm.pin !== pinForm.confirm_pin) return toast.error("PINs do not match");
    submitLockPin("PUT", { pin: pinForm.pin, password: pinForm.password }, hasLockPin ? "Lock PIN updated" : "Lock PIN set");
  };

  const handleRemovePin = () => {
    if (!pinForm.password) return toast.error("Enter your account password to remove the PIN");
    submitLockPin("DELETE", { password: pinForm.password }, "Lock PIN removed");
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
      refreshUser();
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

  return (
    <div className="profile-settings">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Configure organization branding, lock PIN, tax rate templates, and account credentials"
        icon={Settings}
        category="Administration"
        companyName={profile.company_name}
      />

      <FormHero
        variant="settings"
        icon={Settings}
        eyebrow="Workspace settings"
        title={profile.company_name ? `${profile.company_name} preferences` : "Settings & Preferences"}
        subtitle="Keep company details, tax presets, the lock PIN and your password up to date. Changes apply across invoices, expenses and letterheads."
      />

      {loadingProfile ? (
        <div className="settings-card">
          <div className="table-loader-container">
            <div className="spinner"></div>
            <span>Loading settings & preferences...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Card 1: Account & Company Information */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-icon-box emerald">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="settings-card-heading">Account &amp; Company Information</h3>
                  <p className="settings-card-sub">Identity details, business registration, contact and location records</p>
                </div>
              </div>
              <span className="settings-badge emerald">Enterprise Profile</span>
            </div>

            <div className="settings-user-hero">
              <div className="settings-avatar-wrap">
                <div className="settings-avatar-large">
                  {profile.username ? profile.username.substring(0, 2).toUpperCase() : "SL"}
                </div>
              </div>
              <div className="settings-user-info">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h4 className="settings-user-name">{profile.company_name || profile.username || "User"}</h4>
                  <span className="settings-badge emerald" style={{ fontSize: "0.68rem", padding: "2px 8px" }}>Active Admin</span>
                </div>
                <p className="settings-user-email">{profile.email || "No email set"}</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label className="settings-label"><User size={13} /> Username</label>
                  <div className="settings-input-wrap">
                    <User size={15} className="settings-input-icon" />
                    <input type="text" name="username" className="settings-input" value={profile.username} onChange={handleProfileChange} required />
                  </div>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label"><Mail size={13} /> Personal Email</label>
                  <div className="settings-input-wrap">
                    <Mail size={15} className="settings-input-icon" />
                    <input type="email" name="email" className="settings-input" value={profile.email} onChange={handleProfileChange} required />
                  </div>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label"><Building2 size={13} /> Company Legal Name</label>
                  <div className="settings-input-wrap">
                    <Building2 size={15} className="settings-input-icon" />
                    <input type="text" name="company_name" className="settings-input" value={profile.company_name} onChange={handleProfileChange} />
                  </div>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label"><Mail size={13} /> Corporate Email</label>
                  <div className="settings-input-wrap">
                    <Mail size={15} className="settings-input-icon" />
                    <input type="email" name="company_email" className="settings-input" value={profile.company_email} onChange={handleProfileChange} />
                  </div>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label"><Phone size={13} /> Company Phone</label>
                  <div className="settings-input-wrap">
                    <Phone size={15} className="settings-input-icon" />
                    <input type="text" name="company_phone" className="settings-input" value={profile.company_phone} onChange={handleProfileChange} />
                  </div>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label"><Globe size={13} /> Company Website</label>
                  <div className="settings-input-wrap">
                    <Globe size={15} className="settings-input-icon" />
                    <input type="text" name="company_website" className="settings-input" value={profile.company_website} onChange={handleProfileChange} />
                  </div>
                </div>

                <div className="settings-form-group full-width">
                  <label className="settings-label"><MapPin size={13} /> Company Physical Address</label>
                  <textarea name="company_address" className="settings-textarea" value={profile.company_address} onChange={handleProfileChange} rows="3" />
                </div>

                <div className="settings-form-group full-width">
                  <label className="settings-label"><Hash size={13} /> Business Registration / Corporate Number</label>
                  <textarea name="business_registration" className="settings-textarea" value={profile.business_registration} onChange={handleProfileChange} rows="3" />
                </div>
              </div>

              <button type="submit" className="settings-btn-primary" disabled={savingProfile}>
                <Check size={16} />
                {savingProfile ? "Saving Settings..." : "Save Settings"}
              </button>
            </form>
          </div>

          {/* Card 2: Tax Settings */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-icon-box purple">
                  <Percent size={22} />
                </div>
                <div>
                  <h3 className="settings-card-heading">Tax Settings</h3>
                  <p className="settings-card-sub">Define named consumption tax rates and configure the system-wide default preset</p>
                </div>
              </div>
              <span className="settings-badge purple">JCT Presets</span>
            </div>

            <form onSubmit={handleTaxSubmit} style={{ marginBottom: "2rem", paddingBottom: "1.75rem", borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }}>
              <div className="settings-form-group" style={{ maxWidth: "340px", marginBottom: "1.25rem" }}>
                <label className="settings-label">Default Tax Rate (%)</label>
                <div className="settings-input-wrap">
                  <Percent size={15} className="settings-input-icon" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    name="tax_rate"
                    className="settings-input"
                    value={profile.tax_rate}
                    onChange={handleProfileChange}
                    placeholder="10.00"
                    style={{ paddingRight: "3rem" }}
                    required
                  />
                  <span style={{ position: "absolute", right: "14px", color: "var(--muted-foreground)", fontWeight: 750, fontSize: "0.85rem", pointerEvents: "none" }}>%</span>
                </div>
                <small style={{ color: "var(--muted-foreground)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                  Standard preset applied automatically when creating new expenses.
                </small>
              </div>
              <button type="submit" className="settings-btn-primary" disabled={savingTax}>
                <Check size={16} />
                {savingTax ? "Saving Default..." : "Save Default Rate"}
              </button>
            </form>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, fontWeight: 750, fontSize: "1rem", color: "var(--ink)" }}>Saved Tax Rates</h4>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{taxRates.length} configured rates</span>
            </div>

            <div className="table-container" style={{ minHeight: "auto", marginBottom: "1.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ width: "140px" }}>Rate (%)</th>
                    <th style={{ width: "150px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTaxRates ? (
                    <tr>
                      <td colSpan="3">
                        <div className="table-loader-container" style={{ minHeight: "120px", padding: "1.5rem" }}>
                          <div className="spinner"></div>
                          <span>Loading tax rates...</span>
                        </div>
                      </td>
                    </tr>
                  ) : taxRates.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "2rem" }}>
                        No custom tax rates defined yet
                      </td>
                    </tr>
                  ) : (
                    taxRates.map((tr) => (
                      <tr key={tr.id}>
                        <td style={{ fontWeight: 650, color: "var(--ink)" }}>{tr.name}</td>
                        <td>
                          <span className="rate-pill">{Number(tr.rate).toFixed(2)}%</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="button"
                              className="settings-btn-secondary"
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
                              onClick={() => handleEditTaxRate(tr)}
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="settings-btn-danger"
                              onClick={() => handleDeleteTaxRate(tr.id)}
                              disabled={deletingTaxRateId === tr.id}
                            >
                              <Trash2 size={13} /> {deletingTaxRateId === tr.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="settings-subcard">
              <h4 className="settings-subcard-title">
                <Plus size={16} style={{ color: "#7e22ce" }} />
                {editingTaxRate ? `Editing Tax Rate: ${editingTaxRate.name}` : "Add New Named Tax Rate"}
              </h4>
              <form onSubmit={handleTaxRateSubmit}>
                <div className="settings-form-grid" style={{ marginBottom: "1rem" }}>
                  <div className="settings-form-group">
                    <label className="settings-label">Rate Name</label>
                    <input
                      type="text"
                      name="name"
                      className="settings-input no-icon"
                      value={taxForm.name}
                      onChange={handleTaxRateFormChange}
                      placeholder="e.g. Reduced Food Rate, Zero-Rated Export"
                      required
                    />
                  </div>
                  <div className="settings-form-group" style={{ maxWidth: "220px" }}>
                    <label className="settings-label">Tax Rate (%)</label>
                    <div className="settings-input-wrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="rate"
                        className="settings-input no-icon"
                        value={taxForm.rate}
                        onChange={handleTaxRateFormChange}
                        placeholder="8.00"
                        style={{ paddingRight: "2.5rem" }}
                        required
                      />
                      <span style={{ position: "absolute", right: "12px", color: "var(--muted-foreground)", fontWeight: 700, pointerEvents: "none" }}>%</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button type="submit" className="settings-btn-primary" disabled={savingTaxRate}>
                    <Check size={16} />
                    {savingTaxRate ? "Saving..." : editingTaxRate ? "Update Rate" : "Add Tax Rate"}
                  </button>
                  {editingTaxRate && (
                    <button
                      type="button"
                      className="settings-btn-secondary"
                      onClick={() => { setEditingTaxRate(null); setTaxForm(INITIAL_TAX_FORM); }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Card 3: Change Password */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-icon-box amber">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="settings-card-heading">Change Password</h3>
                  <p className="settings-card-sub">Update your account login password with strong authentication</p>
                </div>
              </div>
              <span className="settings-badge amber">Credentials</span>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="settings-form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div className="settings-form-group">
                  <label className="settings-label"><Lock size={13} /> Current Password</label>
                  <div className="settings-input-wrap">
                    <Lock size={15} className="settings-input-icon" />
                    <input
                      type="password"
                      name="current_password"
                      className="settings-input"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div className="settings-form-group">
                  <label className="settings-label"><KeyRound size={13} /> New Password</label>
                  <div className="settings-input-wrap">
                    <KeyRound size={15} className="settings-input-icon" />
                    <input
                      type="password"
                      name="new_password"
                      className="settings-input"
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div className="settings-form-group">
                  <label className="settings-label"><Check size={13} /> Confirm New Password</label>
                  <div className="settings-input-wrap">
                    <Check size={15} className="settings-input-icon" />
                    <input
                      type="password"
                      name="confirm_password"
                      className="settings-input"
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="settings-btn-primary" disabled={savingPassword}>
                <KeyRound size={16} />
                {savingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Card 4: Screen Lock PIN */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-icon-box cyan">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="settings-card-heading">Screen Lock PIN (Ctrl + Q)</h3>
                  <p className="settings-card-sub">Instantly blank and secure your workstation when away from your desk</p>
                </div>
              </div>
              <span className={`settings-badge ${hasLockPin ? "emerald" : "amber"}`}>
                {hasLockPin ? "PIN Protected" : "Not Set"}
              </span>
            </div>

            <p style={{ margin: "0 0 1.5rem", color: "var(--muted-foreground)", fontSize: "0.85rem", lineHeight: 1.5 }}>
              Press <kbd style={{ padding: "2px 6px", background: "rgba(226, 232, 240, 0.8)", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: 700, fontSize: "0.8rem" }}>Ctrl + Q</kbd> anywhere in the application to instantly lock the view until your 6-digit security PIN is entered. Your login password is required to {hasLockPin ? "change or remove" : "set"} it.
            </p>

            <form onSubmit={handleSetPin}>
              <div className="settings-form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div className="settings-form-group">
                  <label className="settings-label"><Lock size={13} /> {hasLockPin ? "New PIN" : "PIN"} (6 digits)</label>
                  <div className="settings-input-wrap">
                    <Lock size={15} className="settings-input-icon" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="off"
                      className="settings-input"
                      value={pinForm.pin}
                      onChange={(e) => setPinForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "") }))}
                      placeholder="6 digits (0-9)"
                      required
                    />
                  </div>
                </div>
                <div className="settings-form-group">
                  <label className="settings-label"><Check size={13} /> Confirm PIN</label>
                  <div className="settings-input-wrap">
                    <Check size={15} className="settings-input-icon" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="off"
                      className="settings-input"
                      value={pinForm.confirm_pin}
                      onChange={(e) => setPinForm((p) => ({ ...p, confirm_pin: e.target.value.replace(/\D/g, "") }))}
                      placeholder="Repeat 6 digits"
                      required
                    />
                  </div>
                </div>
                <div className="settings-form-group">
                  <label className="settings-label"><KeyRound size={13} /> Account Password</label>
                  <div className="settings-input-wrap">
                    <KeyRound size={15} className="settings-input-icon" />
                    <input
                      type="password"
                      autoComplete="current-password"
                      className="settings-input"
                      value={pinForm.password}
                      onChange={(e) => setPinForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Your account password"
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
                <button type="submit" className="settings-btn-primary" disabled={savingPin}>
                  <ShieldCheck size={16} />
                  {savingPin ? "Saving PIN..." : hasLockPin ? "Update PIN" : "Set PIN"}
                </button>
                {hasLockPin && (
                  <button
                    type="button"
                    className="settings-btn-danger"
                    disabled={savingPin}
                    onClick={handleRemovePin}
                  >
                    <Trash2 size={15} /> Remove PIN
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ProfileSettings;
