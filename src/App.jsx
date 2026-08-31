import "./App.css";

import { useState } from "react";
import { Toaster } from "react-hot-toast";

import UserRegister from "./Pages/User/UserRegister";
import UserLogin from "./Pages/User/UserLogin";
import UserDash from "./Pages/User/UserDash";
import UserForget from "./Pages/User/UserForget";
import UserResetPassword from "./Pages/User/UserResetPassword";

import AdminDashboard from "./Pages/Admin/AdminDashboard";

function App() {
  const getInitialView = () => {
    const currentPath =
      window.location.pathname.toLowerCase();

    const params =
      new URLSearchParams(window.location.search);

    const token = params.get("token");

    // Verify email link
    // /verify-email?token=xxxxx
    if (currentPath.includes("verify-email")) {
      return "register";
    }

    // Reset password link
    if (
      currentPath.includes("reset-password") &&
      token
    ) {
      return "resetPassword";
    }

    const savedToken =
      localStorage.getItem("token");

    const savedRole =
      localStorage.getItem("userRole");

    const isLoggedIn =
      localStorage.getItem("isLoggedIn");

    if (
      savedToken &&
      isLoggedIn === "true"
    ) {
      if (savedRole === "ADMIN") {
        return "adminDashboard";
      }

      return "dashboard";
    }

    return "login";
  };

  const [view, setView] =
    useState(getInitialView);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUserName");

    window.history.replaceState(
      {},
      document.title,
      "/"
    );

    setView("login");
  };

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          zIndex: 20000,
        }}
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            minWidth: "320px",
            maxWidth: "420px",
            border: "1px solid #dbe7ef",
            borderRadius: "8px",
            padding: "14px 18px",
            color: "#243044",
            background: "#ffffff",
            boxShadow:
              "0 18px 45px rgba(15, 23, 42, 0.18)",
            fontSize: "14px",
            fontWeight: "600",
            lineHeight: "1.35",
          },
          success: {
            iconTheme: {
              primary: "#0f8f65",
              secondary: "#ffffff",
            },
            style: {
              borderLeft: "4px solid #0f8f65",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
            style: {
              borderLeft: "4px solid #ef4444",
            },
          },
        }}
      />

      {view === "register" ? (
        <UserRegister
          onSuccess={handleBackToLogin}
        />
      ) : view === "login" ? (
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
        <UserResetPassword
          onBackToLogin={
            handleBackToLogin
          }
        />
      ) : view === "forgetPassword" ? (
        <UserForget
          isOpen={true}
          onClose={
            handleBackToLogin
          }
        />
      ) : view === "adminDashboard" ? (
        <AdminDashboard
          onLogout={
            handleLogout
          }
        />
      ) : (
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
