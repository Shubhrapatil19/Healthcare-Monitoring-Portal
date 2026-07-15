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
  const [passwordFocused, setPasswordFocused] = useState(false);

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
    
    // Trim and convert email to lowercase
    if (name === "email") {
      const trimmedValue = value.trim().toLowerCase();
      setFormData((prev) => ({ ...prev, [name]: trimmedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const passwordRequirements = formData.password ? validatePassword(formData.password) : null;

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else {
      // Check for valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      
      // Check maximum length (100 characters)
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
      const response = await api.post("/auth/register", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        // Note: backend register API doesn't accept "mobile", so it's not sent
      });

      if (response.data.success) {
        // Show success toast notification
        toast.success("✓ Account created successfully! Redirecting to login...", {
          duration: 4000,
          style: {
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 20px rgba(16, 185, 129, 0.4)",
            fontSize: "14px",
            fontWeight: "600",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#10b981",
          },
        });

        // After successful registration, go to login screen
        setTimeout(() => {
          if (typeof onSuccess === "function") onSuccess();
        }, 2000);
      } else {
        // Check if error is related to email already existing
        if (response.data.message && response.data.message.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: "This email is already registered. Please use a different email or login." }));
        }
        toast.error(response.data.message || "Registration failed. Please try again.", {
          duration: 4000,
          style: {
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 20px rgba(239, 68, 68, 0.4)",
            fontSize: "14px",
            fontWeight: "600",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#ef4444",
          },
        });
      }
    } catch (error) {
      // Check if error is related to email already existing
      const errorMessage = error.response?.data?.message || "";
      const backendError = error.response?.data?.error;
      
      if (errorMessage.toLowerCase().includes("email") || (backendError && typeof backendError === 'string' && backendError.toLowerCase().includes("email"))) {
        setErrors((prev) => ({ ...prev, email: "This email is already registered. Please use a different email or login." }));
        toast.error(
          "This email is already registered. Please use a different email or login.",
          {
            duration: 4000,
            style: {
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#fff",
              padding: "14px 20px",
              borderRadius: "10px",
              boxShadow: "0 8px 20px rgba(239, 68, 68, 0.4)",
              fontSize: "14px",
              fontWeight: "600",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#ef4444",
            },
          }
        );
      } else {
        // For demo purposes, still navigate to login even if API fails
        console.log("API Error (demo mode):", error.message);
        toast.error(
          "Demo mode: Registration simulated. Redirecting to login...",
          {
            duration: 3000,
            style: {
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#fff",
              padding: "14px 20px",
              borderRadius: "10px",
              boxShadow: "0 8px 20px rgba(245, 158, 11, 0.4)",
              fontSize: "14px",
              fontWeight: "600",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#f59e0b",
            },
          }
        );
        
        // Navigate to login after showing demo message
        setTimeout(() => {
          if (typeof onSuccess === "function") onSuccess();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
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
                  className={`hms-input ${errors.email ? 'hms-input-error' : ''}`}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <span className="hms-error-text">{errors.email}</span>}
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
                  className={`hms-input hms-input-password ${errors.password ? 'hms-input-error' : ''}`}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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
              {errors.password && <span className="hms-error-text">{errors.password}</span>}

              {/* Password Requirements */}
              {(passwordFocused || formData.password) && (
                <div className="hms-password-requirements">
                  <p className="hms-requirements-title">Password must contain:</p>
                  <ul className="hms-requirements-list">
                    <li className={`hms-requirement-item ${passwordRequirements?.length ? 'hms-requirement-met' : ''}`}>
                      <span className="hms-requirement-icon">{passwordRequirements?.length ? '✓' : '○'}</span>
                      <span>At least 8 characters (max 20)</span>
                    </li>
                    <li className={`hms-requirement-item ${passwordRequirements?.uppercase ? 'hms-requirement-met' : ''}`}>
                      <span className="hms-requirement-icon">{passwordRequirements?.uppercase ? '✓' : '○'}</span>
                      <span>At least 1 uppercase letter</span>
                    </li>
                    <li className={`hms-requirement-item ${passwordRequirements?.lowercase ? 'hms-requirement-met' : ''}`}>
                      <span className="hms-requirement-icon">{passwordRequirements?.lowercase ? '✓' : '○'}</span>
                      <span>At least 1 lowercase letter</span>
                    </li>
                    <li className={`hms-requirement-item ${passwordRequirements?.number ? 'hms-requirement-met' : ''}`}>
                      <span className="hms-requirement-icon">{passwordRequirements?.number ? '✓' : '○'}</span>
                      <span>At least 1 number</span>
                    </li>
                    <li className={`hms-requirement-item ${passwordRequirements?.special ? 'hms-requirement-met' : ''}`}>
                      <span className="hms-requirement-icon">{passwordRequirements?.special ? '✓' : '○'}</span>
                      <span>At least 1 special character</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="hms-field">
              <label htmlFor="confirmPassword" className="hms-label">
                Confirm Password
              </label>
              <div className="hms-input-wrapper">
                <Lock className="hms-input-icon" size={18} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`hms-input hms-input-password ${errors.confirmPassword ? 'hms-input-error' : ''}`}
                  placeholder="Enter confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="hms-eye-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="hms-error-text">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="hms-submit-btn" disabled={loading}>
              <UserPlus size={18} />
              {loading ? "Creating Account..." : "Create Account"}
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