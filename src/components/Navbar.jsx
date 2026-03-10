import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const useWindowWidth = () => {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handle = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, []);
    return width;
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const width = useWindowWidth();
    const isMobile = width <= 600;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const bg = isDark ? "#0f0f1a" : "#4f46e5";
    const borderBottom = isDark ? "1px solid #1e1e2e" : "none";

    return (
        <nav style={{
            backgroundColor: bg,
            padding: "1rem 1.5rem",
            boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
            position: "relative",
            borderBottom,
        }}>
            {/* Top Row */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}>
                {/* Brand */}
                <Link to="/dashboard" style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                }}>
                    <span style={{
                        color: "#fff",
                        fontSize: isMobile ? "1.2rem" : "1.4rem",
                        fontWeight: "800",
                        letterSpacing: "1px",
                    }}>
                        ⚡ LifeSync
                    </span>
                </Link>

                {/* Desktop Right */}
                {!isMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>

                        {/* Analytics Link */}
                        <Link to="/analytics" style={{
                            color: "#c7d2fe",
                            textDecoration: "none",
                            fontSize: "0.9rem",
                            fontWeight: "500",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            transition: "all 0.2s",
                        }}>
                            📊 Analytics
                        </Link>

                        {/* Dark mode toggle */}
                        <button onClick={toggleTheme} style={{
                            background: isDark ? "#1e1e2e" : "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "20px",
                            padding: "0.35rem 0.85rem",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                        }}>
                            {isDark ? "☀️ Light" : "🌙 Dark"}
                        </button>

                        <span style={{ color: "#e0e7ff", fontWeight: "600", fontSize: "0.9rem" }}>
                            👤 {user?.name}
                        </span>
                        <Link to="/profile" style={{
                            color: "#c7d2fe",
                            textDecoration: "none",
                            fontSize: "0.9rem",
                            fontWeight: "500",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.15)",
                        }}>
                            👤 Profile
                        </Link>

                        <button onClick={handleLogout} style={{
                            padding: "0.45rem 1rem",
                            backgroundColor: "#fff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                        }}>
                            Logout
                        </button>
                    </div>
                )}

                {/* Mobile right — theme toggle + hamburger */}
                {isMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <button onClick={toggleTheme} style={{
                            background: "rgba(255,255,255,0.15)",
                            border: "none",
                            borderRadius: "8px",
                            padding: "0.35rem 0.6rem",
                            cursor: "pointer",
                            fontSize: "1rem",
                            color: "#fff",
                        }}>
                            {isDark ? "☀️" : "🌙"}
                        </button>
                        <Link to="/profile"
                            onClick={() => setMenuOpen(false)}
                            style={{
                                color: isDark ? "#a78bfa" : "#4f46e5",
                                textDecoration: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}>
                            👤 Profile
                        </Link>

                        <button onClick={() => setMenuOpen(!menuOpen)} style={{
                            background: "none",
                            border: "none",
                            color: "#fff",
                            fontSize: "1.6rem",
                            cursor: "pointer",
                            lineHeight: 1,
                            padding: "0.25rem",
                        }}>
                            {menuOpen ? "✕" : "☰"}
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Dropdown */}
            {isMobile && menuOpen && (
                <div style={{
                    marginTop: "1rem",
                    backgroundColor: isDark ? "#1e1e2e" : "#fff",
                    borderRadius: "10px",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                }}>
                    <span style={{ color: isDark ? "#e0e7ff" : "#1a202c", fontWeight: "600" }}>
                        👤 {user?.name}
                    </span>
                    <span style={{ color: isDark ? "#718096" : "#718096", fontSize: "0.85rem" }}>
                        {user?.email}
                    </span>

                    <Link to="/analytics"
                        onClick={() => setMenuOpen(false)}
                        style={{
                            color: isDark ? "#a78bfa" : "#4f46e5",
                            textDecoration: "none",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                        }}>
                        📊 Analytics
                    </Link>

                    <button onClick={handleLogout} style={{
                        padding: "0.6rem",
                        backgroundColor: "#4f46e5",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        marginTop: "0.25rem",
                    }}>
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
}