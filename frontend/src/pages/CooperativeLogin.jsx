import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    ArrowRight,
    ShieldCheck,
    Home,
    Lock,
    Phone,
    Mail,
    AlertCircle,
    Eye,
    EyeOff,
    Users,
    TrendingUp,
    Calendar,
    Globe,
    LogIn,
    CheckCircle2
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import coopHeroImg from "../assets/coop-hero.jpg";
import api from "../services/api";
import { translations } from "../utils/translations";
import "./CooperativeLogin.css";

function CooperativeLogin() {
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

    const t = translations[lang] || translations.en;

    const setLanguage = (selectedLang) => {
        setLang(selectedLang);
        localStorage.setItem("lang", selectedLang);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        const cleanIdentifier = identifier.trim();
        if (!cleanIdentifier || !password) {
            setError("Please enter your registered cooperative phone/email and password.");
            return;
        }

        try {
            setLoading(true);

            const isEmail = cleanIdentifier.includes("@");
            const payload = {
                password,
                ...(isEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier })
            };

            const response = await api.post("/auth/login", payload);
            const { token, user } = response.data;

            if (user.role && user.role !== "CooperativeAdmin" && user.role !== "Admin") {
                setError("This account is not a registered Cooperative Society Administrator.");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            navigate("/cooperative-dashboard");
        } catch (err) {
            console.error("Cooperative Login Error:", err);
            setError(
                err.response?.data?.message ||
                "Invalid phone/email or password. Please verify your society credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="coop-login-page-ref">
            {/* Top Navigation Bar */}
            <header className="coop-ref-top-header">
                <div className="coop-ref-brand" onClick={() => navigate("/")}>
                    <img src={logo} alt="SkillDnest Logo" className="coop-ref-brand-logo" />
                    <div className="coop-ref-brand-text">
                        <span className="coop-ref-brand-name">SkillDnest</span>
                        <span className="coop-ref-brand-sub">Cooperative Gig Services Platform</span>
                    </div>
                </div>

                <div className="coop-ref-tagline-center">
                    <span className="coop-ref-script-center">*Stronger Cooperatives, Brighter Futures*</span>
                </div>

                <div className="coop-ref-top-actions">
                    <div className="coop-ref-lang-toggle">
                        <button
                            type="button"
                            className={`coop-lang-btn ${lang === "en" ? "active" : ""}`}
                            onClick={() => setLanguage("en")}
                        >
                            <Globe size={13} /> English
                        </button>
                        <span className="lang-divider">|</span>
                        <button
                            type="button"
                            className={`coop-lang-btn ${lang === "hi" ? "active" : ""}`}
                            onClick={() => setLanguage("hi")}
                        >
                            हिन्दी
                        </button>
                    </div>

                    <button
                        className="coop-ref-home-btn"
                        onClick={() => navigate("/")}
                        type="button"
                    >
                        <Home size={15} />
                        <span>Home</span>
                    </button>
                </div>
            </header>

            {/* Main Split Layout */}
            <main className="coop-ref-main-layout">
                {/* LEFT HERO / PROMOTIONAL SECTION */}
                <section className="coop-ref-left-section">
                    <div className="coop-ref-portal-badge">
                        <Building2 size={16} />
                        <span>Cooperative Portal</span>
                    </div>

                    <h1 className="coop-ref-hero-heading">
                        Manage Your Workforce.
                        <br />
                        <span className="coop-ref-heading-teal">Create Fair Opportunities.</span>
                    </h1>

                    <p className="coop-ref-hero-subtext">
                        Empower local skilled workers, streamline operations, and build a stronger community with SkillDnest.
                    </p>

                    {/* 4 Feature Badges */}
                    <div className="coop-ref-features-row">
                        <div className="coop-feat-badge feat-workforce">
                            <div className="coop-feat-icon-wrap icon-workforce">
                                <Users size={16} />
                            </div>
                            <span>Workforce Management</span>
                        </div>

                        <div className="coop-feat-badge feat-booking">
                            <div className="coop-feat-icon-wrap icon-booking">
                                <Calendar size={16} />
                            </div>
                            <span>Booking Management</span>
                        </div>

                        <div className="coop-feat-badge feat-forecast">
                            <div className="coop-feat-icon-wrap icon-forecast">
                                <TrendingUp size={16} />
                            </div>
                            <span>AI Demand Forecast</span>
                        </div>

                        <div className="coop-feat-badge feat-verified">
                            <div className="coop-feat-icon-wrap icon-verified">
                                <ShieldCheck size={16} />
                            </div>
                            <span>Verified Workers</span>
                        </div>
                    </div>

                    {/* Cooperative Visual Showcase Card */}
                    <div className="coop-ref-visual-card">
                        <img
                            src={coopHeroImg}
                            alt="Cooperative Society Service Center and Workforce"
                            className="coop-ref-visual-img"
                        />

                        {/* Curved Wave Bottom Accent */}
                        <div className="coop-ref-wave-overlay">
                            <span className="coop-ref-wave-tagline">
                                <em>Together for Better Livelihoods</em>
                            </span>
                        </div>
                    </div>
                </section>

                {/* RIGHT LOGIN CARD SECTION */}
                <section className="coop-ref-right-section">
                    <div className="coop-ref-login-card">
                        {/* Card Header Brand */}
                        <div className="coop-card-brand-header">
                            <img src={logo} alt="SkillDnest Logo" className="coop-card-logo" />
                            <div className="coop-card-brand-text">
                                <span className="coop-card-brand-name">SkillDnest</span>
                                <span className="coop-card-brand-sub">Cooperative Portal</span>
                            </div>
                        </div>

                        <div className="coop-card-title-area">
                            <h2 className="coop-card-title">Welcome Back</h2>
                            <p className="coop-card-subtitle">
                                Sign in to your cooperative account and manage your workforce efficiently.
                            </p>
                        </div>

                        {error && (
                            <div className="coop-error-banner">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="coop-ref-login-form">
                            <div className="coop-input-group">
                                <label className="coop-input-label">Email / Phone Number</label>
                                <div className="coop-input-box">
                                    <Mail size={18} className="coop-input-icon" />
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="e.g. cooperative@example.com or phone"
                                        required
                                        className="coop-text-input"
                                    />
                                </div>
                            </div>

                            <div className="coop-input-group">
                                <label className="coop-input-label">Password</label>
                                <div className="coop-input-box">
                                    <Lock size={18} className="coop-input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        className="coop-text-input"
                                    />
                                    <button
                                        type="button"
                                        className="coop-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Options Row: Remember Me & Forgot Password */}
                            <div className="coop-form-options">
                                <label className="coop-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="coop-checkbox-input"
                                    />
                                    <span>Remember me</span>
                                </label>

                                <button
                                    type="button"
                                    className="coop-forgot-btn"
                                    onClick={() => alert("Please contact state cooperative federation support to reset administrator access.")}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {/* Main Submit Button */}
                            <button
                                type="submit"
                                className="coop-login-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span>Verifying society credentials...</span>
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        <span>Login</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Registration Link */}
                        <div className="coop-register-prompt">
                            <span>Don't have an account? </span>
                            <button
                                type="button"
                                className="coop-register-link"
                                onClick={() => navigate("/cooperative-register")}
                            >
                                Register Cooperative
                            </button>
                        </div>

                        {/* Security Trust Badge */}
                        <div className="coop-trust-footer">
                            <ShieldCheck size={16} className="coop-trust-icon" />
                            <div>
                                <strong>Secure & Trusted Platform</strong>
                                <small>Your data is safe with us</small>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default CooperativeLogin;