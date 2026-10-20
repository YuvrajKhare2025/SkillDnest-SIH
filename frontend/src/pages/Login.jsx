import { useNavigate } from "react-router-dom";
import {
    UserRound,
    Building2,
    Wrench,
    ArrowRight,
    ShieldCheck,
    Sparkles
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";

import "./Login.css";

function Login() {
    const navigate = useNavigate();

    return (
        <div className="login-page">

            {/* ================= HEADER ================= */}

            <header className="login-header">

                <div className="brand">

                    <img
                        src={logo}
                        alt="SkillDnest"
                        className="brand-logo"
                    />

                    <div>
                        <h2>SkillDnest</h2>
                        <span>Local Skills, Trusted Services</span>
                    </div>

                </div>

                <button
                    className="back-home"
                    onClick={() => navigate("/")}
                >
                    ← Home
                </button>

            </header>


            {/* ================= MAIN ================= */}

            <main className="login-main">

                {/* LEFT IMAGE */}

                <section className="login-visual">

                    <div className="visual-image"></div>

                    <div className="visual-overlay"></div>

                    <div className="visual-content">

                        <div className="verified-badge">
                            <ShieldCheck size={17} />
                            Trusted Local Network
                        </div>

                        <h1>
                            One platform.
                            <br />
                            <span>Local opportunities.</span>
                        </h1>

                        <p>
                            Connect customers with trusted workers
                            and cooperative societies in your community.
                        </p>

                        <div className="visual-stats">

                            <div>
                                <strong>✓</strong>
                                <span>Verified Workers</span>
                            </div>

                            <div>
                                <strong>✓</strong>
                                <span>Trusted Societies</span>
                            </div>

                            <div>
                                <strong>✓</strong>
                                <span>Fair Opportunities</span>
                            </div>

                        </div>

                    </div>

                </section>


                {/* RIGHT LOGIN AREA */}

                <section className="login-area">

                    <div className="login-heading">

                        <div className="welcome-pill">
                            <Sparkles size={15} />
                            Welcome to SkillDnest
                        </div>

                        <h2>
                            How do you want
                            <span> to continue?</span>
                        </h2>

                        <p>
                            Choose your account type to access your dashboard.
                        </p>

                    </div>


                    {/* CARDS */}

                    <div className="login-options">

                        {/* CUSTOMER */}

                        <div className="account-card customer-card">

                            <div className="card-top">

                                <div className="account-icon customer-icon">
                                    <UserRound size={27} />
                                </div>

                                <span className="account-tag">
                                    CUSTOMER
                                </span>

                            </div>

                            <h3>
                                Customer Account
                            </h3>

                            <p>
                                Discover trusted local workers,
                                compare services and book help
                                whenever you need it.
                            </p>

                            <button
                                className="continue-btn customer-btn"
                                onClick={() => navigate("/customer-login")}
                            >
                                Login as Customer
                                <ArrowRight size={18} />
                            </button>

                            <div className="new-account">

                                <span>New customer?</span>

                                <button
                                    onClick={() =>
                                        navigate("/customer-register")
                                    }
                                >
                                    Create new account
                                </button>

                            </div>

                        </div>


                        {/* COOPERATIVE */}

                        <div className="account-card society-card">

                            <div className="card-top">

                                <div className="account-icon society-icon">
                                    <Building2 size={27} />
                                </div>

                                <span className="account-tag">
                                    COOPERATIVE SOCIETY
                                </span>

                            </div>

                            <h3>
                                Society Account
                            </h3>

                            <p>
                                Manage your workers, services,
                                bookings and cooperative
                                operations from one place.
                            </p>

                            <button
                                className="continue-btn society-btn"
                                onClick={() =>
                                    navigate("/cooperative-login")
                                }
                            >
                                Login as Society
                                <ArrowRight size={18} />
                            </button>

                            <div className="new-account">

                                <span>New society?</span>

                                <button
                                    onClick={() =>
                                        navigate("/cooperative-register")
                                    }
                                >
                                    Register society
                                </button>

                            </div>

                        </div>


                        {/* SKILLED WORKER */}

                        <div className="account-card worker-card">

                            <div className="card-top">

                                <div className="account-icon worker-icon">
                                    <Wrench size={27} />
                                </div>

                                <span className="account-tag">
                                    SKILLED WORKER
                                </span>

                            </div>

                            <h3>
                                Worker Account
                            </h3>

                            <p>
                                Access your assigned gigs, toggle
                                on-call availability, update job status
                                and track your earnings.
                            </p>

                            <button
                                className="continue-btn worker-btn"
                                onClick={() =>
                                    navigate("/worker-login")
                                }
                            >
                                Login as Worker
                                <ArrowRight size={18} />
                            </button>

                            <div className="new-account">

                                <span>Registered with coop?</span>

                                <button
                                    onClick={() =>
                                        navigate("/worker-login")
                                    }
                                >
                                    Access your dashboard
                                </button>

                            </div>

                        </div>

                    </div>


                    <div className="security-note">

                        <ShieldCheck size={16} />

                        <span>
                            Your information is protected with secure authentication.
                        </span>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Login;