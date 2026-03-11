import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import API from "../api/axios";
import Navbar from "../components/Navbar";

const useWindowWidth = () => {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handle = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, []);
    return width;
};

const colors = (isDark) => ({
    pageBg: isDark ? "#0a0a14" : "#f0f4f8",
    cardBg: isDark ? "#13131f" : "#ffffff",
    cardBorder: isDark ? "#1e1e2e" : "transparent",
    title: isDark ? "#f0f0ff" : "#1a202c",
    subtitle: isDark ? "#6b7280" : "#718096",
    input: isDark ? "#1a1a2e" : "#f8fafc",
    inputBorder: isDark ? "#2d2d3d" : "#e2e8f0",
    inputColor: isDark ? "#e2e8f0" : "#1a202c",
    selectBg: isDark ? "#1a1a2e" : "#ffffff",
    statCard: isDark ? "#13131f" : "#ffffff",
    taskCard: isDark ? "#13131f" : "#ffffff",
    taskBorder: isDark ? "#1e1e2e" : "transparent",
    metaColor: isDark ? "#6b7280" : "#718096",
    pageBtn: isDark ? "#1a1a2e" : "#ffffff",
    pageBtnBorder: isDark ? "#2d2d3d" : "#e2e8f0",
    pageBtnColor: isDark ? "#e2e8f0" : "#4a5568",
    modalBg: isDark ? "#13131f" : "#ffffff",
    labelColor: isDark ? "#9ca3af" : "#4a5568",
    overlayBg: "rgba(0,0,0,0.7)",
});

