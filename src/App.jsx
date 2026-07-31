import "./App.css";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

import UserRegister from "./Pages/User/UserRegister";
import UserLogin from "./Pages/User/UserLogin";
import UserDash from "./Pages/User/UserDash";
import ConfirmLogin from "./Pages/User/ConfirmLogin"; // ✅ NEW: Import ConfirmLogin page

function App() {
  // ✅ Determine initial view from URL token or localStorage
  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      return "confirmLogin";
    }
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      return "dashboard";
    }
    return "login";
  };

  const [view, setView] = useState(getInitialView);

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

      {/* ================= REGISTER PAGE ================= */}
      {view === "register" ? (
        <UserRegister onSuccess={() => setView("login")} />

      ) : view === "login" ? (

        /* ================= LOGIN PAGE ================= */
        <UserLogin
          // ❌ Email confirmation flow me yahan dashboard open nahi hoga.
          // Dashboard email verification ke baad hi open hoga.
          onGoRegister={() => setView("register")}
        />

      ) : view === "confirmLogin" ? (

        /* ================= EMAIL CONFIRMATION PAGE ================= */
        <ConfirmLogin
          // ✅ JWT verify hone ke baad dashboard open karega
          onLoginSuccess={() => setView("dashboard")}
        />

      ) : (

        /* ================= DASHBOARD ================= */
        <UserDash onLogout={() => setView("login")} />
      )}
    </>
  );
}

export default App;