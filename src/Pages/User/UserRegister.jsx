import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";

import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  HelpCircle,
  Shield,
  Bell,
  LineChart,
} from "lucide-react";
import "./UserRegister.css";

const UserRegister = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8 && password.length <= 20,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?`~]/.test(password),
    };
    return requirements;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      const trimmedValue = value.trim().toLowerCase();
      setFormData((prev) => ({ ...prev, [name]: trimmedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (formData.email.length > 100) {
        newErrors.email = "Email must not exceed 100 characters";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const requirements = validatePassword(formData.password);
      const failedRequirements = [];

      if (!requirements.length) {
        if (formData.password.length < 8)
          failedRequirements.push("at least 8 characters");
        if (formData.password.length > 20)
          failedRequirements.push("maximum 20 characters");
      }
      if (!requirements.uppercase)
        failedRequirements.push("at least 1 uppercase letter");
      if (!requirements.lowercase)
        failedRequirements.push("at least 1 lowercase letter");
      if (!requirements.number) failedRequirements.push("at least 1 number");
      if (!requirements.special)
        failedRequirements.push("at least 1 special character");

      if (failedRequirements.length > 0) {
        newErrors.password = `Password must contain: ${failedRequirements.join(", ")}`;
      }
    }

    if (/\s/.test(formData.password)) {
      newErrors.password = "Password cannot contain spaces";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // ================= API CALL: REGISTER =================
      // Endpoint: POST /auth/register
      const response = await api.post("/auth/register", {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      // ========================================================

      if (response.data.success) {
        // Save locally ONLY after a real successful registration
        const userName = (formData.fullName || "").trim() || "User";
        localStorage.setItem(
          "registeredUser",
          JSON.stringify({ fullName: userName, email: formData.email })
        );
        localStorage.setItem("currentUserName", userName);

        toast.success("✓ Account created successfully! Redirecting to login...", {
          duration: 4000,
          style: {
            background: "linear-gradient(135deg, #2e8b57 0%, #1f6f8b 100%)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 20px rgba(46, 139, 87, 0.28)",
            fontSize: "14px",
            fontWeight: "600",
            border: "1px solid rgba(255, 255, 255, 0.22)",
          },
          iconTheme: { primary: "#fff", secondary: "#2e8b57" },
        });

        setTimeout(() => {
          if (typeof onSuccess === "function") onSuccess();
        }, 2000);
      } else {
        if (response.data.message && response.data.message.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: "This email is already registered. Please use a different email or login." }));
        }
        toast.error(response.data.message || "Registration failed. Please try again.", {
          duration: 4000,
          style: {
            background: "linear-gradient(135deg, #1f6f8b 0%, #0f4c5c 100%)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 20px rgba(31, 111, 139, 0.25)",
            fontSize: "14px",
            fontWeight: "600",
            border: "1px solid rgba(255, 255, 255, 0.22)",
          },
          iconTheme: { primary: "#fff", secondary: "#1f6f8b" },
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "";
      const backendError = error.response?.data?.error;

      if (errorMessage.toLowerCase().includes("email") || (backendError && typeof backendError === 'string' && backendError.toLowerCase().includes("email"))) {
        setErrors((prev) => ({ ...prev, email: "This email is already registered. Please use a different email or login." }));
        toast.error(
          "This email is already registered. Please use a different email or login.",
          {
            duration: 4000,
            style: {
              background: "linear-gradient(135deg, #1f6f8b 0%, #0f4c5c 100%)",
              color: "#fff",
              padding: "14px 20px",
              borderRadius: "10px",
              boxShadow: "0 8px 20px rgba(31, 111, 139, 0.25)",
              fontSize: "14px",
              fontWeight: "600",
              border: "1px solid rgba(255, 255, 255, 0.22)",
            },
            iconTheme: { primary: "#fff", secondary: "#1f6f8b" },
          }
        );
      } else {
        // Real network/API error — no demo/fallback success anymore
        console.log("API Error:", error.message);
        toast.error(
          error.response?.data?.message || "Something went wrong. Please try again.",
          {
            duration: 4000,
            style: {
              background: "linear-gradient(135deg, #1f6f8b 0%, #0f4c5c 100%)",
              color: "#fff",
              padding: "14px 20px",
              borderRadius: "10px",
              boxShadow: "0 8px 20px rgba(31, 111, 139, 0.25)",
              fontSize: "14px",
              fontWeight: "600",
              border: "1px solid rgba(255, 255, 255, 0.22)",
            },
            iconTheme: { primary: "#fff", secondary: "#1f6f8b" },
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <header className="login-header">
        <div className="header-left">
          <div className="logo-box">
            <img
              className="hms-logo-icon"
              src="/ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
              alt="Heart logo"
            />
          </div>
          <div>
            <h2 className="system-title">
              <span className="green-text">Healthcare Monitoring</span>{" "}
              <span className="blue-text">System</span>
            </h2>
            <p className="header-subtitle">Care. Monitor. Remind. Stay Healthy.</p>
          </div>
        </div>
        <div className="header-right">
          <h4>Your Health, Our Priority</h4>
          <p>Secure • Reliable • Care Focused</p>
        </div>
      </header>

      <div className="register-container">
        <div className="register-left-section">
          <div className="register-left-content">
            <div className="reg-hero-illustration">
              <div className="reg-illustration-wrapper">
                <div className="reg-ill-phone">
                  <div className="reg-ill-phone-screen">
                    <img
                      src="/ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
                      alt="Healthcare logo"
                      className="reg-ill-phone-logo"
                    />
                  </div>
                </div>
                <div className="reg-ill-shield">
                  <Shield size={28} />
                </div>
                <div className="reg-ill-stethoscope">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .3.3"/>
                    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                    <circle cx="20" cy="10" r="2"/>
                  </svg>
                </div>
                <div className="reg-ill-cross reg-ill-cross-1">+</div>
                <div className="reg-ill-cross reg-ill-cross-2">+</div>
                <div className="reg-ill-cross reg-ill-cross-3">+</div>
              </div>
            </div>

            <h2 className="reg-heading">
              Take Charge of
              <br />
              <span className="reg-heading-highlight">Your Health</span>
            </h2>

            <p className="reg-description">
              Create your account and get personalized access to monitor your
              health, manage medications, and stay on track every day.
            </p>

            <div className="reg-features">
              <div className="reg-feature-card">
                <div className="reg-feature-icon reg-feature-icon-shield">
                  <Shield size={22} />
                </div>
                <div className="reg-feature-text">
                  <h4>Secure & Private</h4>
                  <p>User data is encrypted and protected.</p>
                </div>
              </div>

              <div className="reg-feature-card">
                <div className="reg-feature-icon reg-feature-icon-bell">
                  <Bell size={22} />
                </div>
                <div className="reg-feature-text">
                  <h4>Smart Reminders</h4>
                  <p>Medicine reminder notifications.</p>
                </div>
              </div>

              <div className="reg-feature-card">
                <div className="reg-feature-icon reg-feature-icon-chart">
                  <LineChart size={22} />
                </div>
                <div className="reg-feature-text">
                  <h4>Track & Improve</h4>
                  <p>Monitor health progress and reports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="register-right-section">
          <div className="register-card">
            <div className="register-card-header">
              <h2 className="register-card-title">Create Account</h2>
              <p className="register-card-subtitle">Fill in the details below to get started</p>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="register-field">
                <label htmlFor="fullName" className="register-label">Full Name</label>
                <div className="register-input-wrapper">
                  <User className="register-input-icon" size={18} />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className={`register-input ${
                      errors.fullName ? "register-input-error" : ""
                    }`}
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                {errors.fullName && (
                  <span className="register-error-text">
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div className="register-field">
                <label htmlFor="email" className="register-label">Email Address</label>
                <div className="register-input-wrapper">
                  <Mail className="register-input-icon" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`register-input ${errors.email ? 'register-input-error' : ''}`}
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && <span className="register-error-text">{errors.email}</span>}
              </div>

              <div className="register-field">
                <label htmlFor="mobile" className="register-label">Mobile Number</label>
                <div className="register-input-wrapper">
                  <Phone className="register-input-icon" size={18} />
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    className={`register-input ${
                      errors.mobile ? "register-input-error" : ""
                    }`}
                    placeholder="Enter mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                  />
                </div>
                {errors.mobile && (
                  <span className="register-error-text">
                    {errors.mobile}
                  </span>
                )}
              </div>

              <div className="register-field">
                <label htmlFor="password" className="register-label">Password</label>
                <div className="register-input-wrapper">
                  <Lock className="register-input-icon" size={18} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className={`register-input register-input-password ${errors.password ? 'register-input-error' : ''}`}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="register-eye-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="register-error-text">{errors.password}</span>}
              </div>

              <div className="register-field">
                <label htmlFor="confirmPassword" className="register-label">Confirm Password</label>
                <div className="register-input-wrapper">
                  <Lock className="register-input-icon" size={18} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`register-input register-input-password ${errors.confirmPassword ? 'register-input-error' : ''}`}
                    placeholder="Enter confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="register-eye-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="register-error-text">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="register-submit-btn" disabled={loading}>
                <UserPlus size={18} />
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <p className="register-login-text">
                Already have an account?{" "}
                <a href="#login" onClick={(e) => { e.preventDefault(); if (typeof onSuccess === "function") onSuccess(); }}>
                  Login Now
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>

      <button className="register-help-btn" aria-label="Help">
        <HelpCircle size={20} />
      </button>
    </div>
  );
};

export default UserRegister;