import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line,
} from "recharts";

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
    pageBg:     isDark ? "#0a0a14" : "#f0f4f8",
    cardBg:     isDark ? "#13131f" : "#ffffff",
    cardBorder: isDark ? "#1e1e2e" : "transparent",
    title:      isDark ? "#f0f0ff" : "#1a202c",
    subtitle:   isDark ? "#6b7280" : "#718096",
    gridColor:  isDark ? "#1e1e2e" : "#e2e8f0",
    axisColor:  isDark ? "#6b7280" : "#718096",
});

const PRIORITY_COLORS = {
    Low: "#38a169",
    Medium: "#d69e2e",
    High: "#e53e3e",
};

const CATEGORY_COLORS = [
    "#6366f1", "#38a169", "#d69e2e",
    "#e53e3e", "#805ad5",
];

const STATUS_COLORS = {
    Completed: "#38a169",
    Pending:   "#d69e2e",
    missed:    "#e53e3e",
};

export default function Analytics() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const width = useWindowWidth();
    const isMobile = width <= 600;
    const c = colors(isDark);

    const [stats, setStats]         = useState({ total: 0, completed: 0, pending: 0, missed: 0 });
    const [allTasks, setAllTasks]   = useState([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, tasksRes] = await Promise.all([
                API.get("/api/task/stats"),
                API.get("/api/task/", { params: { limit: 100, page: 1 } }),
            ]);
            setStats(statsRes.data);
            const data = tasksRes.data;
            setAllTasks(data.tasks || data.data || data || []);
        } catch (err) {
            showToast("Failed to load analytics", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Data Builders ---

    // Status pie chart
    const statusData = [
        { name: "Completed", value: stats.completed },
        { name: "Pending",   value: stats.pending },
        { name: "missed",    value: stats.missed },
    ].filter((d) => d.value > 0);

    // Priority breakdown
    const priorityData = ["Low", "Medium", "High"].map((p) => ({
        name: p,
        count: allTasks.filter((t) => t.priority === p).length,
    }));

    // Category breakdown
    const categoryMap = {};
    allTasks.forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Completion rate over time (by deadline month)
    const monthMap = {};
    allTasks.forEach((t) => {
        if (!t.deadline) return;
        const month = new Date(t.deadline).toLocaleString("default", { month: "short" });
        if (!monthMap[month]) monthMap[month] = { month, completed: 0, total: 0 };
        monthMap[month].total++;
        if (t.status === "Completed") monthMap[month].completed++;
    });
    const trendData = Object.values(monthMap).map((m) => ({
        month: m.month,
        rate: m.total ? Math.round((m.completed / m.total) * 100) : 0,
        completed: m.completed,
        total: m.total,
    }));

    const cardStyle = {
        backgroundColor: c.cardBg,
        borderRadius: "16px",
        padding: isMobile ? "1rem" : "1.5rem",
        border: `1px solid ${c.cardBorder}`,
        boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.07)",
    };

    const completionRate = stats.total
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;

    if (loading) return (
        <div style={{ minHeight: "100vh", backgroundColor: c.pageBg }}>
            <Navbar />
            <div style={{ textAlign: "center", padding: "5rem", color: c.subtitle }}>
                <div style={{ fontSize: "2.5rem" }}>📊</div>
                <p>Loading analytics...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", backgroundColor: c.pageBg, transition: "background 0.3s" }}>
            <Navbar />

            <div style={{
                maxWidth: "900px",
                margin: "0 auto",
                padding: isMobile ? "1rem 0.75rem" : "2rem 1rem",
            }}>

                {/* Header */}
                <h2 style={{
                    color: c.title, fontWeight: "800",
                    fontSize: isMobile ? "1.2rem" : "1.5rem",
                    marginBottom: "0.25rem",
                }}>
                    📊 Analytics
                </h2>
                <p style={{ color: c.subtitle, marginBottom: "1.75rem", fontSize: "0.9rem" }}>
                    Overview of your task performance
                </p>

                {/* Summary Cards */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
                    gap: isMobile ? "0.65rem" : "1rem",
                    marginBottom: "1.5rem",
                }}>
                    {[
                        { label: "Total Tasks",  value: stats.total,     color: "#6366f1", icon: "📋" },
                        { label: "Completed",    value: stats.completed,  color: "#38a169", icon: "✅" },
                        { label: "Pending",      value: stats.pending,    color: "#d69e2e", icon: "⏳" },
                        { label: "Missed",       value: stats.missed,     color: "#e53e3e", icon: "❌" },
                    ].map((s) => (
                        <div key={s.label} style={{
                            ...cardStyle,
                            textAlign: "center",
                            borderTop: `4px solid ${s.color}`,
                        }}>
                            <div style={{ fontSize: "1.3rem" }}>{s.icon}</div>
                            <p style={{ fontSize: "1.8rem", fontWeight: "800", margin: "0.25rem 0 0", color: s.color }}>
                                {s.value}
                            </p>
                            <p style={{ color: c.subtitle, margin: "0.2rem 0 0", fontSize: "0.78rem", fontWeight: "600" }}>
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Completion Rate Banner */}
                <div style={{
                    ...cardStyle,
                    marginBottom: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                }}>
                    <div>
                        <p style={{ color: c.subtitle, margin: 0, fontSize: "0.85rem", fontWeight: "600" }}>
                            Overall Completion Rate
                        </p>
                        <p style={{
                            color: completionRate >= 70 ? "#38a169" : completionRate >= 40 ? "#d69e2e" : "#e53e3e",
                            fontSize: "2.5rem", fontWeight: "800", margin: "0.25rem 0 0",
                        }}>
                            {completionRate}%
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div style={{ flex: 1, minWidth: "150px" }}>
                        <div style={{
                            height: "12px",
                            backgroundColor: isDark ? "#1e1e2e" : "#e2e8f0",
                            borderRadius: "20px",
                            overflow: "hidden",
                        }}>
                            <div style={{
                                height: "100%",
                                width: `${completionRate}%`,
                                background: completionRate >= 70
                                    ? "linear-gradient(90deg, #38a169, #48bb78)"
                                    : completionRate >= 40
                                    ? "linear-gradient(90deg, #d69e2e, #f6ad55)"
                                    : "linear-gradient(90deg, #e53e3e, #fc8181)",
                                borderRadius: "20px",
                                transition: "width 0.8s ease",
                            }} />
                        </div>
                        <p style={{ color: c.subtitle, fontSize: "0.78rem", margin: "0.4rem 0 0" }}>
                            {stats.completed} of {stats.total} tasks completed
                        </p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                }}>
                    {/* Status Pie Chart */}
                    <div style={cardStyle}>
                        <h3 style={{
                            color: c.title, margin: "0 0 1rem",
                            fontSize: "0.95rem", fontWeight: "700",
                        }}>
                            📈 Task Status
                        </h3>
                        {statusData.length === 0 ? (
                            <p style={{ color: c.subtitle, textAlign: "center", padding: "2rem 0" }}>
                                No data yet
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%" cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={STATUS_COLORS[entry.name]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: c.cardBg,
                                            border: `1px solid ${c.cardBorder}`,
                                            borderRadius: "8px",
                                            color: c.title,
                                        }}
                                    />
                                    <Legend
                                        formatter={(value) => (
                                            <span style={{ color: c.subtitle, fontSize: "0.82rem" }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Priority Bar Chart */}
                    <div style={cardStyle}>
                        <h3 style={{
                            color: c.title, margin: "0 0 1rem",
                            fontSize: "0.95rem", fontWeight: "700",
                        }}>
                            🔥 Priority Breakdown
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={priorityData} barSize={36}>
                                <CartesianGrid strokeDasharray="3 3" stroke={c.gridColor} />
                                <XAxis dataKey="name" tick={{ fill: c.axisColor, fontSize: 12 }} />
                                <YAxis tick={{ fill: c.axisColor, fontSize: 12 }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: c.cardBg,
                                        border: `1px solid ${c.cardBorder}`,
                                        borderRadius: "8px",
                                        color: c.title,
                                    }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {priorityData.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={PRIORITY_COLORS[entry.name]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Pie + Trend Line */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "1rem",
                }}>
                    {/* Category Pie */}
                    <div style={cardStyle}>
                        <h3 style={{
                            color: c.title, margin: "0 0 1rem",
                            fontSize: "0.95rem", fontWeight: "700",
                        }}>
                            📁 Category Breakdown
                        </h3>
                        {categoryData.length === 0 ? (
                            <p style={{ color: c.subtitle, textAlign: "center", padding: "2rem 0" }}>
                                No data yet
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%" cy="50%"
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell
                                                key={index}
                                                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: c.cardBg,
                                            border: `1px solid ${c.cardBorder}`,
                                            borderRadius: "8px",
                                            color: c.title,
                                        }}
                                    />
                                    <Legend
                                        formatter={(value) => (
                                            <span style={{ color: c.subtitle, fontSize: "0.82rem" }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Completion Trend Line */}
                    <div style={cardStyle}>
                        <h3 style={{
                            color: c.title, margin: "0 0 1rem",
                            fontSize: "0.95rem", fontWeight: "700",
                        }}>
                            📅 Completion Trend
                        </h3>
                        {trendData.length === 0 ? (
                            <p style={{ color: c.subtitle, textAlign: "center", padding: "2rem 0" }}>
                                No data yet
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={c.gridColor} />
                                    <XAxis dataKey="month" tick={{ fill: c.axisColor, fontSize: 12 }} />
                                    <YAxis
                                        tick={{ fill: c.axisColor, fontSize: 12 }}
                                        unit="%" domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: c.cardBg,
                                            border: `1px solid ${c.cardBorder}`,
                                            borderRadius: "8px",
                                            color: c.title,
                                        }}
                                        formatter={(value) => [`${value}%`, "Completion Rate"]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rate"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{ fill: "#6366f1", strokeWidth: 2, r: 5 }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}