export default function Dashboard() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const width = useWindowWidth();
    const isMobile = width <= 600;
    const c = colors(isDark);

    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, missed: 0 });
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ category: "", priority: "", status: "", page: 1 });
    const [searchQ, setSearchQ] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [form, setForm] = useState({
        title: "", category: "work", priority: "Medium",
        deadline: "", estimatedTime: 0, reminderTime: "",
    });

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.category) params.category = filters.category;
            if (filters.priority) params.priority = filters.priority;
            if (filters.status) params.status = filters.status;
            params.page = filters.page;
            params.limit = 5;
            const res = await API.get("/api/task/", { params });
            const data = res.data;
            setTasks(data.tasks || data.data || data || []);
        } catch (err) {
            showToast("Failed to fetch tasks", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await API.get("/api/task/stats");
            setStats(res.data);
        } catch (err) {
            console.error("Stats error", err);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchStats();
    }, [filters]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQ.trim()) return fetchTasks();
        try {
            const res = await API.get(`/api/task/search?q=${searchQ}`);
            setTasks(res.data.tasks || res.data);
        } catch (err) {
            showToast("Search failed", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // ✅ Simplest correct approach for all devices
            let reminderISO = "";
            if (form.reminderTime) {
                // datetime-local gives "2026-03-11T10:00"
                // Adding ":00" makes it parseable on all browsers
                const reminderDate = new Date(form.reminderTime + ":00");
                reminderISO = reminderDate.toISOString();
            }

            let deadlineISO = "";
            if (form.deadline) {
                const [year, month, day] = form.deadline.split("-").map(Number);
                const d = new Date(year, month - 1, day, 12, 0, 0);
                deadlineISO = d.toISOString();
            }

            const payload = {
                ...form,
                reminderTime: reminderISO,
                deadline: deadlineISO,
            };

            // Debug — remove after confirming it works
            showToast(`Reminder UTC: ${reminderISO}`, "info");

            if (editTask) {
                await API.patch(`/api/task/${editTask._id}`, payload);
                showToast("Task updated! ✏️", "success");
            } else {
                await API.post("/api/task/", payload);
                showToast("Task created! 🎉", "success");
            }
            setShowForm(false);
            setEditTask(null);
            resetForm();
            fetchTasks();
            fetchStats();
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to save task", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await API.delete(`/api/task/${id}`);
            showToast("Task deleted 🗑", "warning");
            await fetchTasks();
            await fetchStats();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to delete task", "error");
        }
    };

    const handleComplete = async (id) => {
        try {
            await API.patch(`/api/task/${id}/complete`);
            showToast("Task completed! ✅", "success");
            await fetchTasks();
            await fetchStats();
        } catch (err) {
            showToast("Failed to mark complete", "error");
        }
    };

    const handleEdit = (task) => {
        setEditTask(task);

        let reminderLocal = "";
        if (task.reminderTime) {
            const date = new Date(task.reminderTime);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - offset * 60000);
            reminderLocal = localDate.toISOString().slice(0, 16);

            // ✅ Debug
            console.log("DB reminderTime:", task.reminderTime);
            console.log("offset:", offset);
            console.log("showing in form:", reminderLocal);
        }

        setForm({
            title: task.title,
            category: task.category,
            priority: task.priority,
            deadline: task.deadline?.slice(0, 10),
            estimatedTime: task.estimatedTime,
            reminderTime: reminderLocal,
        });
        setShowForm(true);
    };


    const resetForm = () => {
        setForm({ title: "", category: "work", priority: "Medium", deadline: "", estimatedTime: 0, reminderTime: "" });
    };

    const priorityColor = { Low: "#38a169", Medium: "#d69e2e", High: "#e53e3e" };
    const priorityBorder = { Low: "#38a169", Medium: "#d69e2e", High: "#e53e3e" };
    const statusColor = { Pending: "#d69e2e", Completed: "#38a169", missed: "#e53e3e" };

    const inputStyle = {
        padding: "0.75rem 1rem",
        borderRadius: "10px",
        border: `1px solid ${c.inputBorder}`,
        fontSize: "0.95rem",
        outline: "none",
        width: "100%",
        backgroundColor: c.input,
        color: c.inputColor,
        boxSizing: "border-box",
        transition: "all 0.2s",
    };

    const selectStyle = {
        padding: "0.55rem 0.75rem",
        borderRadius: "10px",
        border: `1px solid ${c.inputBorder}`,
        backgroundColor: c.selectBg,
        color: c.inputColor,
        fontSize: "0.9rem",
        cursor: "pointer",
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: c.pageBg, transition: "background 0.3s" }}>
            <Navbar />

            <div style={{
                maxWidth: "900px",
                margin: "0 auto",
                padding: isMobile ? "1rem 0.75rem" : "2rem 1rem",
            }}>

                {/* Welcome */}
                <h2 style={{
                    color: c.title,
                    marginBottom: "1.5rem",
                    fontSize: isMobile ? "1.2rem" : "1.5rem",
                    fontWeight: "800",
                }}>
                    👋 Hello, {user?.name}!
                </h2>

                {/* Stats */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                    gap: isMobile ? "0.65rem" : "1rem",
                    marginBottom: "1.75rem",
                }}>
                    {[
                        { label: "Total", value: stats.total, color: "#6366f1", icon: "📋" },
                        { label: "Completed", value: stats.completed, color: "#38a169", icon: "✅" },
                        { label: "Pending", value: stats.pending, color: "#d69e2e", icon: "⏳" },
                        { label: "Missed", value: stats.missed, color: "#e53e3e", icon: "❌" },
                    ].map((s) => (
                        <div key={s.label} style={{
                            backgroundColor: c.statCard,
                            borderRadius: "12px",
                            padding: isMobile ? "0.85rem" : "1.1rem",
                            textAlign: "center",
                            boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.07)",
                            borderTop: `4px solid ${s.color}`,
                            border: `1px solid ${c.cardBorder}`,
                            borderTopColor: s.color,
                            transition: "all 0.3s",
                        }}>
                            <div style={{ fontSize: isMobile ? "1.2rem" : "1.4rem", marginBottom: "0.25rem" }}>
                                {s.icon}
                            </div>
                            <p style={{
                                fontSize: isMobile ? "1.6rem" : "2rem",
                                fontWeight: "800", margin: 0, color: s.color,
                            }}>
                                {s.value}
                            </p>
                            <p style={{
                                color: c.subtitle, margin: "0.2rem 0 0",
                                fontSize: isMobile ? "0.75rem" : "0.85rem",
                                fontWeight: "600",
                            }}>
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Search + Add */}
                <div style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "stretch" : "center",
                    marginBottom: "1rem",
                    gap: "0.75rem",
                }}>
                    <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
                        <input
                            style={{ ...inputStyle, flex: 1, minWidth: 0, padding: "0.6rem 0.9rem" }}
                            placeholder="Search tasks..."
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                        />
                        <button style={{
                            padding: "0.6rem 1rem",
                            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                            color: "#fff", border: "none", borderRadius: "10px",
                            cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
                            whiteSpace: "nowrap",
                        }} type="submit">Search</button>
                        <button style={{
                            padding: "0.6rem 0.85rem",
                            backgroundColor: isDark ? "#1e1e2e" : "#e2e8f0",
                            color: c.inputColor, border: "none", borderRadius: "10px",
                            cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap",
                        }} type="button" onClick={() => { setSearchQ(""); fetchTasks(); }}>
                            Clear
                        </button>
                    </form>

                    <button style={{
                        padding: "0.65rem 1.25rem",
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        color: "#fff", border: "none", borderRadius: "10px",
                        cursor: "pointer", fontWeight: "700", fontSize: "0.95rem",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
                    }} onClick={() => { resetForm(); setEditTask(null); setShowForm(true); }}>
                        + Add Task
                    </button>
                </div>

                {/* Filters */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
                    gap: "0.65rem",
                    marginBottom: "1.5rem",
                }}>
                    <select style={selectStyle} value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}>
                        <option value="">All Categories</option>
                        {["work", "personal", "health", "finance", "study"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select style={selectStyle} value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}>
                        <option value="">All Priorities</option>
                        {["Low", "Medium", "High"].map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    <select style={{
                        ...selectStyle,
                        gridColumn: isMobile ? "1 / -1" : "auto",
                    }} value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="missed">missed</option>
                    </select>
                </div>

                {/* Task List */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: c.subtitle }}>
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                        Loading tasks...
                    </div>
                ) : tasks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: c.subtitle }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📭</div>
                        No tasks found. Add one!
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        {tasks.map((task) => (
                            <div key={task._id} style={{
                                backgroundColor: c.taskCard,
                                borderRadius: "12px",
                                padding: isMobile ? "1rem" : "1.25rem",
                                boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.07)",
                                border: `1px solid ${c.taskBorder}`,
                                // ✅ Priority color left border
                                borderLeft: `4px solid ${priorityBorder[task.priority] || "#6366f1"}`,
                                transition: "all 0.2s",
                            }}>
                                {/* Header */}
                                <div style={{
                                    display: "flex", justifyContent: "space-between",
                                    alignItems: "flex-start", marginBottom: "0.6rem", gap: "0.5rem",
                                }}>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: isMobile ? "1rem" : "1.05rem",
                                        color: c.title, flex: 1, wordBreak: "break-word",
                                        fontWeight: "700",
                                    }}>
                                        {task.title}
                                    </h3>
                                    <span style={{
                                        color: "#fff",
                                        padding: "0.2rem 0.65rem",
                                        borderRadius: "20px",
                                        fontSize: "0.72rem",
                                        fontWeight: "700",
                                        backgroundColor: statusColor[task.status] || "#718096",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {task.status || "Pending"}
                                    </span>
                                </div>

                                {/* Meta */}
                                <div style={{
                                    display: "flex",
                                    gap: isMobile ? "0.5rem" : "1rem",
                                    color: c.metaColor,
                                    fontSize: isMobile ? "0.78rem" : "0.85rem",
                                    marginBottom: "0.85rem",
                                    flexWrap: "wrap",
                                }}>
                                    <span>📁 {task.category}</span>
                                    <span style={{ color: priorityColor[task.priority], fontWeight: "600" }}>
                                        🔥 {task.priority}
                                    </span>
                                    <span>📅 {task.deadline ? new Date(task.deadline).toLocaleDateString("en-IN") : ""}</span>
                                    <span>⏱ {task.estimatedTime}h</span>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {task.status !== "Completed" && (
                                        <button style={{
                                            padding: "0.38rem 0.75rem",
                                            backgroundColor: isDark ? "#1a2e22" : "#c6f6d5",
                                            color: "#38a169",
                                            border: "none", borderRadius: "8px", cursor: "pointer",
                                            fontSize: isMobile ? "0.75rem" : "0.82rem",
                                            fontWeight: "600",
                                        }} onClick={() => handleComplete(task._id)}>
                                            ✅ Complete
                                        </button>
                                    )}
                                    <button style={{
                                        padding: "0.38rem 0.75rem",
                                        backgroundColor: isDark ? "#1a1e2e" : "#ebf8ff",
                                        color: "#4299e1",
                                        border: "none", borderRadius: "8px", cursor: "pointer",
                                        fontSize: isMobile ? "0.75rem" : "0.82rem",
                                        fontWeight: "600",
                                    }} onClick={() => handleEdit(task)}>
                                        ✏️ Edit
                                    </button>
                                    <button style={{
                                        padding: "0.38rem 0.75rem",
                                        backgroundColor: isDark ? "#2e1a1a" : "#fff5f5",
                                        color: "#fc8181",
                                        border: "none", borderRadius: "8px", cursor: "pointer",
                                        fontSize: isMobile ? "0.75rem" : "0.82rem",
                                        fontWeight: "600",
                                    }} onClick={() => handleDelete(task._id)}>
                                        🗑 Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div style={{
                    display: "flex", justifyContent: "center",
                    alignItems: "center", marginTop: "2rem", gap: "0.75rem",
                }}>
                    <button style={{
                        padding: "0.5rem 1.1rem",
                        backgroundColor: c.pageBtn,
                        border: `1px solid ${c.pageBtnBorder}`,
                        borderRadius: "10px", cursor: "pointer",
                        color: c.pageBtnColor,
                        fontSize: isMobile ? "0.82rem" : "0.9rem",
                        fontWeight: "600",
                    }}
                        disabled={filters.page === 1}
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    >← Prev</button>

                    <span style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        color: "#6366f1", fontWeight: "700",
                        fontSize: "0.9rem",
                    }}>
                        Page {filters.page}
                    </span>

                    <button style={{
                        padding: "0.5rem 1.1rem",
                        backgroundColor: c.pageBtn,
                        border: `1px solid ${c.pageBtnBorder}`,
                        borderRadius: "10px", cursor: "pointer",
                        color: c.pageBtnColor,
                        fontSize: isMobile ? "0.82rem" : "0.9rem",
                        fontWeight: "600",
                    }}
                        disabled={tasks.length < 5}
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    >Next →</button>
                </div>
            </div>

            {/* Modal */}
            {showForm && (
                <div style={{
                    position: "fixed", inset: 0,
                    backgroundColor: c.overlayBg,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 999,
                    padding: "1rem",
                }}>
                    <div style={{
                        backgroundColor: c.modalBg,
                        borderRadius: "16px",
                        padding: isMobile ? "1.25rem" : "2rem",
                        width: "100%", maxWidth: "480px",
                        maxHeight: "90vh", overflowY: "auto",
                        border: `1px solid ${c.cardBorder}`,
                        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
                    }}>
                        <h3 style={{
                            marginTop: 0, marginBottom: "1.25rem",
                            color: c.title,
                            fontSize: isMobile ? "1.1rem" : "1.25rem",
                            fontWeight: "800",
                        }}>
                            {editTask ? "✏️ Edit Task" : "✨ New Task"}
                        </h3>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                            <input style={inputStyle} placeholder="Task title" required
                                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

                            <select style={inputStyle} value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {["work", "personal", "health", "finance", "study"].map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select style={inputStyle} value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                                {["Low", "Medium", "High"].map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <label style={{ fontSize: "0.82rem", color: c.labelColor, fontWeight: "600" }}>
                                📅 Deadline
                            </label>
                            <input style={inputStyle} type="date" required
                                value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />

                            <label style={{ fontSize: "0.82rem", color: c.labelColor, fontWeight: "600" }}>
                                ⏱ Estimated Time (hours)
                            </label>
                            <input style={inputStyle} type="number" min="0"
                                value={form.estimatedTime}
                                onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })} />

                            <label style={{ fontSize: "0.82rem", color: c.labelColor, fontWeight: "600" }}>
                                🔔 Reminder Time (optional)
                            </label>
                            <input style={inputStyle} type="datetime-local"
                                value={form.reminderTime}
                                onChange={(e) => setForm({ ...form, reminderTime: e.target.value })} />

                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                                <button style={{
                                    flex: 1, padding: "0.8rem",
                                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                                    color: "#fff", border: "none", borderRadius: "10px",
                                    cursor: "pointer", fontWeight: "700", fontSize: "0.95rem",
                                    boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
                                }} type="submit">
                                    {editTask ? "Update Task" : "Create Task"}
                                </button>
                                <button style={{
                                    flex: 1, padding: "0.8rem",
                                    backgroundColor: isDark ? "#2e1a1a" : "#fff5f5",
                                    color: "#fc8181", border: "none", borderRadius: "10px",
                                    cursor: "pointer", fontWeight: "700", fontSize: "0.95rem",
                                }} type="button" onClick={() => { setShowForm(false); setEditTask(null); }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}