import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div style={{
                position: "fixed",
                top: "1rem",
                right: "1rem",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
            }}>
                {toasts.map((toast) => (
                    <div key={toast.id} style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        padding: "0.85rem 1.1rem",
                        borderRadius: "10px",
                        minWidth: "260px",
                        maxWidth: "340px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                        animation: "slideIn 0.3s ease",
                        backgroundColor:
                            toast.type === "success" ? "#22543d" :
                            toast.type === "error" ? "#742a2a" :
                            toast.type === "warning" ? "#744210" : "#1a365d",
                        color: "#fff",
                        borderLeft: `4px solid ${
                            toast.type === "success" ? "#48bb78" :
                            toast.type === "error" ? "#fc8181" :
                            toast.type === "warning" ? "#f6ad55" : "#63b3ed"
                        }`,
                    }}>
                        <span>
                            {toast.type === "success" ? "✅" :
                             toast.type === "error" ? "❌" :
                             toast.type === "warning" ? "⚠️" : "ℹ️"}{" "}
                            {toast.message}
                        </span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{
                                background: "none", border: "none",
                                color: "#fff", cursor: "pointer",
                                fontSize: "1rem", opacity: 0.7,
                                padding: 0, lineHeight: 1,
                            }}
                        >✕</button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);