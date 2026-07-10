import { useState } from "react";

import {
  
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  HelpCircle,
} from "lucide-react";
import "./UserRegister.css";

const UserRegister = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    // After successful registration, go to login screen
    if (typeof onSuccess === "function") onSuccess();

    // TODO: hook up API call here
  };

  return (
    <div className="hms-page">
      {/* Header */}
      <header className="hms-header">
        <div className="hms-header-left">
          <img
            className="hms-logo-icon"
            src="/ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
            alt="Heart logo"
          />
          <div className="hms-header-text">
            <h1 className="hms-title">
              Healthcare <span className="hms-title-accent">Monitoring System</span>
            </h1>
            <p className="hms-subtitle">Care. Monitor. Remind. Stay Healthy.</p>
          </div>
        </div>
        <div className="hms-header-right">
          <p className="hms-tagline">Your Health, Our Priority</p>
          <p className="hms-tagline-sub">Secure • Reliable • Care Focused</p>
        </div>
      </header>

      {/* Main content */}
      <main className="hms-main">
        <div className="hms-hero-icon">
          {/* Heart beat only (replace heart image + plus) */}
          <img
            className="hms-heart-image"
            src="/ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
            alt="Heart"
          />

        </div>

        <div className="hms-card">
          <div className="hms-card-header">
           
            <h2 className="hms-card-title">Create Account</h2>
            <p className="hms-card-subtitle">
              Fill in the details below to get satrted
            </p>
          </div>

          <form className="hms-form" onSubmit={handleSubmit}>
            <div className="hms-field">
              <label htmlFor="fullName" className="hms-label">
                Full Name
              </label>
              <div className="hms-input-wrapper">
                <User className="hms-input-icon" size={18} />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="hms-input"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="hms-field">
              <label htmlFor="email" className="hms-label">
                Email Address
              </label>
              <div className="hms-input-wrapper">
                <Mail className="hms-input-icon" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="hms-input"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="hms-field">
              <label htmlFor="mobile" className="hms-label">
                Mobile Number
              </label>
              <div className="hms-input-wrapper">
                <Phone className="hms-input-icon" size={18} />
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  className="hms-input"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="hms-field">
              <label htmlFor="password" className="hms-label">
                Password
              </label>
              <div className="hms-input-wrapper">
                <Lock className="hms-input-icon" size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="hms-input hms-input-password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="hms-eye-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="hms-submit-btn">
              <UserPlus size={18} />
              Create Account
            </button>

            <p className="hms-login-text">
              Already have an account? <a href="#login">Login Now</a>
            </p>
          </form>
        </div>
      </main>

      <button className="hms-help-btn" aria-label="Help">
        <HelpCircle size={20} />
      </button>
    </div>
  );
};

export default UserRegister;