import "./App.css";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

import UserRegister from "./Pages/User/UserRegister";
import UserLogin from "./Pages/User/UserLogin";
import UserDash from "./Pages/User/UserDash";
import ConfirmLogin from "./Pages/User/ConfirmLogin";

function App() {
  // =========================================================
  // INITIAL VIEW
  // =========================================================

  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // Email confirmation link case
    if (token) {
      return "confirmLogin";
    }

    // Already logged in case
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      return "dashboard";
    }

    return "login";
  };

  const [view, setView] = useState(getInitialView);

  // =========================================================
  // LOGIN SUCCESS
  // =========================================================

  const handleLoginSuccess = () => {
    localStorage.setItem("isLoggedIn", "true");

    // Login ke baad dashboard render hoga
    setView("dashboard");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");

    setView("login");
  };

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "10px",
            padding: "14px 20px",
            fontSize: "14px",
            fontWeight: "600",
          },
        }}
      />

      {/* =====================================================
          REGISTER PAGE
      ===================================================== */}

      {view === "register" ? (
        <UserRegister
          onSuccess={() => setView("login")}
        />

      ) : view === "login" ? (

        /* =====================================================
            LOGIN PAGE
        ===================================================== */

        <UserLogin
          onGoRegister={() => setView("register")}

          // IMPORTANT:
          // Successful login ke baad dashboard open karega
          onLoginSuccess={handleLoginSuccess}
        />

      ) : view === "confirmLogin" ? (

        /* =====================================================
            EMAIL CONFIRMATION PAGE
        ===================================================== */

        <ConfirmLogin
          onLoginSuccess={handleLoginSuccess}
        />

      ) : (

        /* =====================================================
            DASHBOARD
        ===================================================== */

        <UserDash
          onLogout={handleLogout}
        />

      )}
    </>
  );
}

export default App;