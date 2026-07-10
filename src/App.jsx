import "./App.css";
import { useState } from "react";
import UserRegister from "./Pages/User/UserRegister";
import UserLogin from "./Pages/User/UserLogin";
import UserDash from "./Pages/User/UserDash";


function App() {
  const [view, setView] = useState("register");

  return (
    <>
      {view === "register" ? (
        <UserRegister onSuccess={() => setView("login")} />
      ) : view === "login" ? (
        <UserLogin onLoginSuccess={() => setView("dashboard")} />
      ) : (
        // dashboard
        <UserDash />
      )}
    </>
  );
}


export default App;

