import React, { useEffect, useState } from 'react';

const styles = {
    page: {
        minHeight: "100vh",
        background: "#0f1117",
        fontFamily: "'IBM Plex Mono', monospace",
        padding: "40px",
        boxSizing: "border-box",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
    },
    title: {
        color: "#e2e8f0",
        fontSize: "20px",
        fontWeight: "600",
        letterSpacing: "-0.5px",
    },
    logoutButton: {
        background: "transparent",
        border: "1px solid #2a2d3a",
        color: "#6b7280",
        borderRadius: "6px",
        padding: "7px 14px",
        fontSize: "12px",
        fontFamily: "'IBM Plex Mono', monospace",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    addButton: {
        marginLeft: "12px",
        background: "#0b1220",
        border: "1px solid #2a2d3a",
        color: "#9ca3af",
        borderRadius: "6px",
        padding: "7px 14px",
        fontSize: "12px",
        cursor: "pointer",
    },
    deleteButton: {
        marginLeft: "8px",
        background: "transparent",
        border: "1px solid #7f1d1d",
        color: "#fca5a5",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "12px",
        cursor: "pointer",
    },
    viewLogButton: {
        marginLeft: "8px",
        background: "transparent",
        border: "1px solid #2a6bff",
        color: "#93c5fd",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "12px",
        cursor: "pointer",
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
    table: {
        width: "100%",
        borderCollapse: "collapse",
        background: "#1a1d27",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #2a2d3a",
    },
    th: {
        background: "#12141e",
        color: "#6b7280",
        fontSize: "11px",
        letterspacing: "0.1em",
        textTransform: "uppercase",
        padding: "12px 16px",
        textAlign: "left",
        borderBottom: "1px solid #2a2d3a",
    },
    td: {
        color: "#cbd5e1",
        fontSize: "13px",
        padding: "12px 16px",
        borderBottom: "1px solid #1e2130",
    },
    statusOnline: {
        display: "inline-block",
        background: "#052e16",
        color: "#4ade80",
        border: "1px solid #166534",
        borderRadius: "4px",
        fontSize: "11px",
        padding: "2px 8px",
        letterSpacing: "0.5em",
    },
    statusOffline: {
        display: "inline-block",
        background: "#1f2937",
        color: "#9ca3af",
        border: "1px solid #374151",
        borderRadius: "4px",
        fontSize: "11px",
        padding: "2px 8px",
        letterSpacing: "0.5em",
    },
    empty: {
        color: "#4b5563",
        fontSize: "13px",
        padding: "40px 16px",
        textAlign: "center",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        background: "#0b0f14",
        border: "1px solid #232530",
        borderRadius: "8px",
        padding: "20px",
        width: "680px",
        maxWidth: "95%",
        boxSizing: "border-box",
        color: "#cbd5e1",
    },
    formRow: {
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
    },
    input: {
        padding: "8px 10px",
        borderRadius: "6px",
        border: "1px solid #2a2d3a",
        background: "#0f1117",
        color: "#cbd5e1",
        fontFamily: "'IBM Plex Mono', monospace",
    },
    formActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
        marginTop: "12px",
    },
    submitButton: {
        background: "#0b1220",
        border: "1px solid #2a2d3a",
        color: "#9ca3af",
        borderRadius: "6px",
        padding: "7px 14px",
        fontSize: "12px",
        cursor: "pointer",
    },
    cancelButton: {
        background: "transparent",
        border: "1px solid #2a2d3a",
        color: "#6b7280",
        borderRadius: "6px",
        padding: "7px 14px",
        fontSize: "12px",
        cursor: "pointer",
    },
    logMeta: {
        color: "#9ca3af",
        fontSize: "13px",
        marginBottom: "8px",
    },
    logPre: {
        background: "#05060a",
        border: "1px solid #22262b",
        color: "#cbd5e1",
        padding: "12px",
        borderRadius: "6px",
        maxHeight: "360px",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "13px",
    },
};

function authHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function Dashboard({ onLogout }) {
    const [devices, setDevices] = useState([]);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState("");
    const [os, setOs] = useState("");
    const [host, setHost] = useState("");
    const [sshUsername, setSshUsername] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Log modal state
    const [showLogModal, setShowLogModal] = useState(false);
    const [logJob, setLogJob] = useState(null);
    const [logLoading, setLogLoading] = useState(false);

    // Fetch devices function so we can reuse it after creating a device
    const fetchDevices = () => {
        setError("");
        fetch("http://localhost:5000/devices/", { headers: authHeaders() })
            .then((res) => {
                if (res.status === 401) {
                    onLogout();
                    return null;
                }
                if (!res.ok) throw new Error("Failed to fetch devices");
                return res.json();
            })
            .then((data) => {
                if (data) setDevices(data);
            })
            .catch((err) => setError(err.message));
    };

    useEffect(() => {
        fetchDevices();
    }, [onLogout]);

    const openModal = () => {
        setName("");
        setOs("");
        setHost("");
        setSshUsername("");
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const handleCreateDevice = (e) => {
        e.preventDefault();
        setError("");
        if (!name.trim() || !os.trim()) {
            setError("Name and OS are required.");
            return;
        }
        setSubmitting(true);
        fetch("http://localhost:5000/devices/", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                name: name.trim(),
                os: os.trim(),
                host: host.trim() || undefined,
                ssh_username: sshUsername.trim() || undefined,
            }),
        })
            .then((res) => {
                setSubmitting(false);
                if (res.status === 401) {
                    onLogout();
                    return null;
                }
                if (!res.ok) {
                    return res.text().then((txt) => {
                        throw new Error(txt || "Failed to create device");
                    });
                }
                // backend returns message; refresh device list
                closeModal();
                fetchDevices();
            })
            .catch((err) => {
                setSubmitting(false);
                setError(err.message || "Failed to create device");
            });
    };

    const handleDeleteDevice = (deviceId) => {
        if (!window.confirm("Delete this device? This action cannot be undone.")) return;
        setError("");
        setDeletingId(deviceId);
        fetch(`http://localhost:5000/devices/${deviceId}`, {
            method: "DELETE",
            headers: authHeaders(),
        })
            .then((res) => {
                setDeletingId(null);
                if (res.status === 401) {
                    onLogout();
                    return null;
                }
                if (!res.ok) {
                    return res.text().then((txt) => {
                        throw new Error(txt || "Failed to delete device");
                    });
                }
                fetchDevices();
            })
            .catch((err) => {
                setDeletingId(null);
                setError(err.message || "Failed to delete device");
            });
    };

    // Open log modal for a device: fetch script jobs and show the latest for that device
    const openLogModal = (deviceId) => {
        setError("");
        setLogJob(null);
        setShowLogModal(true);
        setLogLoading(true);
        fetch("http://localhost:5000/scripts/", { headers: authHeaders() })
            .then((res) => {
                setLogLoading(false);
                if (res.status === 401) {
                    onLogout();
                    return null;
                }
                if (!res.ok) throw new Error("Failed to fetch script jobs");
                return res.json();
            })
            .then((jobs) => {
                if (!jobs) return;
                // Filter jobs for device and sort by created_at descending (most recent first)
                const deviceJobs = jobs
                    .filter((j) => j.device_id === deviceId)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setLogJob(deviceJobs.length > 0 ? deviceJobs[0] : { result: "No jobs found for this device.", status: "none" });
            })
            .catch((err) => {
                setLogLoading(false);
                setError(err.message || "Failed to load logs");
            });
    };

    const closeLogModal = () => {
        setShowLogModal(false);
        setLogJob(null);
        setLogLoading(false);
    };

    return (
        <div style={styles.page}>
            <link
                href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap"
                rel="stylesheet"
            />
            <div style={styles.header}>
                <div style={styles.title}>IT Automation Dashboard</div>
                <div>
                    <button style={styles.addButton} onClick={openModal}>
                        Add Device
                    </button>
                    <button style={styles.logoutButton} onClick={onLogout}>
                        Sign Out
                    </button>
                </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>OS</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={styles.empty}>
                                No devices registered yet.
                            </td>
                        </tr>
                    ) : (
                        devices.map((d) => (
                            <tr key={d.id}>
                                <td style={styles.td}>{d.id}</td>
                                <td style={styles.td}>{d.name}</td>
                                <td style={styles.td}>{d.os}</td>
                                <td style={styles.td}>
                                    <span
                                        style={
                                            d.status === "online"
                                                ? styles.statusOnline
                                                : styles.statusOffline
                                        }
                                    >
                                        {d.status}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <button
                                        style={styles.viewLogButton}
                                        onClick={() => openLogModal(d.id)}
                                    >
                                        View Logs
                                    </button>
                                    <button
                                        style={styles.deleteButton}
                                        onClick={() => handleDeleteDevice(d.id)}
                                        disabled={deletingId === d.id}
                                    >
                                        {deletingId === d.id ? "Deleting..." : "Delete"}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Add Device Modal */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={{ marginTop: 0 }}>Add Device</h3>
                        <form onSubmit={handleCreateDevice}>
                            <div style={styles.formRow}>
                                <label style={{ marginBottom: 6, color: "#9ca3af" }}>Name</label>
                                <input
                                    style={styles.input}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Device name"
                                />
                            </div>
                            <div style={styles.formRow}>
                                <label style={{ marginBottom: 6, color: "#9ca3af" }}>OS</label>
                                <input
                                    style={styles.input}
                                    value={os}
                                    onChange={(e) => setOs(e.target.value)}
                                    placeholder="e.g. linux, windows"
                                />
                            </div>
                            <div style={styles.formRow}>
                                <label style={{ marginBottom: 6, color: "#9ca3af" }}>Host (optional)</label>
                                <input
                                    style={styles.input}
                                    value={host}
                                    onChange={(e) => setHost(e.target.value)}
                                    placeholder="IP or hostname for SSH"
                                />
                            </div>
                            <div style={styles.formRow}>
                                <label style={{ marginBottom: 6, color: "#9ca3af" }}>SSH Username (optional)</label>
                                <input
                                    style={styles.input}
                                    value={sshUsername}
                                    onChange={(e) => setSshUsername(e.target.value)}
                                    placeholder="ssh user"
                                />
                            </div>

                            <div style={styles.formActions}>
                                <button
                                    type="button"
                                    style={styles.cancelButton}
                                    onClick={closeModal}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" style={styles.submitButton} disabled={submitting}>
                                    {submitting ? "Adding..." : "Add Device"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log Modal */}
            {showLogModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={{ marginTop: 0 }}>Remote Terminal Log</h3>
                        {logLoading ? (
                            <div style={styles.logMeta}>Loading...</div>
                        ) : logJob ? (
                            <>
                                <div style={styles.logMeta}>
                                    <strong>Job ID:</strong> {logJob.id || "N/A"} &nbsp; • &nbsp;
                                    <strong>Status:</strong> {logJob.status || "N/A"} &nbsp; • &nbsp;
                                    <strong>Created:</strong> {logJob.created_at || "N/A"}
                                </div>
                                <div style={styles.logPre}>
                                    {logJob.result || "No result available."}
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                                    <button style={styles.cancelButton} onClick={closeLogModal}>Close</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={styles.logMeta}>No logs available.</div>
                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                                    <button style={styles.cancelButton} onClick={closeLogModal}>Close</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
