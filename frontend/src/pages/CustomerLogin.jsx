import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ShieldCheck,
    Lock,
    Phone,
    Home,
    AlertCircle,
    Globe,
    Eye,
    EyeOff,
    Star,
    Users,
    Leaf,
    Wrench,
    Zap,
    Hammer,
    Paintbrush,
    Sparkles,
    LayoutGrid,
    MapPin,
    LogIn
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import heroImg from "../assets/customer-hero.jpg";
import api from "../services/api";
import { translations } from "../utils/translations";
import "./CustomerLogin.css";

function CustomerLogin() {
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
            setError("Please enter your registered phone/email and password.");
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

            if (user.role && user.role !== "Customer" && user.role !== "CooperativeAdmin") {
                setError("Please use the dedicated portal for your account role.");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            navigate("/customer-dashboard");
        } catch (err) {
            console.error("Login Error:", err);
            setError(
                err.response?.data?.message ||
                "Invalid phone/email or password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="customer-login-page-ref">
            {/* Top Navigation Bar */}
            <header className="ref-top-header">
                <div className="ref-brand-main" onClick={() => navigate("/")}>
                    <img src={logo} alt="SkillDnest Logo" className="ref-brand-logo" />
                    <div className="ref-brand-text">
                        <span className="ref-brand-name">SkillDnest</span>
                        <span className="ref-brand-sub">Cooperative Gig Services Platform</span>
                    </div>
                </div>

                <div className="ref-top-actions">
                    <button
                        className="ref-home-btn"
                        onClick={() => navigate("/")}
                        type="button"
                    >
                        <Home size={15} />
                        <span>Home</span>
                    </button>
                </div>
            </header>

            {/* Main Split Layout */}
            <main className="ref-main-layout">
                {/* LEFT HERO & PROMOTIONAL SECTION */}
                <section className="ref-left-section">
                    <div className="ref-tagline-wrap">
                        <div className="ref-script-tagline">
                            *Local Skills, Stronger Communities*
                            <svg className="ref-tagline-curve" viewBox="0 0 160 12" fill="none">
                                <path d="M2 9C40 2 120 2 158 9" stroke="#008779" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="ref-hero-heading">
                        Trusted Local Services,
                        <br />
                        <span className="ref-heading-teal">One Click Away.</span>
                    </h1>

                    <p className="ref-hero-subtext">
                        Connect with verified local professionals through your cooperative community.
                    </p>

                    {/* Value Proposition Badges */}
                    <div className="ref-badges-row">
                        <div className="ref-badge-item">
                            <ShieldCheck size={18} className="ref-badge-icon ref-badge-shield" />
                            <span>Verified Professionals</span>
                        </div>
                        <div className="ref-badge-item">
                            <Star size={18} className="ref-badge-icon ref-badge-star" />
                            <span>Fair Pricing</span>
                        </div>
                        <div className="ref-badge-item">
                            <Users size={18} className="ref-badge-icon ref-badge-users" />
                            <span>Local Cooperatives</span>
                        </div>
                        <div className="ref-badge-item">
                            <Leaf size={18} className="ref-badge-icon ref-badge-leaf" />
                            <span>Stronger Communities</span>
                        </div>
                    </div>

                    {/* Service Category Cards */}
                    <div className="ref-services-grid">
                        <div className="ref-service-card card-plumber">
                            <div className="ref-service-icon-box icon-plumber">
                                <Wrench size={20} />
                            </div>
                            <span>Plumber</span>
                        </div>

                        <div className="ref-service-card card-electrician">
                            <div className="ref-service-icon-box icon-electrician">
                                <Zap size={20} />
                            </div>
                            <span>Electrician</span>
                        </div>

                        <div className="ref-service-card card-carpenter">
                            <div className="ref-service-icon-box icon-carpenter">
                                <Hammer size={20} />
                            </div>
                            <span>Carpenter</span>
                        </div>

                        <div className="ref-service-card card-painter">
                            <div className="ref-service-icon-box icon-painter">
                                <Paintbrush size={20} />
                            </div>
                            <span>Painter</span>
                        </div>

                        <div className="ref-service-card card-cleaner">
                            <div className="ref-service-icon-box icon-cleaner">
                                <Sparkles size={20} />
                            </div>
                            <span>Cleaner</span>
                        </div>

                        <div className="ref-service-card card-more">
                            <div className="ref-service-icon-box icon-more">
                                <LayoutGrid size={20} />
                            </div>
                            <span>& More</span>
                        </div>
                    </div>

                    {/* Customer Visual / Living Room Showcase */}
                    <div className="ref-hero-visual-card">
                        <img
                            src={heroImg}
                            alt="Customer booking trusted local services at home"
                            className="ref-hero-visual-img"
                        />
                        <div className="ref-hero-visual-overlay" />

                        {/* Floating Location Badge */}
                        <div className="ref-floating-pin-badge">
                            <div className="ref-pin-icon-wrap">
                                <MapPin size={18} />
                            </div>
                            <span className="ref-pin-text">Find trusted services near you</span>
                            <ArrowRight size={16} className="ref-pin-arrow" />
                        </div>
                    </div>
                </section>

                {/* RIGHT LOGIN CARD SECTION */}
                <section className="ref-right-section">
                    <div className="ref-login-card">
                        {/* Card Brand Header */}
                        <div className="ref-card-brand-header">
                            <img src={logo} alt="SkillDnest Logo" className="ref-card-logo" />
                            <div className="ref-card-brand-text">
                                <span className="ref-card-brand-name">SkillDnest</span>
                                <span className="ref-card-brand-sub">Cooperative Gig Services Platform</span>
                            </div>
                        </div>

                        <div className="ref-card-title-area">
                            <h2 className="ref-card-title">Welcome Back</h2>
                            <p className="ref-card-subtitle">
                                Sign in to your account and continue your journey with trusted local services.
                            </p>
                        </div>

                        {error && (
                            <div className="ref-error-banner">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="ref-login-form">
                            <div className="ref-input-group">
                                <label className="ref-input-label">Phone Number</label>
                                <div className="ref-input-box">
                                    <Phone size={18} className="ref-input-icon" />
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        required
                                        className="ref-text-input"
                                    />
                                </div>
                            </div>

                            <div className="ref-input-group">
                                <label className="ref-input-label">Password</label>
                                <div className="ref-input-box">
                                    <Lock size={18} className="ref-input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        className="ref-text-input"
                                    />
                                    <button
                                        type="button"
                                        className="ref-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Extra Row: Remember me & Forgot Password */}
                            <div className="ref-form-options">
                                <label className="ref-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="ref-checkbox-input"
                                    />
                                    <span>Remember me</span>
                                </label>

                                <button
                                    type="button"
                                    className="ref-forgot-btn"
                                    onClick={() => alert("For password reset, please contact your registered cooperative administrator.")}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {/* Main Submit Button */}
                            <button
                                type="submit"
                                className="ref-login-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span>Signing in...</span>
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        <span>Login</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Registration Link */}
                        <div className="ref-register-prompt">
                            <span>Don't have an account? </span>
                            <button
                                type="button"
                                className="ref-register-link"
                                onClick={() => navigate("/customer-register")}
                            >
                                Create Account
                            </button>
                        </div>

                        {/* Language Selector Pill */}
                        <div className="ref-lang-pill-container">
                            <button
                                type="button"
                                className={`ref-lang-pill-opt ${lang === "en" ? "active" : ""}`}
                                onClick={() => setLanguage("en")}
                            >
                                <Globe size={14} />
                                <span>English</span>
                            </button>
                            <button
                                type="button"
                                className={`ref-lang-pill-opt ${lang === "hi" ? "active" : ""}`}
                                onClick={() => setLanguage("hi")}
                            >
                                <span>हिन्दी</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default CustomerLogin;