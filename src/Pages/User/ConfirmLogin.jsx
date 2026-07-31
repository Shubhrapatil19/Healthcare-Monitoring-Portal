import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";
import "./ConfirmLogin.css";

const ConfirmLogin = ({ onLoginSuccess }) => {
  // Compute state directly from URL params — no useState needed for these
  const params = new URLSearchParams(window.location.search);
  const jwt = params.get("token");
  const verificationFailed = !jwt;
  const loading = !!jwt;

  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    if (!jwt) {
      toast.error("Invalid confirmation link.");
      return;
    }

    // Store JWT directly (backend already verified this token)
    localStorage.setItem("token", jwt);

    // Fetch user profile to get name and store it
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/profile/complete");
        if (response.data) {
          const userData = response.data;
          if (userData.fullName) {
            localStorage.setItem("currentUserName", userData.fullName);
            localStorage.setItem("registeredUser", JSON.stringify({
              fullName: userData.fullName,
              email: userData.email || "",
            }));
          }
        }
      } catch {
        // If profile fetch fails, try to get name from JWT or use default
        try {
          // Decode JWT payload to get user info
          const payload = JSON.parse(atob(jwt.split('.')[1]));
          if (payload.fullName || payload.name) {
            const userName = payload.fullName || payload.name || "User";
            localStorage.setItem("currentUserName", userName);
            localStorage.setItem("registeredUser", JSON.stringify({
              fullName: userName,
              email: payload.email || payload.sub || "",
            }));
          }
        } catch {
          // If all fails, name will be "User" from fallback
        }
      }
    };

    fetchUserProfile();

    toast.success("Login Successful");

    // Redirect to dashboard via parent state after short delay
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 1500);
  }, [jwt, onLoginSuccess]);

  return (
    <div className="confirm-login-page">
      {loading ? (
        <div className="confirm-card">
          <div className="loader"></div>

          <h2>Verifying your login...</h2>

          <p>
            Please wait while we securely verify your
            account.
          </p>
        </div>
      ) : verificationFailed ? (
        <div className="confirm-card">
          <h2>Verification Failed</h2>

          <p>
            The confirmation link is invalid or has
            expired.
          </p>

          <button onClick={() => window.location.href = "/"}>
            Back to Login
          </button>
        </div>
      ) : (
        <div className="confirm-card">
          <h2>Login Successful</h2>

          <p>
            Redirecting to your dashboard...
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfirmLogin;