import { useState } from "react";
import toast from "react-hot-toast";

import api from "../../api/axiosInstance";

import "./ConfirmLogin.css";

const ConfirmLogin = ({ onBackToLogin }) => {
  // =========================================================
  // GET TOKEN FROM URL
  // Example:
  // /verify-email?token=xxxx
  // =========================================================

  const params = new URLSearchParams(window.location.search);
  const verifyToken = params.get("token");

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const [verificationFailed, setVerificationFailed] = useState(
    !verifyToken
  );

  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // VERIFY EMAIL
  //
  // REAL API:
  // GET /api/auth/verify-email?token=...
  // =========================================================

  const verifyEmail = async () => {
    if (!verifyToken) {
      setVerificationFailed(true);
      setErrorMessage("Verification token is missing.");

      toast.error("Invalid verification link.");

      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get(
        "/api/auth/verify-email",
        {
          params: {
            token: verifyToken,
          },
        }
      );

      setVerified(true);
      setVerificationFailed(false);

      toast.success(
        response?.data?.message ||
          "Email verified successfully!"
      );

      // =====================================================
      // REMOVE TOKEN FROM URL
      // =====================================================

      window.history.replaceState(
        {},
        document.title,
        "/"
      );

      // =====================================================
      // AFTER VERIFICATION → LOGIN PAGE
      // =====================================================

      setTimeout(() => {
        if (typeof onBackToLogin === "function") {
          onBackToLogin();
        } else {
          window.location.href = "/";
        }
      }, 1500);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Invalid or expired verification link.";

      setVerified(false);
      setVerificationFailed(true);
      setErrorMessage(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // BACK TO LOGIN
  // =========================================================

  const goBackToLogin = () => {
    window.history.replaceState(
      {},
      document.title,
      "/"
    );

    if (typeof onBackToLogin === "function") {
      onBackToLogin();
    } else {
      window.location.href = "/";
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="confirm-login-page">

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="confirm-card">

          <div className="loader"></div>

          <h2>
            Verifying Your Email...
          </h2>

          <p>
            Please wait while we securely verify your
            email address.
          </p>

        </div>
      ) : verified ? (

        /* ===================================================
            SUCCESS
        =================================================== */

        <div className="confirm-card">

          <h2>
            Email Verified Successfully
          </h2>

          <p>
            Your email address has been verified.
            Redirecting to login...
          </p>

        </div>

      ) : verificationFailed && !verifyToken ? (

        /* ===================================================
            TOKEN MISSING
        =================================================== */

        <div className="confirm-card">

          <h2>
            Invalid Verification Link
          </h2>

          <p>
            This verification link is missing the
            required token.
          </p>

          <button
            type="button"
            onClick={goBackToLogin}
          >
            Back to Login
          </button>

        </div>

      ) : verificationFailed ? (

        /* ===================================================
            VERIFICATION FAILED
        =================================================== */

        <div className="confirm-card">

          <h2>
            Verification Failed
          </h2>

          <p>
            {errorMessage ||
              "The verification link is invalid or has expired."}
          </p>

          <button
            type="button"
            onClick={goBackToLogin}
          >
            Back to Login
          </button>

        </div>

      ) : (

        /* ===================================================
            VERIFY EMAIL
        =================================================== */

        <div className="confirm-card">

          <h2>
            Verify Your Email
          </h2>

          <p>
            Click the button below to verify your
            email address.
          </p>

          <button
            type="button"
            onClick={verifyEmail}
            disabled={loading}
          >
            Verify Email
          </button>

        </div>
      )}
    </div>
  );
};

export default ConfirmLogin;