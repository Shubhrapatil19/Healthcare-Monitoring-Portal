import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";
import "./ConfirmLogin.css";

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
      // Verify the token with the backend
      const response = await api.get(
        `/auth/confirm-login?token=${verifyToken}`
      );

      // IMPORTANT: check that a real token came back before saving anything
      if (!response.data.token) {
        setLoading(false);
        setVerificationFailed(true);
        setErrorMessage(
          response.data.message || "Confirmation link expired or already used."
        );
        toast.error(
          response.data.message || "Confirmation link expired or already used."
        );
        return;
      }

      const jwt = response.data.token;

      // Save REAL JWT returned by backend
      localStorage.setItem("token", jwt);

      // Fetch user profile to get name and store it
      const fetchUserProfile = async () => {
        try {
          const profileResponse = await api.get("/profile/complete");
          if (profileResponse.data) {
            const userData = profileResponse.data;
            if (userData.fullName) {
              localStorage.setItem("currentUserName", userData.fullName);
              localStorage.setItem(
                "registeredUser",
                JSON.stringify({
                  fullName: userData.fullName,
                  email: userData.email || "",
                })
              );
            }
          }
        } catch {
          // If profile fetch fails, try to get name from JWT or use default
          try {
            const payload = JSON.parse(atob(jwt.split(".")[1]));
            if (payload.fullName || payload.name) {
              const userName = payload.fullName || payload.name || "User";
              localStorage.setItem("currentUserName", userName);
              localStorage.setItem(
                "registeredUser",
                JSON.stringify({
                  fullName: userName,
                  email: payload.email || payload.sub || "",
                })
              );
            }
          } catch {
            // If all fails, name will be "User" from fallback
          }
        }
      };

      await fetchUserProfile();

      setVerified(true);
      toast.success("Login Successful");

      setTimeout(() => {
        onLoginSuccess?.();
      }, 1500);
    } catch {
      setLoading(false);
      setVerificationFailed(true);
      setErrorMessage("Invalid or expired confirmation link.");
      toast.error("Invalid or expired confirmation link.");
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