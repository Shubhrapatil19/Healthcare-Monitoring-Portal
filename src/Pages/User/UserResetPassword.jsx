import { useState } from "react";
import toast from "react-hot-toast";

import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
} from "react-icons/fa";

import api from "../../api/axiosInstance";

import "./UserResetPassword.css";

const UserResetPassword = ({
  onBackToLogin,
}) => {
  // =========================================================
  // GET RESET TOKEN FROM URL
  //
  // Example:
  // /reset-password?token=abc123
  // =========================================================

  const params =
    new URLSearchParams(
      window.location.search
    );

  const resetToken =
    params.get("token");

  // =========================================================
  // STATE
  // =========================================================

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] =
    useState(false);

  const [
    resetting,
    setResetting,
  ] =
    useState(false);

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  // =========================================================
  // BACK TO LOGIN
  // =========================================================

  const goBackToLogin =
    () => {
      // URL se reset token remove
      window.history.replaceState(
        {},
        document.title,
        "/"
      );

      if (
        typeof onBackToLogin ===
        "function"
      ) {
        onBackToLogin();
      } else {
        window.location.href =
          "/";
      }
    };

  // =========================================================
  // RESET PASSWORD
  //
  // REAL API:
  // POST /api/auth/reset-password
  //
  // BODY:
  // {
  //   token,
  //   newPassword,
  //   confirmPassword
  // }
  // =========================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      // =====================================================
      // TOKEN
      // =====================================================

      if (!resetToken) {
        toast.error(
          "Invalid or missing password reset token."
        );

        return;
      }

      // =====================================================
      // NEW PASSWORD
      // =====================================================

      if (
        !password.trim()
      ) {
        toast.error(
          "Please enter a new password"
        );

        return;
      }

      // Same strong-password rule as Register
      if (
        password.length <
        8
      ) {
        toast.error(
          "Password must be at least 8 characters"
        );

        return;
      }

      if (
        !/[A-Z]/.test(
          password
        )
      ) {
        toast.error(
          "Password must contain at least one uppercase letter"
        );

        return;
      }

      if (
        !/[0-9]/.test(
          password
        )
      ) {
        toast.error(
          "Password must contain at least one number"
        );

        return;
      }

      if (
        !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?`~]/.test(
          password
        )
      ) {
        toast.error(
          "Password must contain at least one special character"
        );

        return;
      }

      if (
        /\s/.test(
          password
        )
      ) {
        toast.error(
          "Password cannot contain spaces"
        );

        return;
      }

      // =====================================================
      // CONFIRM PASSWORD
      // =====================================================

      if (
        !confirmPassword
      ) {
        toast.error(
          "Please confirm your password"
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        toast.error(
          "Passwords do not match"
        );

        return;
      }

      // =====================================================
      // REAL API CALL
      // =====================================================

      setResetting(true);

      try {
        const response =
          await api.post(
            "/api/auth/reset-password",
            {
              token:
                resetToken,

              newPassword:
                password,

              confirmPassword:
                confirmPassword,
            }
          );

        setSuccess(true);

        toast.success(
          response?.data
            ?.message ||
            "Password reset successful!"
        );

        // ===================================================
        // REMOVE TOKEN
        // ===================================================

        window.history.replaceState(
          {},
          document.title,
          "/"
        );

        // ===================================================
        // RETURN TO LOGIN
        // ===================================================

        setTimeout(() => {
          if (
            typeof onBackToLogin ===
            "function"
          ) {
            onBackToLogin();
          } else {
            window.location.href =
              "/";
          }
        }, 1500);
      } catch (error) {
        const message =
          error?.response
            ?.data
            ?.message ||
          error?.response
            ?.data
            ?.error ||
          error?.message ||
          "Password reset failed. Please try again.";

        toast.error(
          message
        );
      } finally {
        setResetting(false);
      }
    };

  // =========================================================
  // INVALID TOKEN
  // =========================================================

  if (!resetToken) {
    return (
      <div className="reset-page">
        <div className="reset-card success-state">

          <div className="reset-icon">
            <FaLock />
          </div>

          <h2>
            Invalid Reset Link
          </h2>

          <p>
            This password reset
            link is invalid or the
            token is missing.
          </p>

          <button
            type="button"
            className="reset-submit-btn"
            onClick={
              goBackToLogin
            }
          >
            Back to Login
          </button>

        </div>
      </div>
    );
  }

  // =========================================================
  // SUCCESS
  // =========================================================

  if (success) {
    return (
      <div className="reset-page">
        <div className="reset-card success-state">

          <div className="reset-success-icon">
            <FaCheckCircle />
          </div>

          <h2>
            Password Reset
            Successful
          </h2>

          <p>
            Your password has been
            updated successfully.
            Redirecting to login...
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="reset-page">

      <div className="reset-card">

        {/* HEADER */}

        <div className="reset-header">

          <div className="reset-icon">
            <FaLock />
          </div>

          <div>
            <h2>
              Reset Password
            </h2>

            <p className="reset-subtitle">
              Enter and confirm
              your new password.
            </p>
          </div>

        </div>

        {/* FORM */}

        <form
          className="reset-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* NEW PASSWORD */}

          <div className="reset-field">

            <label htmlFor="reset-password">
              New Password{" "}
              <span className="required">
                *
              </span>
            </label>

            <div className="reset-input-wrapper">

              <FaLock className="reset-input-icon" />

              <input
                id="reset-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter new password"
                value={
                  password
                }
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                disabled={
                  resetting
                }
                autoComplete="new-password"
              />

              <button
                type="button"
                className="reset-eye-btn"
                onClick={() =>
                  setShowPassword(
                    (prev) =>
                      !prev
                  )
                }
                disabled={
                  resetting
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
          </div>

          {/* CONFIRM PASSWORD */}

          <div className="reset-field">

            <label htmlFor="reset-confirm">
              Confirm Password{" "}
              <span className="required">
                *
              </span>
            </label>

            <div className="reset-input-wrapper">

              <FaLock className="reset-input-icon" />

              <input
                id="reset-confirm"
                type={
                  showConfirm
                    ? "text"
                    : "password"
                }
                placeholder="Re-enter new password"
                value={
                  confirmPassword
                }
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                disabled={
                  resetting
                }
                autoComplete="new-password"
              />

              <button
                type="button"
                className="reset-eye-btn"
                onClick={() =>
                  setShowConfirm(
                    (prev) =>
                      !prev
                  )
                }
                disabled={
                  resetting
                }
                aria-label={
                  showConfirm
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirm ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>

            </div>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            className="reset-submit-btn"
            disabled={
              resetting
            }
          >
            {resetting
              ? "Resetting..."
              : "Reset Password"}
          </button>

        </form>

      </div>
    </div>
  );
};

export default UserResetPassword;