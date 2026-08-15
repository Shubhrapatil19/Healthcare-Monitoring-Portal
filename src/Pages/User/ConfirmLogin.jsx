import { useState } from "react";
import toast from "react-hot-toast";
import { confirmLoginToken, getProfile } from "../../api/mockApi";
import "./ConfirmLogin.css";

// NOTE: With no real backend, UserLogin now logs the user in
// immediately (see mockApi.loginUser) instead of sending a
// confirmation email. This page is kept only for compatibility if
// something still links here — it simply checks that a token already
// exists in localStorage from the mock login step.
const ConfirmLogin = ({ onLoginSuccess }) => {
  const params = new URLSearchParams(window.location.search);
  const verifyToken = params.get("token");

  const [loading, setLoading] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(!verifyToken);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const confirmLogin = async () => {
    if (!verifyToken) {
      toast.error("Invalid confirmation link.");
      return;
    }

    setLoading(true);

    try {
      // ================= MOCK: CONFIRM LOGIN (no backend) =================
      const response = await confirmLoginToken(verifyToken);
      // ========================================================================

      if (!response.data.token) {
        setLoading(false);
        setVerificationFailed(true);
        setErrorMessage("Confirmation link expired or already used.");
        toast.error("Confirmation link expired or already used.");
        return;
      }

      // Fetch profile to make sure the display name is up to date
      try {
        const profileResponse = await getProfile();
        if (profileResponse.data?.fullName) {
          localStorage.setItem("currentUserName", profileResponse.data.fullName);
        }
      } catch {
        // Non-fatal — name will just stay whatever was already stored
      }

      setVerified(true);
      toast.success("Login Successful");

      setTimeout(() => {
        onLoginSuccess?.();
      }, 1500);
    } catch (error) {
      setLoading(false);
      setVerificationFailed(true);
      setErrorMessage(error.response?.data?.message || "Invalid or expired confirmation link.");
      toast.error(error.response?.data?.message || "Invalid or expired confirmation link.");
    }
  };

  return (
    <div className="confirm-login-page">
      {loading ? (
        <div className="confirm-card">
          <div className="loader"></div>
          <h2>Verifying your login...</h2>
          <p>Please wait while we securely verify your account.</p>
        </div>
      ) : verified ? (
        <div className="confirm-card">
          <h2>Login Successful</h2>
          <p>Redirecting to your dashboard...</p>
        </div>
      ) : verificationFailed && !verifyToken ? (
        <div className="confirm-card">
          <h2>Invalid Link</h2>
          <p>This confirmation link is missing required information.</p>
          <button onClick={() => (window.location.href = "/")}>
            Back to Login
          </button>
        </div>
      ) : verificationFailed ? (
        <div className="confirm-card">
          <h2>Verification Failed</h2>
          <p>{errorMessage || "The confirmation link is invalid or has expired."}</p>
          <button onClick={() => (window.location.href = "/")}>
            Back to Login
          </button>
        </div>
      ) : (
        <div className="confirm-card">
          <h2>Confirm Your Login</h2>
          <p>Click the button below to confirm this login was you.</p>
          <button onClick={confirmLogin}>
            Yes, it&apos;s me
          </button>
        </div>
      )}
    </div>
  );
};

export default ConfirmLogin;