import { useState } from "react";
import toast from "react-hot-toast";

import {
  FaTimes,
  FaEnvelope,
  FaPaperPlane,
  FaCheckCircle,
} from "react-icons/fa";

import { MdLockReset } from "react-icons/md";

import api from "../../api/axiosInstance";

import "./UserForget.css";

const UserForget = ({
  isOpen,
  onClose,
}) => {
  // =========================================================
  // STATE
  // =========================================================

  const [email, setEmail] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [linkSent, setLinkSent] =
    useState(false);

  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {
    if (sending) {
      return;
    }

    setEmail("");
    setLinkSent(false);

    if (
      typeof onClose ===
      "function"
    ) {
      onClose();
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  //
  // REAL API:
  // POST /api/auth/forgot-password
  //
  // BODY:
  // {
  //   email: "user@example.com"
  // }
  // =========================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      // =====================================================
      // VALIDATION
      // =====================================================

      if (!normalizedEmail) {
        toast.error(
          "Please enter your email address"
        );

        return;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          normalizedEmail
        )
      ) {
        toast.error(
          "Please enter a valid email address"
        );

        return;
      }

      // =====================================================
      // API CALL
      // =====================================================

      setSending(true);

      try {
        const response =
          await api.post(
            "/api/auth/forgot-password",
            {
              email:
                normalizedEmail,
            }
          );

        setLinkSent(true);

        toast.success(
          response?.data
            ?.message ||
            "Password reset link sent to your email!"
        );
      } catch (error) {
        const message =
          error?.response
            ?.data
            ?.message ||
          error?.response
            ?.data
            ?.error ||
          error?.message ||
          "Unable to send reset link. Please try again.";

        toast.error(
          message
        );
      } finally {
        setSending(false);
      }
    };

  // =========================================================
  // DON'T RENDER IF CLOSED
  // =========================================================

  if (!isOpen) {
    return null;
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="fp-overlay">
      <div className="fp-modal">

        {/* CLOSE */}

        <button
          type="button"
          className="fp-close"
          onClick={
            handleClose
          }
          disabled={
            sending
          }
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {/* ICON */}

        <div className="fp-icon">
          <MdLockReset />
        </div>

        {/* TITLE */}

        <h2>
          Forgot Password?
        </h2>

        <p className="fp-subtitle">
          {linkSent
            ? "We've sent a password reset link to your email."
            : "We'll send a password reset link to your registered email."}
        </p>

        {/* DIVIDER */}

        <div className="fp-divider">
          <span></span>

          <div className="pulse"></div>

          <span></span>
        </div>

        {/* ===============================================
            EMAIL FORM
        =============================================== */}

        {!linkSent ? (
          <form
            className="fp-form"
            onSubmit={
              handleSubmit
            }
          >
            <label htmlFor="forgot-email">
              Email
            </label>

            <div className="fp-input">
              <FaEnvelope className="input-iconn" />

              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                value={
                  email
                }
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                disabled={
                  sending
                }
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="fp-btn"
              disabled={
                sending
              }
            >
              <FaPaperPlane />

              {sending
                ? "Sending..."
                : "Send Reset Link"}
            </button>

            <button
              type="button"
              className="fp-cancel"
              onClick={
                handleClose
              }
              disabled={
                sending
              }
            >
              Cancel
            </button>
          </form>
        ) : (

          /* =============================================
              SUCCESS
          ============================================= */

          <div className="fp-success-box">

            <div className="fp-success-icon">
              <FaCheckCircle />
            </div>

            <p className="fp-success-text">
              Password reset link
              has been sent to{" "}
              <strong>
                {email.trim()}
              </strong>
              . Please check your
              email inbox.
            </p>

            <button
              type="button"
              className="fp-cancel"
              onClick={
                handleClose
              }
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserForget;