import React, { useState } from "react";

const styles = {
    page: {
        minHeight: "100vh",
        background: "#0f1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'IBM Plex Mono', monospace"
    },
    card: {
        background: "#1a1d27",
        border: "1px solid #2a2d3a",
        borderRadius: "8px",
        padding: "40px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    },
    title: {
        color: "#e2e8f0",
        fontSize: "22px",
        fontWeight: "600",
        marginBottom: "4px",
        letterSpacing: "-0.5px",
    },
    subtitle: {
        color: "#6b7280",
        fontSize: "13px",
        marginBottom: "32px",
    },
    label: {
        display: "block",
        color: "#9ca3af",
        fontSize: "12px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "6px",
    },
    input: {
        width: "100%",
        background: "#0f1117",
        border: "1px solid #2a2d3a",
        borderRadius: "6px",
        color: "#e2e8f0",
        fontSize: "14px",
        padding: "14px",
        marginBottom: "20px",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "'IBM Plex Mono', monospace",
        transition: "border-color 0.2s",
    },
    button: {
        width: "100%",
        background: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "11px",
        fontSize: "14px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: "600",
        cursor: "pointer",
        letterSpacing: "0.04em",
        transition: "background 0.2s",
    },
    error: {
        background: "#2d1b1b",
        border: "1px solid #7f1d1d",
        color: "#fca5a5",
        borderRadius: "6px",
        padding: "10px 14px",
        fontSize: "13px",
        marginBottom: "20px",
    },
};

function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setError("");
        setLoading(true);

        // auth2PasswordRequestForm expects form data, not JSON
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        try {
            const res = await fetch("http://localhost:5000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString(),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || "Login failed");
                return;
            }

            // Store token and notify parent
            localStorage.setItem("token", data.access_token);
            onLogin(data.access_token);
        } catch (err) {
            setError("Could not reach server. Is the API running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            {/* Load IBM Plex Mono from Google Fonts */}
            <link
                href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap"
                rel="stylesheet"
            />
            <div style={styles.card}>
                <div style={styles.title}>IT Automation</div>
                <div style={styles.subtitle}>Please login to access your dashboard</div>

                {error && <div style={styles.error}>{error}</div>}

                <label style={styles.label}>Username</label>
                <input
                    style={styles.input}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoFocus
                />

                <label style={styles.label}>Password</label>
                <input
                    style={styles.input}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />

                <button
                    style={styles.button}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </div>
        </div>
    );
}

export default Login;