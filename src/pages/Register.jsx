import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/api/auth/register", form);
      showToast("Account created! Please login 🎉", "success");
      navigate("/login");
    } catch (err) {
      showToast(err.response?.data?.msg || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const c = colors(isDark);
  console.log("isDark:", isDark);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.pageBg,
      padding: "1rem",
      transition: "background 0.3s",
    }}>
      {/* Theme Toggle - top right corner */}
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          background: isDark ? "#1e1e2e" : "#fff",
          border: isDark ? "1px solid #2d2d3d" : "1px solid #e2e8f0",
          borderRadius: "20px",
          padding: "0.4rem 0.9rem",
          cursor: "pointer",
          fontSize: "0.85rem",
          color: isDark ? "#e2e8f0" : "#1a202c",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 100,
          fontWeight: "600",
        }}
      >
        {isDark ? "☀️ Light" : "🌙 Dark"}
      </button>
      {/* Glow */}
      <div style={{
        position: "fixed",
        bottom: "-100px", right: "-100px",
        width: "400px", height: "400px",
        borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        backgroundColor: c.cardBg,
        padding: "clamp(1.5rem, 5vw, 2.5rem)",
        borderRadius: "16px",
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "420px",
        border: isDark ? "1px solid #1e1e2e" : "none",
        transition: "all 0.3s",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚡</div>
          <h1 style={{
            margin: 0, fontSize: "1.6rem",
            fontWeight: "800", color: c.title, letterSpacing: "-0.5px",
          }}>LifeSync</h1>
        </div>

        <h2 style={{
          margin: "0 0 0.25rem", fontSize: "1.3rem",
          fontWeight: "700", color: c.title,
        }}>Create Account</h2>
        <p style={{ color: c.subtitle, marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Start organizing your life today
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            style={inputStyle(isDark)}
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            style={inputStyle(isDark)}
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            style={inputStyle(isDark)}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button style={btnStyle} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p style={{
          textAlign: "center", marginTop: "1.25rem",
          color: c.subtitle, fontSize: "0.9rem",
        }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#6366f1", fontWeight: "700", textDecoration: "none" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle = (isDark) => ({
  padding: "0.8rem 1rem",
  borderRadius: "10px",
  border: isDark ? "1px solid #2d2d3d" : "1px solid #e2e8f0",
  fontSize: "0.95rem",
  outline: "none",
  width: "100%",
  backgroundColor: isDark ? "#1a1a2e" : "#f8fafc",
  color: isDark ? "#e2e8f0" : "#1a202c",
  transition: "all 0.2s",
  boxSizing: "border-box",
});

const btnStyle = {
  padding: "0.85rem",
  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "1rem",
  cursor: "pointer",
  fontWeight: "700",
  width: "100%",
  boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
};

const colors = (isDark) => ({
  pageBg: isDark ? "#0a0a14" : "#f0f4f8",
  cardBg: isDark ? "#13131f" : "#ffffff",
  title: isDark ? "#f0f0ff" : "#1a202c",
  subtitle: isDark ? "#6b7280" : "#718096",
});