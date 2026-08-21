import { useState } from "react";
import toast from "react-hot-toast";

import api from "../../api/axiosInstance";
import { loginAdmin } from "../../api/AdminMockApi";

import "./UserLogin.css";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
} from "react-icons/fa";

const ADMIN_EMAIL = "admin@gmail.com";

const UserLogin = ({
  onGoRegister,
  onLoginSuccess,
  onAdminLoginSuccess,
  onGoForget,
}) => {
  // =========================================================
  // REMEMBERED EMAIL
  // =========================================================

  const rememberedEmail =
    localStorage.getItem("rememberEmail") || "";

  // =========================================================
  // STATE
  // =========================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(!!rememberedEmail);

  const [formData, setFormData] =
    useState({
      email: rememberedEmail,
      password: "",
    });

  const [errors, setErrors] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,

      [name]:
        name === "email"
          ? value
              .trim()
              .toLowerCase()
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    const newErrors = {};

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // EMAIL
    if (!formData.email) {
      newErrors.email =
        "Email is required";
    } else if (
      !emailRegex.test(
        formData.email
      )
    ) {
      newErrors.email =
        "Enter a valid email";
    }

    // PASSWORD
    if (!formData.password) {
      newErrors.password =
        "Password is required";
    } else if (
      /\s/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password cannot contain spaces";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // =========================================================
  // SAVE REMEMBER EMAIL
  // =========================================================

  const handleRememberEmail = () => {
    if (rememberMe) {
      localStorage.setItem(
        "rememberEmail",
        formData.email
      );
    } else {
      localStorage.removeItem(
        "rememberEmail"
      );
    }
  };

  // =========================================================
  // SUCCESS TOAST
  // =========================================================

  const showSuccessToast = (message) => {
    toast.success(
      message || "Login successful!",
      {
        duration: 4000,

        style: {
          background:
            "linear-gradient(135deg, #2e8b57 0%, #1f6f8b 100%)",

          color: "#fff",

          padding:
            "14px 20px",

          borderRadius:
            "10px",

          boxShadow:
            "0 8px 20px rgba(46, 139, 87, 0.28)",

          fontSize:
            "14px",

          fontWeight:
            "600",

          border:
            "1px solid rgba(255, 255, 255, 0.22)",
        },

        iconTheme: {
          primary: "#fff",
          secondary: "#2e8b57",
        },
      }
    );
  };

  // =========================================================
  // ERROR TOAST
  // =========================================================

  const showErrorToast = (message) => {
    toast.error(
      message ||
        "Login failed. Please try again.",
      {
        duration: 4000,

        style: {
          background:
            "linear-gradient(135deg, #1f6f8b 0%, #0f4c5c 100%)",

          color: "#fff",

          padding:
            "14px 20px",

          borderRadius:
            "10px",

          boxShadow:
            "0 8px 20px rgba(31, 111, 139, 0.25)",

          fontSize:
            "14px",

          fontWeight:
            "600",

          border:
            "1px solid rgba(255, 255, 255, 0.22)",
        },

        iconTheme: {
          primary: "#fff",
          secondary: "#1f6f8b",
        },
      }
    );
  };

  // =========================================================
  // LOGIN
  // USER = REAL API
  // ADMIN = ADMIN MOCK API
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = formData.email
        .trim()
        .toLowerCase();

      // =====================================================
      // ADMIN LOGIN - MOCK API
      // =====================================================

      if (normalizedEmail === ADMIN_EMAIL) {
        const response = await loginAdmin({
          email: normalizedEmail,
          password: formData.password,
        });

        handleRememberEmail();

        showSuccessToast(
          response?.data?.message ||
            "Admin login successful!"
        );

        if (
          typeof onAdminLoginSuccess ===
          "function"
        ) {
          onAdminLoginSuccess();
        }

        return;
      }

      // =====================================================
      // NORMAL USER LOGIN - REAL API
      // POST /api/auth/login
      // =====================================================

      const response = await api.post(
        "/api/auth/login",
        {
          email: normalizedEmail,
          password: formData.password,
          rememberMe,
        }
      );

      const token = response?.data?.token;
      const role = response?.data?.role;

      if (!token) {
        throw new Error(
          "Login response did not include token."
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem(
        "userRole",
        role || "USER"
      );

      handleRememberEmail();

      showSuccessToast(
        response?.data?.message ||
          "Login successful!"
      );

      if (
        typeof onLoginSuccess ===
        "function"
      ) {
        onLoginSuccess();
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Login failed. Please try again.";

      setErrors((prev) => ({
        ...prev,
        password:
          "Incorrect email or password",
      }));

      showErrorToast(
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="login-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

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
              <span className="green-text">
                Healthcare Monitoring
              </span>{" "}

              <span className="blue-text">
                System
              </span>
            </h2>

            <p className="header-subtitle">
              Care. Monitor. Remind.
              Stay Healthy.
            </p>
          </div>
        </div>

        <div className="header-right">
          <h4>
            Your Health, Our Priority
          </h4>

          <p>
            Secure • Reliable • Care Focused
          </p>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="login-container">
        {/* ===================================================
            LEFT SECTION
        =================================================== */}

        <div className="left-section">
          <div className="left-content">
            <h1>
              Healthcare
              <br />

              <span>
                Monitoring System
              </span>
            </h1>

            <p>
              An intelligent platform to
              manage medicines, reminders,
              inventory, alerts and family
              communication – all in one
              place.
            </p>

            {/* HERO */}

            <div className="left-hero">
              <div className="hero-illustration">
                <div className="hero-card">
                  <div className="hero-card-top">
                    <div className="hero-circle">
                    </div>

                    <div className="hero-details">
                      <span></span>
                      <span></span>
                    </div>
                  </div>

                  <div className="hero-card-body">
                    <div className="hero-chart">
                    </div>

                    <div className="hero-badge">
                      +
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-highlights">
                <div className="highlight-pill">
                  <div></div>

                  <span>
                    Easy scheduling
                  </span>
                </div>

                <div className="highlight-pill">
                  <div></div>

                  <span>
                    Smart alerts
                  </span>
                </div>
              </div>
            </div>

            {/* HEARTBEAT */}

            <div className="heartbeat-line">
              <div className="line">
              </div>

              <div className="pulse">
                <span></span>
              </div>

              <div className="line">
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            RIGHT SECTION
        =================================================== */}

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

            {/* TITLE */}

            <h2>
              Welcome Back!
            </h2>

            <p className="welcome-text">
              Sign in to continue to your
              account
            </p>

            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form onSubmit={handleLogin}>
              {/* EMAIL */}

              <label>
                Email
              </label>

              <div className="input-box">
                <FaEnvelope
                  className="input-icon"
                />

                <input
                  type="text"
                  name="email"
                  placeholder="Enter your email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="email"
                />
              </div>

              {errors.email && (
                <span
                  style={{
                    color:
                      "#ef4444",

                    fontSize:
                      "13px",

                    display:
                      "block",

                    marginTop:
                      "-14px",

                    marginBottom:
                      "14px",
                  }}
                >
                  {errors.email}
                </span>
              )}

              {/* PASSWORD */}

              <label>
                Password
              </label>

              <div className="input-box">
                <FaLock
                  className="input-icon"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
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
                <span
                  style={{
                    color:
                      "#ef4444",

                    fontSize:
                      "13px",

                    display:
                      "block",

                    marginTop:
                      "-14px",

                    marginBottom:
                      "14px",
                  }}
                >
                  {errors.password}
                </span>
              )}

              {/* REMEMBER / FORGOT */}

              <div className="login-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={
                      rememberMe
                    }
                    onChange={() =>
                      setRememberMe(
                        (prev) => !prev
                      )
                    }
                  />

                  <span>
                    Remember Me
                  </span>
                </label>

                <button
                  type="button"
                  className="forget-link"
                  onClick={() => {
                    if (typeof onGoForget === "function") {
                      onGoForget();
                    }
                  }}
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

                {loading
                  ? "Logging in..."
                  : "Login"}
              </button>
            </form>

            {/* =================================================
                REGISTER
                Only normal user registers
            ================================================= */}

            <div className="register-link">
              Don't have an account?{" "}

              <a
                href="#register"
                onClick={(e) => {
                  e.preventDefault();

                  if (
                    typeof onGoRegister ===
                    "function"
                  ) {
                    onGoRegister();
                  }
                }}
              >
                Register Now
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="login-footer">
        © 2025 Healthcare Monitoring
        System. All Rights Reserved
      </footer>
    </div>
  );
};

export default UserLogin;