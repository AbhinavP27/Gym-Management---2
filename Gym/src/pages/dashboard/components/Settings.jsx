import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaUser, FaShieldAlt, FaCog } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import "./styl/Settings.css";

const Settings = ({ role }) => {
  const { currentUser, login } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const names = (currentUser?.name || "John Doe").split(" ");
  const currentFirstName = names[0] || "";
  const currentLastName = names.slice(1).join(" ") || "";

  const [profile, setProfile] = useState({
    firstName: currentFirstName,
    lastName: currentLastName,
    phone: currentUser?.phone || "",
  });

  const [security, setSecurity] = useState({
    email: currentUser?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
  });

  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem("app-theme") || "dark",
    emailAlerts: true,
    smsAlerts: false,
  });

  useEffect(() => {
    // Remove all possible theme classes
    const themes = ["theme-light", "theme-midnight", "theme-emerald", "theme-sunset", "theme-ocean", "theme-obsidian"];
    document.body.classList.remove(...themes);
    
    // Apply selected theme
    if (preferences.theme !== "dark") {
      document.body.classList.add(`theme-${preferences.theme}`);
    }
    
    localStorage.setItem("app-theme", preferences.theme);
  }, [preferences.theme]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setSecurity({ ...security, [e.target.name]: value });
  };

  const handlePreferencesChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setPreferences({ ...preferences, [e.target.name]: value });
  };

  const saveProfile = (e) => {
    e.preventDefault();
    if (currentUser) {
      login({ ...currentUser, name: `${profile.firstName} ${profile.lastName}`.trim(), phone: profile.phone });
    }
    toast.success("Profile updated successfully!");
  };

  const saveEmailData = (e) => {
    e.preventDefault();
    if (currentUser) {
      login({ ...currentUser, email: security.email });
    }
    toast.success("Email update link sent!");
  };

  const savePasswordData = (e) => {
    e.preventDefault();
    if(security.newPassword !== security.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    toast.success("Password changed successfully!");
    setSecurity({...security, currentPassword: '', newPassword: '', confirmPassword: ''});
  };

  return (
    <DashboardLayout role={role}>
      <div className="settings-page">
        <div className="settings-page__header">
          <h1>Account Settings</h1>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <button 
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FaUser /> Profile
            </button>
            <button 
              className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FaShieldAlt /> Security
            </button>
            <button 
              className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <FaCog /> Preferences
            </button>
          </div>

          <div className="settings-panel">
            {activeTab === 'profile' && (
              <div className="settings-card fade-in">
                <h2>Personal Information</h2>
                <p className="desc">Update your personal details here.</p>
                
                <div className="avatar-upload-section">
                  <div className="avatar-preview">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                  <div className="avatar-upload-actions">
                    <button className="btn-outline">Upload new photo</button>
                    <span style={{color: '#94a3b8', fontSize: '13px'}}>At least 800x800 px recommended. JPG or PNG.</span>
                  </div>
                </div>

                <form className="settings-form" onSubmit={saveProfile}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input name="firstName" value={profile.firstName} onChange={handleProfileChange} />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input name="lastName" value={profile.lastName} onChange={handleProfileChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone" value={profile.phone} onChange={handleProfileChange} />
                  </div>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-form">
                <div className="settings-card fade-in">
                  <h2>Email Address</h2>
                  <p className="desc">Manage the email address associated with your account.</p>
                  <form className="settings-form" onSubmit={saveEmailData}>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" name="email" value={security.email} onChange={handleSecurityChange} />
                    </div>
                    <button type="submit" className="btn-primary">Update Email</button>
                  </form>
                </div>

                <div className="settings-card fade-in">
                  <h2>Change Password</h2>
                  <p className="desc">Ensure your account is using a long, random password to stay secure.</p>
                  <form className="settings-form" onSubmit={savePasswordData}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input type="password" name="currentPassword" value={security.currentPassword} onChange={handleSecurityChange} required />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input type="password" name="newPassword" value={security.newPassword} onChange={handleSecurityChange} required />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input type="password" name="confirmPassword" value={security.confirmPassword} onChange={handleSecurityChange} required />
                    </div>
                    <button type="submit" className="btn-primary">Change Password</button>
                  </form>
                </div>

                 <div className="settings-card fade-in">
                  <h2>Two-Factor Authentication</h2>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Enable 2FA</h4>
                      <p>Add an extra layer of security to your account.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" name="twoFactor" checked={security.twoFactor} onChange={handleSecurityChange} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="settings-card fade-in">
                <h2>App Preferences</h2>
                <p className="desc">Customize your experience within the dashboard.</p>

                <div className="settings-form">
                  <div className="form-group" style={{maxWidth: '250px'}}>
                    <label>Theme</label>
                    <select name="theme" value={preferences.theme} onChange={handlePreferencesChange}>
                      <option value="dark">Classic Dark</option>
                      <option value="light">Modern Light</option>
                      <option value="midnight">Midnight Luxe (Premium)</option>
                      <option value="emerald">Emerald Dusk (Premium)</option>
                      <option value="obsidian">Obsidian Gold (Premium)</option>
                      <option value="sunset">Electric Sunset (Gradient)</option>
                      <option value="ocean">Oceanic Depth (Gradient)</option>
                    </select>
                  </div>

                  <h3 style={{color: '#fff', fontSize: '18px', marginTop: '16px', marginBottom: '8px'}}>Notifications</h3>
                  
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Email Alerts</h4>
                      <p>Receive updates and reports directly to your inbox.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" name="emailAlerts" checked={preferences.emailAlerts} onChange={handlePreferencesChange} />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>SMS Alerts</h4>
                      <p>Get crucial reminders on your phone via SMS.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" name="smsAlerts" checked={preferences.smsAlerts} onChange={handlePreferencesChange} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
