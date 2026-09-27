import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ShieldCheck,
    Building2,
    UserRound,
    Sparkles,
    Zap,
    Wrench,
    Leaf,
    Star
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import "./Welcome.css";

function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="welcome-page">
            {/* Background Backdrop */}
            <div className="welcome-background"></div>

            {/* Ambient Gradient Overlay */}
            <div className="welcome-overlay"></div>

            {/* Main Central Card */}
            <div className="welcome-content">
                {/* Brand Logo & Title */}
                <div className="welcome-logo-wrap">
                    <div className="welcome-logo">
                        <img src={logo} alt="SkillDnest Logo" />
                    </div>
                    <span className="welcome-brand-name">SkillDnest</span>
                </div>

                <div className="welcome-text">
                    <p className="welcome-small">LOCAL COOPERATIVE SERVICES PLATFORM</p>

                    <h1>
                        Local Skills.
                        <br />
                        <span>Trusted Services.</span>
                    </h1>

                    <p className="welcome-description">
                        Connect with verified local workers and cooperative societies
                        for reliable household, community, and agriculture services powered by AI smart matching.
                    </p>
                </div>

                {/* Service Highlights Cards */}
                <div className="service-floating-cards">
                    <div className="floating-card card-one">
                        <Zap size={16} className="card-icon" />
                        <span>Electrical</span>
                    </div>

                    <div className="floating-card card-two">
                        <Leaf size={16} className="card-icon" />
                        <span>Agriculture</span>
                    </div>

                    <div className="floating-card card-three">
                        <Wrench size={16} className="card-icon" />
                        <span>Repair & Plumbing</span>
                    </div>

                    <div className="floating-card card-four">
                        <Sparkles size={16} className="card-icon" />
                        <span>Deep Cleaning</span>
                    </div>
                </div>

                {/* Trust Points */}
                <div className="welcome-trust-row">
                    <div className="welcome-trust-badge">
                        <ShieldCheck size={15} />
                        <span>Verified Workers</span>
                    </div>
                    <div className="welcome-trust-badge">
                        <Building2 size={15} />
                        <span>Cooperative Societies</span>
                    </div>
                    <div className="welcome-trust-badge">
                        <Star size={15} />
                        <span>Fair Opportunity</span>
                    </div>
                </div>

                {/* Primary Action Button */}
                <div className="welcome-actions-group">
                    <button
                        className="welcome-login-btn"
                        onClick={() => navigate("/login")}
                    >
                        <span>GET STARTED</span>
                        <ArrowRight size={18} />
                    </button>

                    {/* Quick Portal Switchers */}
                    <div className="welcome-portal-shortcuts">
                        <button
                            type="button"
                            className="portal-shortcut-btn"
                            onClick={() => navigate("/customer-login")}
                        >
                            <UserRound size={14} />
                            <span>Customer Portal</span>
                        </button>
                        <span className="portal-shortcut-divider">•</span>
                        <button
                            type="button"
                            className="portal-shortcut-btn"
                            onClick={() => navigate("/cooperative-login")}
                        >
                            <Building2 size={14} />
                            <span>Cooperative Portal</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Welcome;