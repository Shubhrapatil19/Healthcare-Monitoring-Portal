import "./App.css";

import { useState } from "react";
import { Toaster } from "react-hot-toast";

// =========================================================
// USER PAGES
// =========================================================

import UserRegister from "./Pages/User/UserRegister";
import UserLogin from "./Pages/User/UserLogin";
import UserDash from "./Pages/User/UserDash";
import UserForget from "./Pages/User/UserForget";
import UserResetPassword from "./Pages/User/UserResetPassword";

// =========================================================
// ADMIN
// =========================================================

import AdminDashboard from "./Pages/Admin/AdminDashboard";

function App() {
  // =========================================================
  // INITIAL VIEW
  // =========================================================

  const getInitialView = () => {
    const currentPath =
      window.location.pathname.toLowerCase();

    const params =
      new URLSearchParams(
        window.location.search
      );

    const resetToken =
      params.get("token");

    // =====================================================
    // RESET PASSWORD EMAIL LINK
    //
    // Example:
    // /reset-password?token=xxxxx
    // =====================================================

    if (
      currentPath.includes(
        "reset-password"
      ) &&
      resetToken
    ) {
      return "resetPassword";
    }

    // =====================================================
    // ALREADY LOGGED IN
    // =====================================================

    const savedToken =
      localStorage.getItem(
        "token"
      );

    const savedRole =
      localStorage.getItem(
        "userRole"
      );

    const isLoggedIn =
      localStorage.getItem(
        "isLoggedIn"
      );

    if (
      savedToken &&
      isLoggedIn === "true"
    ) {
      if (
        savedRole === "ADMIN"
      ) {
        return "adminDashboard";
      }

      return "dashboard";
    }

    // =====================================================
    // DEFAULT
    // =====================================================

    return "login";
  };

  // =========================================================
  // CURRENT VIEW
  // =========================================================

  const [view, setView] =
    useState(getInitialView);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleNavigateToForget = () => {
    setView("forgetPassword");
  };

  const handleBackToLogin = () => {
    window.history.replaceState(
      {},
      document.title,
      "/"
    );

    setView("login");
  };

  // =========================================================
  // USER LOGIN SUCCESS
  // =========================================================

  const handleUserLoginSuccess = () => {
    localStorage.setItem(
      "isLoggedIn",
      "true"
    );

    localStorage.setItem(
      "userRole",
      "USER"
    );

    window.history.replaceState(
      {},
      document.title,
      "/"
    );

    setView("dashboard");
  };

  // =========================================================
  // ADMIN LOGIN SUCCESS
  // =========================================================

  const handleAdminLoginSuccess = () => {
    localStorage.setItem(
      "isLoggedIn",
      "true"
    );

    localStorage.setItem(
      "userRole",
      "ADMIN"
    );

    window.history.replaceState(
      {},
      document.title,
      "/"
    );

    setView("adminDashboard");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "isLoggedIn"
    );

    localStorage.removeItem(
      "userRole"
    );

    localStorage.removeItem(
      "currentUserName"
    );

    window.history.replaceState(
      {},
      document.title,
      "/"
    );

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
          REGISTER
      ===================================================== */}

      {view === "register" ? (
        <UserRegister
          onSuccess={() =>
            setView("login")
          }
        />

      ) : view === "login" ? (

        /* ===================================================
            LOGIN

            USER  = REAL API
            ADMIN = MOCK API
        =================================================== */

        <UserLogin
          onGoRegister={() =>
            setView("register")
          }

          onLoginSuccess={
            handleUserLoginSuccess
          }

          onAdminLoginSuccess={
            handleAdminLoginSuccess
          }

          onGoForget={
            handleNavigateToForget
          }
        />

      ) : view === "resetPassword" ? (

        /* ===================================================
            RESET PASSWORD
        =================================================== */

        <UserResetPassword
          onBackToLogin={
            handleBackToLogin
          }
        />

      ) : view === "forgetPassword" ? (

        /* ===================================================
            FORGOT PASSWORD
        =================================================== */

        <UserForget
          isOpen={true}
          onClose={
            handleBackToLogin
          }
        />

      ) : view === "adminDashboard" ? (

        /* ===================================================
            ADMIN DASHBOARD
        =================================================== */

        <AdminDashboard
          onLogout={
            handleLogout
          }
        />

      ) : (

        /* ===================================================
            USER DASHBOARD
        =================================================== */

        <UserDash
          onLogout={
            handleLogout
          }
        />
      )}
    </>
  );
}

export default App;