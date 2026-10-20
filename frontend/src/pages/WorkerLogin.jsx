import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ShieldCheck,
    Lock,
    Phone,
    Home,
    AlertCircle,
    Eye,
    EyeOff,
    Wrench,
    Zap,
    Briefcase,
    Sparkles,
    CheckCircle2,
    Award,
    TrendingUp,
    HeartHandshake,
    Users
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import workerHeroImg from "../assets/worker-hero.jpg";
import api from "../services/api";
import "./WorkerLogin.css";

function WorkerLogin() {
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        const cleanIdentifier = identifier.trim();
        if (!cleanIdentifier || !password) {
            setError("Please enter your registered phone number and password.");
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

            if (user.role && user.role !== "Worker" && user.role !== "CooperativeAdmin") {
                setError("This account is not registered as a skilled worker. Please use Customer Login.");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            navigate("/worker-dashboard");
        } catch (err) {
            console.error("Worker Login Error:", err);
            setError(
                err.response?.data?.message ||
                "Invalid worker credentials. Please check your phone and password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="worker-login-page">
            <header className="ref-top-header">
                <div className="ref-brand-main" onClick={() => navigate("/")}>
                    <img src={logo} alt="SkillDnest Logo" className="ref-brand-logo" />
                    <div className="ref-brand-text">
                        <span className="ref-brand-name">SkillDnest</span>
                        <span className="ref-brand-sub">Skilled Worker Portal</span>
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

            <main className="worker-login-split-layout">
                {/* LEFT HERO SHOWCASE */}
                <section className="worker-hero-section">
                    <div className="worker-tagline-wrap">
                        <span className="worker-tagline-pill">
                            <Sparkles size={14} /> Bharat Skilled Workforce Initiative
                        </span>
                    </div>

                    <h1 className="worker-hero-title">
                        Empowering Local Workers,
                        <br />
                        <span className="gradient-emerald-text">Backed by Cooperatives.</span>
                    </h1>

                    <p className="worker-hero-desc">
                        Access fair, direct job dispatches from verified local households.
                        Guaranteed fair compensation, digital verification, and real-time gig controls.
                    </p>

                    {/* Value Proposition Pills */}
                    <div className="worker-perks-grid">
                        <div className="worker-perk-card">
                            <ShieldCheck size={18} className="perk-icon emerald" />
                            <div>
                                <strong>Cooperative Verified</strong>
                                <span>Official society member protection</span>
                            </div>
                        </div>

                        <div className="worker-perk-card">
                            <TrendingUp size={18} className="perk-icon blue" />
                            <div>
                                <strong>Fair Opportunity Score</strong>
                                <span>Algorithmic unbiased gig distribution</span>
                            </div>
                        </div>

                        <div className="worker-perk-card">
                            <Award size={18} className="perk-icon amber" />
                            <div>
                                <strong>Direct Payments</strong>
                                <span>Transparent earnings without mediator cuts</span>
                            </div>
                        </div>

                        <div className="worker-perk-card">
                            <HeartHandshake size={18} className="perk-icon purple" />
                            <div>
                                <strong>Community Trust</strong>
                                <span>Build your reputation with genuine customer reviews</span>
                            </div>
                        </div>
                    </div>

                    {/* High-res Hero Image Showcase */}
                    <div className="worker-image-showcase-frame">
                        <img
                            src={workerHeroImg}
                            alt="Skilled Indian cooperative workers in modern workshop"
                            className="worker-hero-img"
                        />
                        <div className="worker-image-overlay">
                            <div className="image-badge-floating">
                                <Users size={16} />
                                <span>500+ Verified Workers across 15+ Cooperatives</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* RIGHT LOGIN CARD */}
                <section className="worker-form-section">
                    <div className="worker-login-card">
                        <div className="worker-badge-pill">
                            <Wrench size={16} />
                            <span>Skilled Worker Access</span>
                        </div>

                        <h2>Worker Portal Login</h2>
                        <p className="worker-subtitle">
                            Sign in to toggle availability, receive job notifications, and manage bookings.
                        </p>

                        {error && (
                            <div className="worker-error-banner">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="worker-login-form">
                            <div className="form-group">
                                <label>Registered Mobile Number</label>
                                <div className="input-box">
                                    <Phone size={18} className="input-icon" />
                                    <input
                                        type="tel"
                                        placeholder="Enter 10-digit mobile number"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Account Password</label>
                                <div className="input-box">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="worker-submit-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span>Authenticating Worker...</span>
                                ) : (
                                    <>
                                        <span>Access Worker Dashboard</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="worker-info-box">
                            <div className="info-item">
                                <CheckCircle2 size={16} className="text-emerald" />
                                <span>Direct customer calls & live GPS navigation</span>
                            </div>
                            <div className="info-item">
                                <Award size={16} className="text-amber" />
                                <span>1-click job lifecycle: Accept ➔ On The Way ➔ Completed</span>
                            </div>
                        </div>

                        <div className="worker-switch-role">
                            <span>Looking for other portals? </span>
                            <button type="button" onClick={() => navigate("/login")}>
                                Choose Role
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default WorkerLogin;
