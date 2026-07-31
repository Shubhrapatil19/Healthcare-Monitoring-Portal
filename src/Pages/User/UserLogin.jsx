import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";

import "./UserLogin.css";

import UserForget from "./UserForget";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
} from "react-icons/fa";

const UserLogin = ({ onGoRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgetOpen, setIsForgetOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // ================= API CALL: LOGIN =================
      // Endpoint: POST /auth/login
      // Note: This does NOT return a JWT directly. Backend sends a
      // confirmation email first ("Is it you?" check). The real JWT
      // is only issued when the user clicks the link in that email,
      // which hits GET /auth/confirm-login?token=xxxx (handled separately,
      // not from this form).
      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      // =====================================================

      // Backend returns { token: null, type: "Bearer", message: "Confirmation email sent..." }
      toast.success(
        response.data.message || "Confirmation email sent. Please check your inbox to complete login.",
        {
          duration: 5000,
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
        }
      );

      // NOTE: We do NOT call onLoginSuccess() here, because login is not
      // actually complete yet — the user still has to click the email link.
      // Once ConfirmLogin (separate route/page) receives the JWT, that is
      // where onLoginSuccess()/redirect to dashboard should happen.

    } catch (error) {
      const errorMessage = error.response?.data?.message || "";

      if (errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("credential")) {
        setErrors((prev) => ({ ...prev, password: "Incorrect email or password" }));
      }

      toast.error(errorMessage || "Login failed. Please try again.", {
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
      console.log("Login API Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ================= HEADER ================= */}

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

            <p className="header-subtitle">
              Care. Monitor. Remind. Stay Healthy.
            </p>
          </div>

        </div>

        <div className="header-right">
          <h4>Your Health, Our Priority</h4>

          <p>Secure • Reliable • Care Focused</p>
        </div>

      </header>

      {/* ================= MAIN ================= */}

      <div className="login-container">

        {/* LEFT SIDE */}

        <div className="left-section">

          <div className="left-content">

            <h1>
              Healthcare
              <br />
              <span>Monitoring System</span>
            </h1>

            <p>
              An intelligent platform to manage medicines,
              reminders, inventory, alerts and family
              communication – all in one place.
            </p>

            <div className="heartbeat-line">
              <div className="line"></div>

              <div className="pulse">
                <span></span>
              </div>

              <div className="line"></div>
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="right-section">

          <div className="login-card">

            {/* LOGO */}

            <div className="login-logo">
              <div className="circle-logo">
                <img
                  className="hms-login-heart-icon"
                  src="/ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
                  alt="Heart"
                />
              </div>
            </div>


            <h2>Welcome Back!</h2>

            <p className="welcome-text">
              Sign in to continue to your account
            </p>

            <form onSubmit={handleLogin}>

              {/* EMAIL */}

              <label>Email </label>

              <div className="input-box">

                <FaEnvelope className="input-icon" />

                <input
                  type="text"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />

              </div>
              {errors.email && (
                <span style={{ color: "#ef4444", fontSize: "13px", display: "block", marginTop: "-14px", marginBottom: "14px" }}>
                  {errors.email}
                </span>
              )}

              {/* PASSWORD */}

              <label>Password</label>

              <div className="input-box">

                <FaLock className="input-icon" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>
              {errors.password && (
                <span style={{ color: "#ef4444", fontSize: "13px", display: "block", marginTop: "-14px", marginBottom: "14px" }}>
                  {errors.password}
                </span>
              )}

              {/* REMEMBER */}

              <div className="login-options">

                <label className="remember">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() =>
                      setRememberMe(!rememberMe)
                    }
                  />

                  <span>Remember Me</span>

                </label>

                <button
                  type="button"
                  className="forget-link"
                  onClick={() => setIsForgetOpen(true)}
                >
                  Forget Password?
                </button>

              </div>

              {/* LOGIN BUTTON */}

              <button
                className="login-btn"
                type="submit"
                disabled={loading}
              >
                <FaSignInAlt />
                {loading ? "Sending..." : "Login"}
              </button>

            </form>

            {/* REGISTER */}

            <div className="register-link">

              Don't have an account?

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof onGoRegister === "function") onGoRegister();
                }}
              >
                Register Now
              </a>

            </div>

          </div>

        </div>

      </div>

      <UserForget isOpen={isForgetOpen} onClose={() => setIsForgetOpen(false)} />

      {/* ================= FOOTER ================= */}

      <footer className="login-footer">
        © 2025 Healthcare Monitoring System. All Rights Reserved
      </footer>

    </div>
  );
};

export default UserLogin;