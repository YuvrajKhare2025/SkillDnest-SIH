import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ShieldCheck,
    UserRound,
    Home,
    CheckCircle2,
    AlertCircle,
    Globe,
    MapPin
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import api from "../services/api";
import { translations } from "../utils/translations";
import "./CustomerRegister.css";

function CustomerRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        location: "",
        password: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

    const t = translations[lang] || translations.en;

    const toggleLang = () => {
        const nextLang = lang === "en" ? "hi" : "en";
        setLang(nextLang);
        localStorage.setItem("lang", nextLang);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const cleanName = formData.name.trim();
        const rawPhone = formData.phone.trim();
        const cleanPhone = rawPhone.replace(/[^\d+]/g, "");
        const rawEmail = formData.email.trim();
        const cleanLocation = formData.location.trim() || "Local Community";

        if (!cleanName || !cleanPhone || !formData.password) {
            setError("Name, phone, and password are required.");
            return;
        }

        if (cleanPhone.replace(/\D/g, "").length < 10) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // Email validation: if provided, validate; if not provided, supply a unique fallback for backend compatibility
        let finalEmail = rawEmail;
        if (rawEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(rawEmail)) {
                setError("Please enter a valid email address (e.g. user@gmail.com).");
                return;
            }
        } else {
            const digitsOnly = cleanPhone.replace(/\D/g, "");
            finalEmail = `customer_${digitsOnly}@skilldnest.com`;
        }

        try {
            setLoading(true);

            const registrationPayload = {
                name: cleanName,
                phone: cleanPhone,
                email: finalEmail.toLowerCase(),
                password: formData.password,
                role: "Customer",
                location: cleanLocation
            };

            const response = await api.post("/auth/register", registrationPayload);

            let token = response.data.token;
            let user = response.data.user;

            // If backend registration doesn't return JWT directly, auto-login immediately
            if (!token) {
                try {
                    const loginRes = await api.post("/auth/login", {
                        phone: cleanPhone,
                        password: formData.password
                    });
                    token = loginRes.data?.token;
                    user = loginRes.data?.user || user;
                } catch (loginErr) {
                    console.log("Direct login fallback note:", loginErr);
                }
            }

            if (token && user) {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                setSuccess("Account created successfully! Redirecting to dashboard...");
                setTimeout(() => {
                    navigate("/customer-dashboard");
                }, 1200);
            } else {
                setSuccess("Account created successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate("/customer-login");
                }, 1200);
            }

        } catch (err) {
            console.error("Registration Error:", err);
            const serverMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                (err.code === "ECONNABORTED" ? "Connection timed out. Please try again." : null) ||
                (err.message === "Network Error" ? "Network error: Unable to reach the server. Please check your internet connection." : null);

            setError(
                serverMessage ||
                (typeof err.response?.data === "string" ? err.response.data : null) ||
                "Registration failed. Please check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="customer-register-page">

            {/* LEFT VISUAL */}
            <div className="register-visual">

                <div className="register-bg-image"></div>
                <div className="register-overlay"></div>

                <div className="visual-top-actions" style={{ position: "absolute", top: 28, left: 30, right: 30, zIndex: 5, display: "flex", justifyContent: "space-between" }}>
                    <button
                        className="register-home-btn"
                        onClick={() => navigate("/")}
                        type="button"
                    >
                        <Home size={17} />
                        Home
                    </button>

                    <button
                        className="register-home-btn"
                        onClick={toggleLang}
                        type="button"
                    >
                        <Globe size={16} />
                        {lang === "en" ? "हिन्दी" : "English"}
                    </button>
                </div>

                <div className="register-visual-content">

                    <div className="register-badge">
                        <ShieldCheck size={17} />
                        Trusted Cooperative Network
                    </div>

                    <h1>
                        Your local
                        <br />
                        <span>service journey starts here.</span>
                    </h1>

                    <p>
                        Create your SkillDnest account and discover
                        trusted workers, cooperative societies and
                        transparent service prices.
                    </p>

                    <div className="register-benefits">

                        <div>
                            <CheckCircle2 size={19} />
                            Verified local workers & cooperatives
                        </div>

                        <div>
                            <CheckCircle2 size={19} />
                            AI-powered Smart Worker Matching
                        </div>

                        <div>
                            <CheckCircle2 size={19} />
                            Real-time booking tracking & fair pricing
                        </div>

                    </div>

                </div>
            </div>


            {/* RIGHT REGISTER */}
            <div className="register-area">

                <div className="register-card">

                    {/* BRAND */}
                    <div className="register-brand">

                        <img
                            src={logo}
                            alt="SkillDnest Logo"
                        />

                        <div>
                            <h2>{t.brandName}</h2>
                            <p>{t.tagline}</p>
                        </div>

                    </div>


                    {/* HEADING */}
                    <div className="register-heading">

                        <div className="register-icon">
                            <UserRound size={23} />
                        </div>

                        <div>
                            <span>GET STARTED</span>
                            <h2>{t.createAccount}</h2>
                        </div>

                    </div>

                    <p className="register-description">
                        Join SkillDnest and find trusted services near you.
                    </p>


                    {/* ERROR */}
                    {error && (
                        <div className="register-error" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", marginBottom: "18px", border: "1px solid #fecaca" }}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {success && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: "12px", marginBottom: "18px", border: "1px solid #a7f3d0" }}>
                            <CheckCircle2 size={18} />
                            <span>{success}</span>
                        </div>
                    )}


                    {/* FORM */}
                    <form onSubmit={handleRegister}>

                        {/* NAME + PHONE */}
                        <div className="form-row">

                            <div className="form-group">

                                <label>Full Name *</label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Ramesh Kumar"
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>Phone Number *</label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="e.g. 9876543210"
                                    required
                                />

                            </div>

                        </div>


                        {/* EMAIL + LOCATION */}
                        <div className="form-row">

                            <div className="form-group">

                                <label>Email / Gmail (Optional)</label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="user@gmail.com"
                                />

                            </div>

                            <div className="form-group">

                                <label>City / Location *</label>

                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Satna, MP"
                                    required
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}
                        <div className="form-row">

                            <div className="form-group">

                                <label>Password (Min. 6 chars) *</label>

                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create secure password"
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>Confirm Password *</label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter password"
                                    required
                                />

                            </div>

                        </div>


                        {/* BUTTON */}
                        <button
                            type="submit"
                            className="create-account-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : t.createAccount
                            }

                            {!loading && <ArrowRight size={19} />}
                        </button>

                    </form>


                    {/* LOGIN */}
                    <div className="already-account">

                        <span>
                            {t.alreadyHaveAccount}
                        </span>

                        <button
                            type="button"
                            onClick={() => navigate("/customer-login")}
                        >
                            {t.customerLogin}
                        </button>

                    </div>


                    {/* SECURITY */}
                    <div className="register-security">

                        <ShieldCheck size={17} />

                        Your information is securely encrypted & protected.

                    </div>

                </div>

            </div>

        </div>
    );
}

export default CustomerRegister;