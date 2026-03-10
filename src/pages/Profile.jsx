import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
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
    pageBg:      isDark ? "#0a0a14" : "#f0f4f8",
    cardBg:      isDark ? "#13131f" : "#ffffff",
    cardBorder:  isDark ? "#1e1e2e" : "transparent",
    title:       isDark ? "#f0f0ff" : "#1a202c",
    subtitle:    isDark ? "#6b7280" : "#718096",
    input:       isDark ? "#1a1a2e" : "#f8fafc",
    inputBorder: isDark ? "#2d2d3d" : "#e2e8f0",
    inputColor:  isDark ? "#e2e8f0" : "#1a202c",
    labelColor:  isDark ? "#9ca3af" : "#4a5568",
});

export default function Profile() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { user, login } = useAuth();
    const width = useWindowWidth();
    const isMobile = width <= 600;
    const c = colors(isDark);

    const [nameForm, setNameForm] = useState({ name: "" });
    const [passForm, setPassForm] = useState({
        currentPassword: "", newPassword: "", confirmPassword: ""
    });
    const [profileData, setProfileData] = useState(null);
    const [loadingName, setLoadingName] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await API.get("/api/auth/profile");
            setProfileData(res.data);
            setNameForm({ name: res.data.name });
        } catch (err) {
            showToast("Failed to load profile", "error");
        }
    };

    const handleNameUpdate = async (e) => {
        e.preventDefault();
        if (!nameForm.name.trim()) return showToast("Name cannot be empty", "warning");
        setLoadingName(true);
        try {
            const res = await API.patch("/api/auth/profile", { name: nameForm.name });
            // Update auth context with new name
            const token = localStorage.getItem("token");
            login(res.data.user, token);
            showToast("Name updated! ✅", "success");
            fetchProfile();
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to update name", "error");
        } finally {
            setLoadingName(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirmPassword) {
            return showToast("New passwords don't match!", "error");
        }
        if (passForm.newPassword.length < 6) {
            return showToast("Password must be at least 6 characters", "warning");
        }
        setLoadingPass(true);
        try {
            await API.patch("/api/auth/profile", {
                currentPassword: passForm.currentPassword,
                newPassword: passForm.newPassword,
            });
            showToast("Password updated! 🔒", "success");
            setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to update password", "error");
        } finally {
            setLoadingPass(false);
        }
    };

    const inputStyle = {
        padding: "0.8rem 1rem",
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

    const cardStyle = {
        backgroundColor: c.cardBg,
        borderRadius: "16px",
        padding: isMobile ? "1.25rem" : "1.75rem",
        border: `1px solid ${c.cardBorder}`,
        boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.07)",
        marginBottom: "1.25rem",
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: c.pageBg, transition: "background 0.3s" }}>
            <Navbar />

            <div style={{
                maxWidth: "600px",
                margin: "0 auto",
                padding: isMobile ? "1rem 0.75rem" : "2rem 1rem",
            }}>

                {/* Header */}
                <h2 style={{
                    color: c.title, fontWeight: "800",
                    fontSize: isMobile ? "1.2rem" : "1.5rem",
                    marginBottom: "0.25rem",
                }}>
                    👤 Profile
                </h2>
                <p style={{ color: c.subtitle, marginBottom: "1.75rem", fontSize: "0.9rem" }}>
                    Manage your account settings
                </p>

                {/* Account Info Card */}
                <div style={cardStyle}>
                    <div style={{
                        display: "flex", alignItems: "center",
                        gap: "1rem", marginBottom: "1.25rem",
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: "64px", height: "64px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                            display: "flex", alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.6rem", fontWeight: "800", color: "#fff",
                            flexShrink: 0,
                        }}>
                            {profileData?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                            <p style={{ margin: 0, color: c.title, fontWeight: "700", fontSize: "1.1rem" }}>
                                {profileData?.name}
                            </p>
                            <p style={{ margin: "0.2rem 0 0", color: c.subtitle, fontSize: "0.88rem" }}>
                                {profileData?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Update Name Card */}
                <div style={cardStyle}>
                    <h3 style={{
                        color: c.title, margin: "0 0 1.25rem",
                        fontSize: "1rem", fontWeight: "700",
                    }}>
                        ✏️ Update Name
                    </h3>
                    <form onSubmit={handleNameUpdate} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        <div>
                            <label style={{ fontSize: "0.82rem", color: c.labelColor, fontWeight: "600", display: "block", marginBottom: "0.4rem" }}>
                                Full Name
                            </label>
                            <input
                                style={inputStyle}
                                type="text"
                                placeholder="Your full name"
                                value={nameForm.name}
                                onChange={(e) => setNameForm({ name: e.target.value })}
                                required
                            />
                        </div>
                        <button style={{
                            padding: "0.8rem",
                            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                            color: "#fff", border: "none", borderRadius: "10px",
                            cursor: "pointer", fontWeight: "700", fontSize: "0.95rem",
                            boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
                        }} type="submit" disabled={loadingName}>
                            {loadingName ? "Updating..." : "Update Name"}
                        </button>
                    </form>
                </div>

                {/* Update Password Card */}
                <div style={cardStyle}>
                    <h3 style={{
                        color: c.title, margin: "0 0 1.25rem",
                        fontSize: "1rem", fontWeight: "700",
                    }}>
                        🔒 Change Password
                    </h3>
                    <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        <div>
                            <label style={{ fontSize: "0.82rem", color: c.labelColor, fontWeight: "600", display: "block", marginBottom: "0.4rem" }}>
                                Current Password
                            </label>
                            <input
                                style={inputStyle}
                                type="password"
                                placeholder="Enter current password"
                                value={passForm.currentPassword}
                                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.82rem", color: c.labelColor, fontWeight: "600", display: "block", marginBottom: "0.4rem" }}>
                                New Password
                            </label>
                            <input
                                style={inputStyle}
                                type="password"
                                placeholder="Enter new password"
                                value={passForm.newPassword}
                                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.82rem", color: c.labelColor, fontWeight: "600", display: "block", marginBottom: "0.4rem" }}>
                                Confirm New Password
                            </label>
                            <input
                                style={inputStyle}
                                type="password"
                                placeholder="Confirm new password"
                                value={passForm.confirmPassword}
                                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <button style={{
                            padding: "0.8rem",
                            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                            color: "#fff", border: "none", borderRadius: "10px",
                            cursor: "pointer", fontWeight: "700", fontSize: "0.95rem",
                            boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
                        }} type="submit" disabled={loadingPass}>
                            {loadingPass ? "Updating..." : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}