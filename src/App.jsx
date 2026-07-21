import "./App.css";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import UserRegister from "./Pages/User/UserRegister";
import UserLogin from "./Pages/User/UserLogin";
import UserDash from "./Pages/User/UserDash";


function App() {
  const [view, setView] = useState("register");

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
      {view === "register" ? (
        <UserRegister onSuccess={() => setView("login")} />
      ) : view === "login" ? (
        <UserLogin
          onLoginSuccess={() => setView("dashboard")}
          onGoRegister={() => setView("register")}
        />
      ) : (
        // dashboard
        <UserDash onLogout={() => setView("login")} />
      )}
    </>
  );
}


export default App;

