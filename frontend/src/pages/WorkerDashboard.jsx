import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Wrench,
    Zap,
    MapPin,
    Phone,
    Calendar,
    Clock,
    CheckCircle2,
    Clock3,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    Star,
    AlertCircle,
    Building2,
    LogOut,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    Navigation,
    Award,
    DollarSign,
    UserCheck,
    Check,
    X
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import api from "../services/api";
import "./WorkerDashboard.css";

function WorkerDashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    });

    const [workerProfile, setWorkerProfile] = useState(null);
    const [stats, setStats] = useState({
        totalBookings: 0,
        completedBookings: 0,
        activeBookings: 0,
        pendingBookings: 0,
        totalEarnings: 0
    });
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const fetchWorkerData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Profile
            const profileRes = await api.get("/workers/me").catch(() => null);
            if (profileRes?.data) {
                setWorkerProfile(profileRes.data);
            }

            // 2. Fetch Stats
            const statsRes = await api.get("/workers/me/stats").catch(() => null);
            if (statsRes?.data) {
                setStats(statsRes.data);
            }

            // 3. Fetch Bookings
            const bookingsRes = await api.get("/bookings").catch(() => ({ data: { bookings: [] } }));
            const list = bookingsRes.data?.bookings || bookingsRes.data || [];
            setBookings(Array.isArray(list) ? list : []);

        } catch (err) {
            console.error("Worker dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkerData();
    }, []);

    const handleToggleAvailability = async () => {
        try {
            setAvailabilityLoading(true);
            const current = workerProfile?.availability ?? true;
            const res = await api.patch("/workers/me/availability", {
                availability: !current
            });

            if (res.data?.worker) {
                setWorkerProfile(res.data.worker);
            } else {
                setWorkerProfile((prev) => ({ ...prev, availability: !current }));
            }
            setStatusMessage(`Status updated: ${!current ? "Available for Dispatch" : "Offline / Resting"}`);
            setTimeout(() => setStatusMessage(""), 3000);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update availability");
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const handleBookingStatus = async (bookingId, action) => {
        try {
            setUpdatingStatus(bookingId);
            await api.patch(`/bookings/${bookingId}/${action}`);
            setStatusMessage(`Booking status updated to ${action}!`);
            setTimeout(() => setStatusMessage(""), 3000);
            await fetchWorkerData();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to update booking to ${action}`);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/worker-login");
    };

    const isAvailable = workerProfile?.availability !== false;

    return (
        <div className="worker-dash-page">
            {/* Top Navigation Bar */}
            <header className="worker-dash-header">
                <div className="worker-dash-brand" onClick={() => navigate("/")}>
                    <img src={logo} alt="SkillDnest" className="dash-logo" />
                    <div>
                        <h2>SkillDnest Worker</h2>
                        <span>Cooperative Dispatch Portal</span>
                    </div>
                </div>

                <div className="worker-header-right">
                    <button
                        className={`availability-toggle-btn ${isAvailable ? "is-online" : "is-offline"}`}
                        onClick={handleToggleAvailability}
                        disabled={availabilityLoading}
                        title="Click to toggle availability"
                    >
                        <span className="status-dot"></span>
                        <span>{isAvailable ? "Available (Online)" : "Offline"}</span>
                        {isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>

                    <button className="worker-logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            {statusMessage && (
                <div className="worker-toast-message">
                    <CheckCircle2 size={16} />
                    <span>{statusMessage}</span>
                </div>
            )}

            <main className="worker-dash-container">
                {/* Worker Profile Hero */}
                <section className="worker-hero-card">
                    <div className="worker-hero-left">
                        <div className="worker-avatar">
                            {workerProfile?.photo ? (
                                <img src={workerProfile.photo} alt={workerProfile.name} />
                            ) : (
                                <div className="avatar-fallback">
                                    {(workerProfile?.name || user.name || "W")[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="worker-hero-info">
                            <div className="worker-name-row">
                                <h1>{workerProfile?.name || user.name || "Skilled Specialist"}</h1>
                                <span className="verified-chip">
                                    <ShieldCheck size={14} /> Verified Worker
                                </span>
                            </div>

                            <p className="worker-skills-list">
                                {Array.isArray(workerProfile?.skills)
                                    ? workerProfile.skills.join(" • ")
                                    : (workerProfile?.skills || "Local Community Services")}
                            </p>

                            <div className="worker-meta-row">
                                <span className="meta-item">
                                    <MapPin size={14} /> {workerProfile?.location || "Bhopal, MP"}
                                </span>
                                <span className="meta-item">
                                    <Building2 size={14} /> {workerProfile?.cooperativeId?.societyName || "Registered Cooperative Network"}
                                </span>
                                <span className="meta-item rating-meta">
                                    <Star size={14} className="star-fill" /> {workerProfile?.rating ? `${workerProfile.rating} / 5.0` : "5.0 Rating"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="worker-hero-right">
                        <button className="refresh-data-btn" onClick={fetchWorkerData} disabled={loading}>
                            <RefreshCw size={15} className={loading ? "spin" : ""} />
                            <span>Refresh Gigs</span>
                        </button>
                    </div>
                </section>

                {/* Key Metrics Row */}
                <section className="worker-metrics-grid">
                    <div className="metric-box box-emerald">
                        <div className="metric-icon">
                            <DollarSign size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Total Earnings</span>
                            <span className="metric-value">₹{stats.totalEarnings || 0}</span>
                            <span className="metric-sub">Direct cooperative payout</span>
                        </div>
                    </div>

                    <div className="metric-box box-blue">
                        <div className="metric-icon">
                            <Wrench size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Active Gigs</span>
                            <span className="metric-value">{stats.activeBookings || 0}</span>
                            <span className="metric-sub">Assigned & In-progress</span>
                        </div>
                    </div>

                    <div className="metric-box box-amber">
                        <div className="metric-icon">
                            <Clock3 size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Pending Requests</span>
                            <span className="metric-value">{stats.pendingBookings || 0}</span>
                            <span className="metric-sub">Waiting for acceptance</span>
                        </div>
                    </div>

                    <div className="metric-box box-purple">
                        <div className="metric-icon">
                            <Award size={22} />
                        </div>
                        <div className="metric-details">
                            <span className="metric-label">Completed Jobs</span>
                            <span className="metric-value">{stats.completedBookings || 0}</span>
                            <span className="metric-sub">100% Verified delivery</span>
                        </div>
                    </div>
                </section>

                {/* Gigs & Jobs Section */}
                <section className="worker-jobs-section">
                    <div className="jobs-header-row">
                        <div>
                            <h2>Assigned Gigs & Bookings</h2>
                            <p>Real-time customer requests dispatched through your cooperative network</p>
                        </div>
                        <span className="jobs-count-tag">{bookings.length} Total Bookings</span>
                    </div>

                    {loading ? (
                        <div className="jobs-loading-state">
                            <RefreshCw size={24} className="spin" />
                            <p>Loading your assigned jobs...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="jobs-empty-state">
                            <Wrench size={42} className="empty-icon" />
                            <h3>No Active Gigs Right Now</h3>
                            <p>Make sure your availability status is set to "Online" so cooperatives can dispatch requests to you.</p>
                            {!isAvailable && (
                                <button className="go-online-btn" onClick={handleToggleAvailability}>
                                    Go Online Now
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="jobs-cards-grid">
                            {bookings.map((booking) => {
                                const isUpdating = updatingStatus === booking._id;
                                const isEmergency = booking.isEmergency;

                                return (
                                    <div key={booking._id} className={`job-card ${isEmergency ? "job-emergency" : ""}`}>
                                        <div className="job-card-header">
                                            <div className="job-service-tag">
                                                <Wrench size={15} />
                                                <span>{booking.service}</span>
                                            </div>

                                            <div className="job-status-badges">
                                                {isEmergency && (
                                                    <span className="emergency-badge">🚨 Emergency</span>
                                                )}
                                                <span className={`status-badge status-${(booking.status || "pending").toLowerCase()}`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="job-customer-info">
                                            <h4>{booking.customerId?.name || "Customer"}</h4>
                                            <div className="job-detail-row">
                                                <Phone size={14} />
                                                <a href={`tel:${booking.customerId?.phone || ""}`} className="phone-link">
                                                    {booking.customerId?.phone || "No phone"}
                                                </a>
                                            </div>
                                            <div className="job-detail-row">
                                                <MapPin size={14} />
                                                <span>{booking.address}</span>
                                            </div>
                                            <div className="job-detail-row">
                                                <Calendar size={14} />
                                                <span>{booking.date} at {booking.time}</span>
                                            </div>
                                            {booking.notes && (
                                                <div className="job-notes-box">
                                                    <strong>Customer Note:</strong> {booking.notes}
                                                </div>
                                            )}
                                        </div>

                                        <div className="job-footer">
                                            <div className="job-amount">
                                                <span className="amount-label">Pay Amount</span>
                                                <span className="amount-val">₹{booking.amount || 350}</span>
                                                <span className={`payment-pill pill-${(booking.paymentStatus || "pending").toLowerCase()}`}>
                                                    {booking.paymentStatus === "Paid" ? "✓ Paid" : "Payment Pending"}
                                                </span>
                                            </div>

                                            {/* Action Transition Buttons */}
                                            <div className="job-action-buttons">
                                                {booking.status === "Pending" && (
                                                    <>
                                                        <button
                                                            className="btn-action btn-accept"
                                                            disabled={isUpdating}
                                                            onClick={() => handleBookingStatus(booking._id, "accept")}
                                                        >
                                                            <Check size={15} />
                                                            <span>Accept</span>
                                                        </button>
                                                        <button
                                                            className="btn-action btn-reject"
                                                            disabled={isUpdating}
                                                            onClick={() => handleBookingStatus(booking._id, "reject")}
                                                        >
                                                            <X size={15} />
                                                            <span>Decline</span>
                                                        </button>
                                                    </>
                                                )}

                                                {booking.status === "Accepted" && (
                                                    <button
                                                        className="btn-action btn-primary"
                                                        disabled={isUpdating}
                                                        onClick={() => handleBookingStatus(booking._id, "on-the-way")}
                                                    >
                                                        <Navigation size={15} />
                                                        <span>On The Way</span>
                                                    </button>
                                                )}

                                                {booking.status === "OnTheWay" && (
                                                    <button
                                                        className="btn-action btn-start"
                                                        disabled={isUpdating}
                                                        onClick={() => handleBookingStatus(booking._id, "start")}
                                                    >
                                                        <Clock3 size={15} />
                                                        <span>Start Work</span>
                                                    </button>
                                                )}

                                                {booking.status === "InProgress" && (
                                                    <button
                                                        className="btn-action btn-complete"
                                                        disabled={isUpdating}
                                                        onClick={() => handleBookingStatus(booking._id, "complete")}
                                                    >
                                                        <CheckCircle2 size={15} />
                                                        <span>Finish & Complete</span>
                                                    </button>
                                                )}

                                                {booking.status === "Completed" && (
                                                    <div className="job-done-indicator">
                                                        <CheckCircle2 size={16} className="text-emerald" />
                                                        <span>Service Completed Successfully</span>
                                                    </div>
                                                )}

                                                {booking.status === "Cancelled" && (
                                                    <div className="job-cancelled-indicator">
                                                        <span>Cancelled by Customer</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default WorkerDashboard;
