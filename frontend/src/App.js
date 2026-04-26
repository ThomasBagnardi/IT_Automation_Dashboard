import React, { useState } from "react";
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard";

function App() {
    // Initialize from localStorage so the user stays logged in on page refresh
    const [token, setToken] = useState(localStorage.getItem("token") || "");

    const handleLogin = (newToken) => {
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setToken("");
    };

    return token ? (
        <Dashboard onLogout={handleLogout} />
    ) : (
        <Login onLogin={handleLogin} />
    );
}

export default App;