import "./App.css";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

import UserRegister from "./Pages/User/UserRegister";
import UserLogin from "./Pages/User/UserLogin";
import UserDash from "./Pages/User/UserDash";
import ConfirmLogin from "./Pages/User/ConfirmLogin";

import AdminDashboard from "./Pages/Admin/AdminDashboard";

function App() {
  // =========================================================
  // INITIAL VIEW
  // =========================================================

  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    // Email confirmation link case
    if (tokenFromUrl) {
      return "confirmLogin";
    }

    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("userRole");

    // Already logged in
    if (savedToken) {
      if (savedRole === "ADMIN") {
        return "adminDashboard";
      }

      return "dashboard";
    }

    return "login";
  };

  const [view, setView] = useState(getInitialView);

  // =========================================================
  // USER LOGIN SUCCESS
  // =========================================================

  const handleUserLoginSuccess = () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", "USER");

    setView("dashboard");
  };

  // =========================================================
  // ADMIN LOGIN SUCCESS
  // =========================================================

  const handleAdminLoginSuccess = () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", "ADMIN");

    setView("adminDashboard");
  };

  // =========================================================
  // CONFIRM LOGIN SUCCESS
  // =========================================================

  const handleConfirmLoginSuccess = () => {
    const role = localStorage.getItem("userRole");

    if (role === "ADMIN") {
      setView("adminDashboard");
    } else {
      setView("dashboard");
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUserName");

    setView("login");
  };

  // =========================================================
  // UI
  // =========================================================

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
            SAME LOGIN PAGE
            USER + ADMIN
        ===================================================== */

        <UserLogin
          onGoRegister={() => setView("register")}
          onLoginSuccess={handleUserLoginSuccess}
          onAdminLoginSuccess={handleAdminLoginSuccess}
        />

      ) : view === "confirmLogin" ? (

        /* =====================================================
            EMAIL CONFIRMATION PAGE
        ===================================================== */

        <ConfirmLogin
          onLoginSuccess={handleConfirmLoginSuccess}
        />

      ) : view === "adminDashboard" ? (

        /* =====================================================
            ADMIN DASHBOARD
        ===================================================== */

        <AdminDashboard
          onLogout={handleLogout}
        />

      ) : (

        /* =====================================================
            USER DASHBOARD
        ===================================================== */

        <UserDash
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;