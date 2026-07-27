import { useState } from "react";

import "./UserLogin.css";

import UserForget from "./UserForget";


import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
} from "react-icons/fa";

const UserLogin = ({ onLoginSuccess, onGoRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgetOpen, setIsForgetOpen] = useState(false);

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

            {/* EMAIL */}

            <label>Email </label>

            <div className="input-box">

              <FaEnvelope className="input-icon" />

              <input
                type="text"
                placeholder="Enter your email"
              />

            </div>

            {/* PASSWORD */}

            <label>Password</label>

            <div className="input-box">

              <FaLock className="input-icon" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
              type="button"
              onClick={() => {
                // local demo session
                const savedUser = JSON.parse(localStorage.getItem("registeredUser") || "null");
                const userName = savedUser?.fullName?.trim() || "User";
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("currentUserName", userName);
                if (typeof onLoginSuccess === "function") onLoginSuccess();
              }}
            >
              <FaSignInAlt />
              Login
            </button>

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