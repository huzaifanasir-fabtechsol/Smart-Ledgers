import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiRequest } from '../api';
import './ProfileSettings.css';

const INITIAL_PROFILE = {
  username: '',
  email: '',
  company_email: '',
  company_name: '',
  company_phone: '',
  company_website: '',
  company_address: '',
};

const INITIAL_PASSWORD = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

const extractErrorMessage = async (response, fallbackMessage) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }
    if (data && typeof data === 'object') {
      const [field, value] = Object.entries(data)[0] || [];
      if (Array.isArray(value) && value.length > 0) {
        return `${field}: ${value[0]}`;
      }
      if (typeof value === 'string') {
        return `${field}: ${value}`;
      }
    }
  } catch {
    // Ignore JSON parsing issues and use fallback.
  }
  return fallbackMessage;
};

const ProfileSettings = ({ onUserUpdate }) => {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await apiRequest('/account/profile/');
      if (!response.ok) {
        const message = await extractErrorMessage(response, 'Failed to load profile');
        throw new Error(message);
      }

      const data = await response.json();
      setProfile({
        username: data.username || '',
        email: data.email || '',
        company_email: data.company_email || '',
        company_name: data.company_name || '',
        company_phone: data.company_phone || '',
        company_website: data.company_website || '',
        company_address: data.company_address || '',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const response = await apiRequest('/account/profile/', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response, 'Failed to update profile');
        throw new Error(message);
      }

      const updatedProfile = await response.json();
      const normalizedProfile = {
        username: updatedProfile.username || '',
        email: updatedProfile.email || '',
        company_email: updatedProfile.company_email || '',
        company_name: updatedProfile.company_name || '',
        company_phone: updatedProfile.company_phone || '',
        company_website: updatedProfile.company_website || '',
        company_address: updatedProfile.company_address || '',
      };

      setProfile(normalizedProfile);

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const mergedUser = { ...parsed, ...normalizedProfile };
        localStorage.setItem('user', JSON.stringify(mergedUser));
        if (onUserUpdate) {
          onUserUpdate(mergedUser);
        }
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPasswordChange = async () => {
    const payload = {
      current_password: passwordForm.current_password,
      old_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
      confirm_password: passwordForm.confirm_password,
    };

    const endpoints = ['/account/profile/', '/account/profile/'];
    let lastResponse = null;

    for (const endpoint of endpoints) {
      const response = await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        lastResponse = response;
        continue;
      }

      return response;
    }

    return lastResponse;
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setSavingPassword(true);

    try {
      const response = await submitPasswordChange();
      if (!response || !response.ok) {
        const message = response
          ? await extractErrorMessage(response, 'Failed to change password')
          : 'Password endpoint not found';
        throw new Error(message);
      }

      setPasswordForm(INITIAL_PASSWORD);
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingProfile) {
    return <div className="loader">Loading profile...</div>;
  }

  return (
    <div className="profile-settings">
      <div className="page-header">
        <h2>Profile Settings</h2>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h3>Account & Company Information</h3>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="company_name"
                value={profile.company_name}
                onChange={handleProfileChange}
              />
            </div>
            <div className="form-group">
              <label>Company Email</label>
              <input
                type="email"
                name="company_email"
                value={profile.company_email}
                onChange={handleProfileChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company Phone</label>
              <input
                type="text"
                name="company_phone"
                value={profile.company_phone}
                onChange={handleProfileChange}
              />
            </div>
            <div className="form-group">
              <label>Company Website</label>
              <input
                type="text"
                name="company_website"
                value={profile.company_website}
                onChange={handleProfileChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Company Address</label>
            <textarea
              name="company_address"
              value={profile.company_address}
              onChange={handleProfileChange}
              rows="3"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h3>Change Password</h3>
        </div>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={savingPassword}>
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ProfileSettings;
