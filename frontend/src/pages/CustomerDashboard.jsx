import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    MapPin,
    Sparkles,
    ShieldCheck,
    Clock3,
    ArrowRight,
    Wrench,
    Zap,
    Droplets,
    Tractor,
    Star,
    Users,
    Building2,
    CheckCircle2,
    UserRound,
    BadgeCheck,
    Bot,
    Bell,
    Globe,
    LogOut,
    AlertCircle,
    Calendar,
    Phone,
    X,
    CreditCard,
    Check,
    Flame,
    Navigation,
    Award,
    Info,
    Camera,
    RefreshCw,
    SlidersHorizontal,
    Briefcase,
    TrendingUp,
    HeartHandshake
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import api from "../services/api";
import { translations } from "../utils/translations";
import ServiceMap from "../components/ServiceMap";
import "./CustomerDashboard.css";

// 12 Standard Reusable Categories
const ALL_CATEGORIES = [
    { id: "all", name: "All Categories", icon: Sparkles },
    { id: "Plumbing", name: "Plumber", icon: Wrench },
    { id: "Electrical", name: "Electrician", icon: Zap },
    { id: "Carpenter", name: "Carpenter", icon: Wrench },
    { id: "Painter", name: "Painter", icon: Droplets },
    { id: "Cleaner", name: "Cleaner", icon: Sparkles },
    { id: "Mechanic", name: "Mechanic", icon: Wrench },
    { id: "Driver", name: "Driver", icon: Navigation },
    { id: "Tutor", name: "Tutor", icon: UserRound },
    { id: "Caregiver", name: "Caregiver", icon: Users },
    { id: "Gardener", name: "Gardener", icon: Droplets },
    { id: "Domestic Worker", name: "Domestic Worker", icon: UserRound },
    { id: "Agriculture Labour", name: "Agriculture Labour", icon: Tractor }
];

function CustomerDashboard() {
    const navigate = useNavigate();

    // Multilingual & User State
    const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
    const t = translations[lang] || translations.en;

    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    });

    // Navigation Tab: "explore" or "bookings"
    const [activeTab, setActiveTab] = useState("explore");

    // Search & Filter States
    const [request, setRequest] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isEmergency, setIsEmergency] = useState(false);
    const [userLocation, setUserLocation] = useState("Satna, MP");
    const [geoLoading, setGeoLoading] = useState(false);

    // AI Smart Match States
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiMatchedWorkers, setAiMatchedWorkers] = useState([]);
    const [aiError, setAiError] = useState("");
    const [aiConfidence, setAiConfidence] = useState(0);

    // Data Lists
    const [workers, setWorkers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNetwork, setLoadingNetwork] = useState(true);

    // Modals
    const [bookingWorker, setBookingWorker] = useState(null);
    const [scoreInfoWorker, setScoreInfoWorker] = useState(null);
    const [reviewBooking, setReviewBooking] = useState(null);
    const [paymentBooking, setPaymentBooking] = useState(null);

    // Booking Form State
    const [bookingForm, setBookingForm] = useState({
        service: "General Service",
        date: new Date().toISOString().split("T")[0],
        time: "10:00 AM",
        address: userLocation,
        amount: 350,
        notes: "",
        isEmergency: false
    });
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState("");
    const [bookingError, setBookingError] = useState("");

    // Review Form State
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: "",
        workPhoto: ""
    });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState("");

    // Payment Form State
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState("");

    // Toggle Language
    const toggleLanguage = () => {
        const next = lang === "en" ? "hi" : "en";
        setLang(next);
        localStorage.setItem("lang", next);
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/customer-login");
    };

    // Geolocation detection
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toFixed(3);
                const lng = pos.coords.longitude.toFixed(3);
                const locStr = `Near Coordinates (${lat}, ${lng})`;
                setUserLocation(locStr);
                setGeoLoading(false);
            },
            (err) => {
                console.warn("Location error:", err.message);
                setUserLocation("Satna, MP");
                setGeoLoading(false);
            },
            { timeout: 8000 }
        );
    };

    // Fetch All Dynamic Dashboard Data
    const fetchAllData = async () => {
        try {
            setLoadingNetwork(true);

            // 1. Fetch Workers
            const workersRes = await api.get("/workers").catch(() => ({ data: [] }));
            const workerList = Array.isArray(workersRes.data)
                ? workersRes.data
                : (workersRes.data?.workers || []);
            setWorkers(workerList);

            // 2. Fetch Customer Bookings
            const bookingsRes = await api.get("/bookings/my-bookings").catch(() => ({ data: [] }));
            const bookingList = Array.isArray(bookingsRes.data)
                ? bookingsRes.data
                : (bookingsRes.data?.bookings || []);
            setBookings(bookingList);

            // 3. Fetch Notifications
            const notifRes = await api.get("/notifications/my-notifications").catch(() => ({ data: [] }));
            const notifList = Array.isArray(notifRes.data)
                ? notifRes.data
                : (notifRes.data?.notifications || []);
            setNotifications(Array.isArray(notifList) ? notifList : []);

        } catch (err) {
            console.error("Dashboard data fetch error:", err);
        } finally {
            setLoadingNetwork(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Perform Local NLP / Heuristic Match
    const performLocalMatch = (text, availableWorkerList) => {
        const lower = text.toLowerCase();
        let detectedService = "General Service";
        let priority = isEmergency || lower.includes("urg") || lower.includes("emerg") || lower.includes("leak") || lower.includes("burst") || lower.includes("short circuit") ? "Emergency" : "Normal";
        let category = "Household";

        if (lower.includes("plumb") || lower.includes("pipe") || lower.includes("leak") || lower.includes("tap") || lower.includes("drain")) {
            detectedService = "Plumbing";
        } else if (lower.includes("electr") || lower.includes("wir") || lower.includes("switch") || lower.includes("fan") || lower.includes("current") || lower.includes("light")) {
            detectedService = "Electrical";
        } else if (lower.includes("carpenter") || lower.includes("wood") || lower.includes("door") || lower.includes("furniture") || lower.includes("table")) {
            detectedService = "Carpenter";
        } else if (lower.includes("paint") || lower.includes("color") || lower.includes("wall")) {
            detectedService = "Painter";
        } else if (lower.includes("clean") || lower.includes("wash") || lower.includes("sweep") || lower.includes("dust")) {
            detectedService = "Cleaner";
        } else if (lower.includes("mechanic") || lower.includes("car") || lower.includes("bike") || lower.includes("motor") || lower.includes("scooter")) {
            detectedService = "Mechanic";
        } else if (lower.includes("driver") || lower.includes("drive") || lower.includes("ride") || lower.includes("trip")) {
            detectedService = "Driver";
        } else if (lower.includes("tutor") || lower.includes("teach") || lower.includes("study") || lower.includes("math") || lower.includes("class")) {
            detectedService = "Tutor";
        } else if (lower.includes("care") || lower.includes("elder") || lower.includes("patient") || lower.includes("baby")) {
            detectedService = "Caregiver";
        } else if (lower.includes("garden") || lower.includes("plant") || lower.includes("tree") || lower.includes("grass")) {
            detectedService = "Gardener";
        } else if (lower.includes("domestic") || lower.includes("maid") || lower.includes("cook") || lower.includes("helper")) {
            detectedService = "Domestic Worker";
        } else if (lower.includes("farm") || lower.includes("crop") || lower.includes("harvest") || lower.includes("agriculture")) {
            detectedService = "Agriculture Labour";
        }

        // Filter and Rank Workers
        const matched = (availableWorkerList || workers).filter(w => {
            const skillsStr = (Array.isArray(w.skills) ? w.skills.join(" ") : String(w.skills || "")).toLowerCase();
            return skillsStr.includes(detectedService.toLowerCase()) || detectedService === "General Service";
        }).sort((a, b) => {
            // Sort by availability, then opportunity score, then rating
            if (a.availability !== b.availability) return a.availability ? -1 : 1;
            const oppA = a.opportunityScore || 75;
            const oppB = b.opportunityScore || 75;
            if (oppB !== oppA) return oppB - oppA;
            return (b.rating || 4) - (a.rating || 4);
        });

        return {
            analysis: {
                service: detectedService,
                category,
                priority,
                location: userLocation,
                duration: priority === "Emergency" ? "Immediate Dispatch (30 mins)" : "1-2 hours",
                reasoning: `Identified demand for ${detectedService} service with ${priority} priority. Ranked cooperative specialists prioritizing active availability and highest Fair Opportunity Scores.`
            },
            matchedWorkers: matched.slice(0, 4),
            confidence: detectedService === "General Service" ? 82 : 96
        };
    };

    // AI Smart Matching Trigger
    const handleSmartMatch = async (customPrompt) => {
        const queryText = (customPrompt || request).trim();

        if (!queryText) {
            setAiError("Please describe what service or help you need.");
            return;
        }

        if (customPrompt) {
            setRequest(customPrompt);
        }

        setAiLoading(true);
        setAiError("");
        setAiResult(null);
        setAiMatchedWorkers([]);

        try {
            // Call Smart Match API (POST /api/smart-match)
            const response = await api.post("/smart-match", {
                requirement: queryText,
                message: queryText,
                location: userLocation
            });

            const data = response.data;

            if (data && (data.aiAnalysis || data.cooperatives || data.directWorkers)) {
                const analysis = data.aiAnalysis || {};
                const detectedService = analysis.service || "General Service";
                const priority = analysis.priority || (isEmergency ? "Emergency" : "Normal");

                setAiResult({
                    service: detectedService,
                    category: analysis.category || "Household",
                    priority: priority,
                    location: analysis.location || userLocation,
                    duration: analysis.duration || (priority === "Emergency" || priority === "urgent" ? "Immediate (30m)" : "1-2 hours"),
                    reasoning: data.message || `AI analyzed requirement and matched top certified cooperative specialists.`
                });

                if (priority === "Emergency" || priority === "urgent" || priority === "High") {
                    setIsEmergency(true);
                }

                // Extract all workers from response
                let matchedList = [];

                if (Array.isArray(data.cooperatives) && data.cooperatives.length > 0) {
                    data.cooperatives.forEach(c => {
                        if (Array.isArray(c.workers)) {
                            c.workers.forEach(w => {
                                matchedList.push({
                                    ...w,
                                    _id: w.id || w._id,
                                    cooperativeName: c.societyName
                                });
                            });
                        }
                    });
                }

                if (Array.isArray(data.directWorkers) && data.directWorkers.length > 0) {
                    data.directWorkers.forEach(w => {
                        if (!matchedList.some(m => m._id === w._id)) {
                            matchedList.push(w);
                        }
                    });
                }

                // If backend returned no workers, run local match with platform workers
                if (matchedList.length === 0) {
                    const localResult = performLocalMatch(queryText, workers);
                    matchedList = localResult.matchedWorkers;
                }

                setAiMatchedWorkers(matchedList.slice(0, 4));
                setAiConfidence(95);

                // Auto-select category
                if (detectedService && detectedService !== "General Service") {
                    setSelectedCategory(detectedService);
                }
            } else {
                throw new Error("No structured analysis returned");
            }
        } catch (err) {
            console.warn("AI Smart Match fallback:", err.message);

            // Execute local AI heuristic fallback
            const localResult = performLocalMatch(queryText, workers);
            setAiResult(localResult.analysis);
            setAiMatchedWorkers(localResult.matchedWorkers);
            setAiConfidence(localResult.confidence);

            if (localResult.analysis.service && localResult.analysis.service !== "General Service") {
                setSelectedCategory(localResult.analysis.service);
            }
            if (localResult.analysis.priority === "Emergency") {
                setIsEmergency(true);
            }
        } finally {
            setAiLoading(false);
        }
    };

    // Filtered Workers Catalog
    const displayedWorkers = useMemo(() => {
        return workers.filter((worker) => {
            const skills = Array.isArray(worker.skills)
                ? worker.skills.join(" ").toLowerCase()
                : String(worker.skills || "").toLowerCase();

            // Category filter
            if (selectedCategory !== "all") {
                const target = selectedCategory.toLowerCase();
                if (!skills.includes(target)) return false;
            }

            // Emergency filter
            if (isEmergency && !worker.availability) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.availability !== b.availability) {
                return a.availability ? -1 : 1;
            }
            const oppA = a.opportunityScore || 75;
            const oppB = b.opportunityScore || 75;
            if (oppB !== oppA) return oppB - oppA;
            return (b.rating || 4) - (a.rating || 4);
        });
    }, [workers, selectedCategory, isEmergency]);

    // Open Booking Modal
    const openBookingModal = (worker) => {
        const workerSkills = Array.isArray(worker.skills) ? worker.skills : [worker.skills];
        const primaryService = selectedCategory !== "all" ? selectedCategory : (workerSkills[0] || "Household Service");

        setBookingWorker(worker);
        setBookingForm({
            service: primaryService,
            date: new Date().toISOString().split("T")[0],
            time: "11:00 AM",
            address: userLocation || "Local Community",
            amount: 350 + (worker.experience || 0) * 20,
            notes: isEmergency ? "🚨 URGENT EMERGENCY REQUEST" : "",
            isEmergency: isEmergency
        });
        setBookingSuccess("");
        setBookingError("");
    };

    // Submit Booking
    const handleCreateBooking = async (e) => {
        e.preventDefault();
        setBookingSubmitting(true);
        setBookingError("");
        setBookingSuccess("");

        try {
            await api.post("/bookings", {
                workerId: bookingWorker._id,
                service: bookingForm.service,
                date: bookingForm.date,
                time: bookingForm.time,
                address: bookingForm.address,
                amount: bookingForm.amount,
                isEmergency: bookingForm.isEmergency,
                notes: bookingForm.notes
            });

            setBookingSuccess("Booking placed successfully! Worker & Cooperative notified.");
            setTimeout(() => {
                setBookingWorker(null);
                setActiveTab("bookings");
                fetchAllData();
            }, 1200);
        } catch (err) {
            console.error("Booking error:", err);
            setBookingError(
                err.response?.data?.message || "Failed to create booking. Please check details."
            );
        } finally {
            setBookingSubmitting(false);
        }
    };

    // Cancel Booking
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await api.patch(`/bookings/${bookingId}/cancel`);
            fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel booking.");
        }
    };

    // Submit Payment
    const handleProcessPayment = async (e) => {
        e.preventDefault();
        setPaymentSubmitting(true);
        setPaymentSuccess("");

        try {
            await api.post("/payments/process", {
                bookingId: paymentBooking._id,
                amount: paymentBooking.amount || 350,
                paymentMethod
            });

            setPaymentSuccess("Payment simulated successfully! Receipt generated.");
            setTimeout(() => {
                setPaymentBooking(null);
                fetchAllData();
            }, 1200);
        } catch (err) {
            console.error("Payment error:", err);
            alert(err.response?.data?.message || "Payment simulation failed.");
        } finally {
            setPaymentSubmitting(false);
        }
    };

    // Submit Review
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setReviewSubmitting(true);
        setReviewSuccess("");

        try {
            await api.post("/reviews", {
                bookingId: reviewBooking._id,
                rating: Number(reviewForm.rating),
                comment: reviewForm.comment,
                workPhoto: reviewForm.workPhoto
            });

            setReviewSuccess("Thank you for your valuable feedback!");
            setTimeout(() => {
                setReviewBooking(null);
                fetchAllData();
            }, 1200);
        } catch (err) {
            console.error("Review error:", err);
            alert(err.response?.data?.message || "Failed to submit review.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    // Mark all notifications read
    const handleMarkAllRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.warn("Mark read error:", err);
        }
    };

    const unreadNotifCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="customer-dashboard">

            {/* TOP NAVIGATION BAR */}
            <header className="dashboard-navbar">
                <div className="dashboard-brand" onClick={() => setActiveTab("explore")}>
                    <img
                        src={logo}
                        alt="SkillDnest Logo"
                        className="brand-logo-img"
                    />
                    <div className="brand-text">
                        <h2>{t.brandName || "SkillDnest"}</h2>
                        <span>Cooperative Gig Services Platform</span>
                    </div>
                </div>

                <div className="dashboard-nav-center">
                    {/* Location Badge */}
                    <button
                        className="location-pill-btn"
                        onClick={handleDetectLocation}
                        title="Click to detect current location"
                        type="button"
                    >
                        <MapPin size={15} className="location-pin-icon" />
                        <span>{geoLoading ? "Detecting..." : userLocation}</span>
                    </button>

                    {/* Navigation Tabs */}
                    <div className="dashboard-tabs">
                        <button
                            className={activeTab === "explore" ? "tab-btn active" : "tab-btn"}
                            onClick={() => setActiveTab("explore")}
                            type="button"
                        >
                            <Sparkles size={16} />
                            <span>Explore Services</span>
                        </button>
                        <button
                            className={activeTab === "bookings" ? "tab-btn active" : "tab-btn"}
                            onClick={() => setActiveTab("bookings")}
                            type="button"
                        >
                            <Calendar size={16} />
                            <span>{t.myBookings || "My Bookings"}</span>
                            {bookings.filter(b => b.status === "Pending" || b.status === "Accepted" || b.status === "OnTheWay" || b.status === "InProgress").length > 0 && (
                                <span className="tab-badge">
                                    {bookings.filter(b => b.status === "Pending" || b.status === "Accepted" || b.status === "OnTheWay" || b.status === "InProgress").length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="dashboard-nav-right">
                    {/* Multilingual Toggle */}
                    <button
                        className="nav-action-pill"
                        onClick={toggleLanguage}
                        title="Change Language"
                        type="button"
                    >
                        <Globe size={15} />
                        <span>{lang === "en" ? "हिन्दी" : "English"}</span>
                    </button>

                    {/* Notification Bell */}
                    <div className="notification-wrapper">
                        <button
                            className="nav-icon-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                            title="Notifications"
                            type="button"
                        >
                            <Bell size={18} />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">{unreadNotifCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notif-header">
                                    <strong>{t.notifications || "Notifications"}</strong>
                                    {unreadNotifCount > 0 && (
                                        <button onClick={handleMarkAllRead} type="button">
                                            {t.markAllRead || "Mark read"}
                                        </button>
                                    )}
                                </div>
                                <div className="notif-list">
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">{t.noNotifications || "No notifications yet."}</div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif._id}
                                                className={`notif-item ${notif.isRead ? "read" : "unread"}`}
                                            >
                                                <div className="notif-dot"></div>
                                                <div className="notif-content-text">
                                                    <p>{notif.message}</p>
                                                    <small>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile & Logout */}
                    <div className="dashboard-profile">
                        <div className="profile-circle">
                            {user.name ? user.name[0].toUpperCase() : "C"}
                        </div>
                        <div className="profile-info-block">
                            <strong>{user.name || "Customer"}</strong>
                            <button className="logout-link-btn" onClick={handleLogout} type="button">
                                <LogOut size={12} /> {t.logout || "Logout"}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* TAB 1: EXPLORE & SERVICES */}
            {activeTab === "explore" && (
                <main className="dashboard-main-content">

                    {/* HERO & AI SMART MATCHING */}
                    <section className="dashboard-hero-card">
                        <div className="hero-left-area">
                            <div className="ai-tag-pill">
                                <Bot size={16} className="ai-bot-icon" />
                                <span>Cooperative AI Smart Matching & Fair Opportunity</span>
                            </div>

                            <h1>
                                Trusted Local Services,
                                <br />
                                <span className="hero-gradient-text">Empowered by Cooperatives.</span>
                            </h1>

                            <p className="hero-subtext">
                                Tell our AI what you need. We match you with verified, highly rated local specialists with transparent pricing and fair gig distribution.
                            </p>

                            {/* EMERGENCY TOGGLE */}
                            <div className="emergency-banner-card">
                                <div className="emergency-text-group">
                                    <div className={`flame-icon-box ${isEmergency ? "active" : ""}`}>
                                        <Flame size={20} />
                                    </div>
                                    <div>
                                        <strong>{t.emergencyService || "Emergency Service"}</strong>
                                        <p>Priority dispatch for urgent pipe leaks, electrical faults & breakdowns</p>
                                    </div>
                                </div>
                                <label className="switch-toggle" title="Toggle Emergency Priority">
                                    <input
                                        type="checkbox"
                                        checked={isEmergency}
                                        onChange={(e) => setIsEmergency(e.target.checked)}
                                    />
                                    <span className="slider-round"></span>
                                </label>
                            </div>

                            {/* AI SEARCH BOX */}
                            <div className="ai-search-container">
                                <div className="search-input-wrapper">
                                    <Search size={20} className="search-icon-inside" />
                                    <textarea
                                        value={request}
                                        onChange={(e) => setRequest(e.target.value)}
                                        placeholder="What service do you need? (e.g. 'I need an electrician urgently for a wiring issue in Bhopal')"
                                        rows={2}
                                    />
                                </div>
                                <button
                                    className="find-match-btn"
                                    onClick={() => handleSmartMatch()}
                                    disabled={aiLoading}
                                    type="button"
                                >
                                    {aiLoading ? (
                                        <>
                                            <RefreshCw size={17} className="spin-icon" />
                                            <span>Matching...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={17} />
                                            <span>Find Best Match</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {aiError && (
                                <div className="ai-error-banner">
                                    <AlertCircle size={16} />
                                    <span>{aiError}</span>
                                </div>
                            )}

                            {/* QUICK PROMPT SUGGESTIONS */}
                            <div className="quick-suggestions-row">
                                <span className="quick-label">Try asking:</span>
                                <button
                                    type="button"
                                    className="prompt-chip"
                                    onClick={() => handleSmartMatch("Urgent plumber for pipe leak in bathroom")}
                                >
                                    🔧 Pipe Leak Repair
                                </button>
                                <button
                                    type="button"
                                    className="prompt-chip"
                                    onClick={() => handleSmartMatch("Need an electrician for wiring and fuse repair")}
                                >
                                    ⚡ Electrician for Wiring
                                </button>
                                <button
                                    type="button"
                                    className="prompt-chip"
                                    onClick={() => handleSmartMatch("Deep house cleaning for 2BHK flat")}
                                >
                                    ✨ Home Deep Cleaning
                                </button>
                                <button
                                    type="button"
                                    className="prompt-chip"
                                    onClick={() => handleSmartMatch("Experienced carpenter to fix wooden door")}
                                >
                                    🚪 Carpenter Door Fix
                                </button>
                            </div>
                        </div>

                        {/* HERO RIGHT HIGHLIGHTS */}
                        <div className="hero-right-visual">
                            <div className="glass-benefit-card top-card">
                                <div className="benefit-icon-circle green">
                                    <ShieldCheck size={22} />
                                </div>
                                <div>
                                    <strong>100% Cooperative Verified</strong>
                                    <span>Certified skills & background-checked workers</span>
                                </div>
                            </div>

                            <div className="glass-benefit-card mid-card">
                                <div className="benefit-icon-circle blue">
                                    <HeartHandshake size={22} />
                                </div>
                                <div>
                                    <strong>Fair Opportunity Score</strong>
                                    <span>Algorithms distribute jobs equitably among workers</span>
                                </div>
                            </div>

                            <div className="glass-benefit-card bot-card">
                                <div className="benefit-icon-circle amber">
                                    <Clock3 size={22} />
                                </div>
                                <div>
                                    <strong>Live 5-Stage Tracker</strong>
                                    <span>Track your service in real time from start to completion</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* AI MATCH RESULT PANEL (When Triggered) */}
                    {aiResult && (
                        <section className="ai-results-showcase">
                            <div className="ai-results-header">
                                <div className="ai-header-left">
                                    <span className="pill-badge ai-badge-glow">
                                        <Bot size={15} /> AI Smart Match Results
                                    </span>
                                    <h2>Top Recommended Specialists for You</h2>
                                </div>
                                <div className="match-confidence-badge">
                                    <Sparkles size={15} />
                                    <span>{aiConfidence}% Match Confidence</span>
                                </div>
                            </div>

                            {/* Analysis Meta Bar */}
                            <div className="ai-analysis-meta-bar">
                                <div className="analysis-item">
                                    <span className="label">Detected Service</span>
                                    <strong>{aiResult.service || "General"}</strong>
                                </div>
                                <div className="analysis-item">
                                    <span className="label">Urgency Level</span>
                                    <span className={`urgency-pill ${aiResult.priority === "Emergency" ? "emergency" : "normal"}`}>
                                        {aiResult.priority === "Emergency" ? "🚨 Urgent / Emergency" : "Standard Dispatch"}
                                    </span>
                                </div>
                                <div className="analysis-item">
                                    <span className="label">Service Location</span>
                                    <strong>{aiResult.location || userLocation}</strong>
                                </div>
                                <div className="analysis-item">
                                    <span className="label">Estimated Time</span>
                                    <strong>{aiResult.duration || "1-2 Hours"}</strong>
                                </div>
                            </div>

                            {/* Matched Workers Cards Grid */}
                            {aiMatchedWorkers.length > 0 ? (
                                <div className="matched-workers-grid">
                                    {aiMatchedWorkers.map((worker, idx) => (
                                        <div key={worker._id || idx} className="matched-worker-card">
                                            <div className="match-rank-badge">
                                                #{idx + 1} AI Pick
                                            </div>

                                            <div className="worker-header-row">
                                                <div className="worker-avatar-large">
                                                    {worker.photo ? (
                                                        <img src={worker.photo} alt={worker.name} />
                                                    ) : (
                                                        <UserRound size={28} />
                                                    )}
                                                    <span className={`status-dot ${worker.availability ? "online" : "offline"}`}></span>
                                                </div>

                                                <div className="worker-details-head">
                                                    <h3>{worker.name}</h3>
                                                    <span className="coop-name-tag">
                                                        <Building2 size={13} />
                                                        {worker.cooperativeName || "Cooperative Society"}
                                                    </span>
                                                    <div className="worker-rating-row">
                                                        <Star size={14} className="star-filled" />
                                                        <strong>{worker.rating || "4.8"}</strong>
                                                        <span className="exp-text">• {worker.experience || 3}+ yrs experience</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div className="worker-badges-row">
                                                <span className="badge-chip verified">
                                                    <ShieldCheck size={12} /> Verified
                                                </span>
                                                <span className="badge-chip skill">
                                                    <BadgeCheck size={12} /> Certified Skill
                                                </span>
                                            </div>

                                            {/* Fair Opportunity Score */}
                                            <div className="opp-score-box">
                                                <div className="opp-score-header">
                                                    <span>Fair Opportunity Score</span>
                                                    <strong>{worker.opportunityScore || 85}/100</strong>
                                                    <button
                                                        type="button"
                                                        className="info-icon-btn"
                                                        onClick={() => setScoreInfoWorker(worker)}
                                                        title="How is this score calculated?"
                                                    >
                                                        <Info size={14} />
                                                    </button>
                                                </div>
                                                <div className="opp-progress-bar">
                                                    <div
                                                        className="opp-progress-fill"
                                                        style={{ width: `${worker.opportunityScore || 85}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="matched-card-footer">
                                                <div className="price-label-box">
                                                    <small>Standard Visit</small>
                                                    <strong>₹350</strong>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="book-now-btn"
                                                    onClick={() => openBookingModal(worker)}
                                                >
                                                    <Calendar size={15} />
                                                    Book This Worker
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="ai-empty-state">
                                    <AlertCircle size={24} />
                                    <p>No direct worker was matched specifically. Showing all active specialists below.</p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* 12 SERVICE CATEGORIES FILTER */}
                    <section className="categories-filter-strip">
                        <div className="section-title-row">
                            <div>
                                <span className="section-eyebrow">BROWSE ALL SERVICES</span>
                                <h2>Service Categories</h2>
                            </div>
                            <span className="category-count-label">12 Available Categories</span>
                        </div>

                        <div className="categories-horizontal-scroll">
                            {ALL_CATEGORIES.map((cat) => {
                                const IconComponent = cat.icon;
                                const isActive = selectedCategory === cat.id;

                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`category-pill-btn ${isActive ? "active" : ""}`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        <IconComponent size={17} />
                                        <span>{cat.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* INTERACTIVE SERVICE MAP */}
                    <ServiceMap
                        userLocation={userLocation}
                        workers={displayedWorkers}
                        onSelectWorker={openBookingModal}
                        title="Workers Near You"
                        subtitle="Find trusted local professionals around your location."
                        height="380px"
                    />

                    {/* WORKERS DIRECTORY */}
                    <section className="workers-directory-section">
                        <div className="section-title-row">
                            <div>
                                <span className="section-eyebrow">COOPERATIVE NETWORK</span>
                                <h2>
                                    {selectedCategory === "all" ? "Available Specialists" : `${selectedCategory} Specialists`}
                                </h2>
                            </div>
                            <span className="workers-count-badge">
                                {displayedWorkers.length} Workers Available
                            </span>
                        </div>

                        {loadingNetwork ? (
                            <div className="loading-state-card">
                                <RefreshCw size={28} className="spin-icon" />
                                <p>Loading cooperative specialists...</p>
                            </div>
                        ) : displayedWorkers.length === 0 ? (
                            <div className="empty-workers-card">
                                <Users size={40} className="empty-icon" />
                                <h3>No specialists found</h3>
                                <p>Try selecting another service category or resetting your filters.</p>
                                <button
                                    type="button"
                                    className="reset-filter-btn"
                                    onClick={() => { setSelectedCategory("all"); setIsEmergency(false); }}
                                >
                                    View All Categories
                                </button>
                            </div>
                        ) : (
                            <div className="directory-workers-grid">
                                {displayedWorkers.map((worker) => (
                                    <div key={worker._id} className="directory-worker-card">
                                        <div className="card-top-header">
                                            <div className="avatar-wrapper">
                                                {worker.photo ? (
                                                    <img src={worker.photo} alt={worker.name} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {worker.name ? worker.name[0].toUpperCase() : "W"}
                                                    </div>
                                                )}
                                                <span className={`status-indicator ${worker.availability ? "available" : "busy"}`} />
                                            </div>

                                            <div className="rating-pill">
                                                <Star size={13} className="star-filled" />
                                                <span>{worker.rating || "4.8"}</span>
                                            </div>
                                        </div>

                                        <div className="worker-main-info">
                                            <h3>{worker.name}</h3>
                                            <div className="coop-subtext">
                                                <Building2 size={13} />
                                                <span>{worker.cooperativeId?.societyName || "Cooperative Society"}</span>
                                            </div>

                                            <div className="worker-meta-specs">
                                                <span className="spec-item">
                                                    <MapPin size={13} /> {worker.location || userLocation}
                                                </span>
                                                <span className="spec-item">
                                                    <Briefcase size={13} /> {worker.experience || 3} yrs exp
                                                </span>
                                            </div>

                                            {/* Skill Badges */}
                                            <div className="skill-tags-group">
                                                {(Array.isArray(worker.skills) ? worker.skills : [worker.skills || "General"]).slice(0, 3).map((skill, sIdx) => (
                                                    <span key={sIdx} className="skill-tag">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Fair Opportunity Score */}
                                            <div className="opp-score-compact">
                                                <div className="score-top-line">
                                                    <span>Fair Opportunity Score</span>
                                                    <strong>{worker.opportunityScore || 80}/100</strong>
                                                    <button
                                                        type="button"
                                                        className="info-btn-mini"
                                                        onClick={() => setScoreInfoWorker(worker)}
                                                    >
                                                        <Info size={13} />
                                                    </button>
                                                </div>
                                                <div className="score-meter">
                                                    <div
                                                        className="score-fill"
                                                        style={{ width: `${worker.opportunityScore || 80}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-bottom-actions">
                                            <div className="price-block">
                                                <small>Service Rate</small>
                                                <strong>₹350</strong>
                                            </div>
                                            <button
                                                type="button"
                                                className="primary-book-btn"
                                                onClick={() => openBookingModal(worker)}
                                            >
                                                <Calendar size={15} />
                                                Book Service
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            )}

            {/* TAB 2: MY BOOKINGS & 5-STAGE LIVE TRACKER */}
            {activeTab === "bookings" && (
                <main className="dashboard-main-content">
                    <section className="my-bookings-container">
                        <div className="section-title-row">
                            <div>
                                <span className="section-eyebrow">SERVICE MANAGEMENT</span>
                                <h2>{t.myBookings || "My Bookings & Service Tracker"}</h2>
                            </div>
                            <button
                                type="button"
                                className="refresh-bookings-btn"
                                onClick={fetchAllData}
                            >
                                <RefreshCw size={15} />
                                Refresh Status
                            </button>
                        </div>

                        {bookings.length === 0 ? (
                            <div className="empty-bookings-box">
                                <Calendar size={48} className="empty-cal-icon" />
                                <h3>No Bookings Yet</h3>
                                <p>You haven't requested any services yet. Explore our cooperative directory to book a certified specialist.</p>
                                <button
                                    type="button"
                                    className="explore-cta-btn"
                                    onClick={() => setActiveTab("explore")}
                                >
                                    Explore Available Services
                                </button>
                            </div>
                        ) : (
                            <div className="bookings-cards-stack">
                                {bookings.map((booking) => {
                                    // Status progression mapping (5 stages)
                                    const stages = ["Pending", "Accepted", "OnTheWay", "InProgress", "Completed"];
                                    const currentIdx = stages.indexOf(booking.status);
                                    const isCancelledOrRejected = booking.status === "Cancelled" || booking.status === "Rejected";

                                    return (
                                        <div key={booking._id} className="booking-tracker-card">
                                            {/* Booking Header */}
                                            <div className="booking-card-top-bar">
                                                <div className="service-info-group">
                                                    <div className="service-icon-square">
                                                        <Wrench size={22} />
                                                    </div>
                                                    <div>
                                                        <div className="service-name-row">
                                                            <h3>{booking.service || "Household Service"}</h3>
                                                            {booking.isEmergency && (
                                                                <span className="emergency-tag-mini">
                                                                    <Flame size={12} /> Emergency
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="booking-ref-number">
                                                            Ref ID: #{booking._id.slice(-8).toUpperCase()} • Booked on {new Date(booking.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="booking-price-badge">
                                                    <small>Total Amount</small>
                                                    <strong>₹{booking.amount || 350}</strong>
                                                    <span className={`payment-pill ${booking.paymentStatus === "Paid" ? "paid" : "pending"}`}>
                                                        {booking.paymentStatus === "Paid" ? "✓ Paid" : "Payment Pending"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Worker & Location Meta */}
                                            <div className="booking-details-strip">
                                                <div className="detail-cell">
                                                    <UserRound size={15} />
                                                    <span>Worker: <strong>{booking.workerId?.name || "Assigned Specialist"}</strong></span>
                                                </div>
                                                <div className="detail-cell">
                                                    <MapPin size={15} />
                                                    <span>Address: <strong>{booking.address || userLocation}</strong></span>
                                                </div>
                                                <div className="detail-cell">
                                                    <Calendar size={15} />
                                                    <span>Scheduled: <strong>{booking.date} at {booking.time}</strong></span>
                                                </div>
                                            </div>

                                            {/* 5-STAGE SERVICE PROGRESS TRACKER */}
                                            <div className="service-progress-container">
                                                <h4>Live Service Tracker</h4>

                                                {isCancelledOrRejected ? (
                                                    <div className="status-cancelled-banner">
                                                        <AlertCircle size={18} />
                                                        <span>This booking was {booking.status}.</span>
                                                    </div>
                                                ) : (
                                                    <div className="tracker-steps-line">
                                                        <div className={`step-node ${currentIdx >= 0 ? "done" : ""}`}>
                                                            <div className="step-circle">{currentIdx > 0 ? "✓" : "1"}</div>
                                                            <span className="step-label">Booking Created</span>
                                                        </div>
                                                        <div className={`step-node ${currentIdx >= 1 ? "done" : ""}`}>
                                                            <div className="step-circle">{currentIdx > 1 ? "✓" : "2"}</div>
                                                            <span className="step-label">Worker Accepted</span>
                                                        </div>
                                                        <div className={`step-node ${currentIdx >= 2 ? "done" : ""}`}>
                                                            <div className="step-circle">{currentIdx > 2 ? "✓" : "3"}</div>
                                                            <span className="step-label">On The Way</span>
                                                        </div>
                                                        <div className={`step-node ${currentIdx >= 3 ? "done" : ""}`}>
                                                            <div className="step-circle">{currentIdx > 3 ? "✓" : "4"}</div>
                                                            <span className="step-label">In Progress</span>
                                                        </div>
                                                        <div className={`step-node ${currentIdx >= 4 ? "done" : ""}`}>
                                                            <div className="step-circle">{currentIdx >= 4 ? "✓" : "5"}</div>
                                                            <span className="step-label">Completed</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="booking-card-actions-bar">
                                                {booking.status === "Pending" && (
                                                    <button
                                                        type="button"
                                                        className="cancel-btn"
                                                        onClick={() => handleCancelBooking(booking._id)}
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                )}

                                                {booking.status === "Completed" && booking.paymentStatus !== "Paid" && (
                                                    <button
                                                        type="button"
                                                        className="pay-now-btn"
                                                        onClick={() => setPaymentBooking(booking)}
                                                    >
                                                        <CreditCard size={15} />
                                                        Pay Now (₹{booking.amount || 350})
                                                    </button>
                                                )}

                                                {booking.status === "Completed" && (
                                                    <button
                                                        type="button"
                                                        className="review-btn"
                                                        onClick={() => {
                                                            setReviewBooking(booking);
                                                            setReviewForm({ rating: 5, comment: "", workPhoto: "" });
                                                            setReviewSuccess("");
                                                        }}
                                                    >
                                                        <Star size={15} />
                                                        Rate & Review Service
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </main>
            )}

            {/* MODAL 1: BOOKING MODAL */}
            {bookingWorker && (
                <div className="dashboard-modal-overlay">
                    <div className="dashboard-modal-card">
                        <div className="modal-header">
                            <div>
                                <h2>Book Cooperative Specialist</h2>
                                <p>Confirm scheduling details with {bookingWorker.name}</p>
                            </div>
                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={() => setBookingWorker(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {bookingSuccess && (
                            <div className="modal-alert success">
                                <CheckCircle2 size={18} />
                                <span>{bookingSuccess}</span>
                            </div>
                        )}

                        {bookingError && (
                            <div className="modal-alert error">
                                <AlertCircle size={18} />
                                <span>{bookingError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateBooking} className="modal-form">
                            <div className="form-group-grid">
                                <div className="form-input-field">
                                    <label>Service Requirement</label>
                                    <input
                                        type="text"
                                        value={bookingForm.service}
                                        onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-input-field">
                                    <label>Estimated Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={bookingForm.amount}
                                        onChange={(e) => setBookingForm({ ...bookingForm, amount: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group-grid">
                                <div className="form-input-field">
                                    <label>Service Date</label>
                                    <input
                                        type="date"
                                        value={bookingForm.date}
                                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-input-field">
                                    <label>Preferred Time</label>
                                    <input
                                        type="text"
                                        value={bookingForm.time}
                                        onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                                        placeholder="e.g. 10:30 AM"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-input-field">
                                <label>Service Address / Location</label>
                                <input
                                    type="text"
                                    value={bookingForm.address}
                                    onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                                    placeholder="Enter street, house number, area"
                                    required
                                />
                            </div>

                            <div className="form-input-field">
                                <label>Special Instructions / Notes</label>
                                <textarea
                                    value={bookingForm.notes}
                                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                                    placeholder="Describe specific issues (e.g., kitchen sink pipe leakage, bring spare parts)"
                                    rows={2}
                                />
                            </div>

                            <div className="modal-checkbox-row">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={bookingForm.isEmergency}
                                        onChange={(e) => setBookingForm({ ...bookingForm, isEmergency: e.target.checked })}
                                    />
                                    <span>🚨 Mark as Emergency Request (Priority Dispatch)</span>
                                </label>
                            </div>

                            <div className="modal-footer-actions">
                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={() => setBookingWorker(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-submit-btn"
                                    disabled={bookingSubmitting}
                                >
                                    {bookingSubmitting ? "Placing Booking..." : "Confirm & Book Service"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: FAIR OPPORTUNITY SCORE INFO */}
            {scoreInfoWorker && (
                <div className="dashboard-modal-overlay">
                    <div className="dashboard-modal-card">
                        <div className="modal-header">
                            <div>
                                <h2>Fair Opportunity Score Breakdown</h2>
                                <p>Algorithmic explanation for {scoreInfoWorker.name}</p>
                            </div>
                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={() => setScoreInfoWorker(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="score-modal-body">
                            <div className="score-badge-circle">
                                <strong>{scoreInfoWorker.opportunityScore || 85}</strong>
                                <span>/ 100</span>
                            </div>

                            <h3>Why this score?</h3>
                            <p className="score-explanation">
                                SkillDnest calculates the Fair Opportunity Score to balance customer quality with equitable gig distribution among cooperative members:
                            </p>

                            <div className="score-breakdown-list">
                                <div className="breakdown-item">
                                    <div className="item-title">
                                        <TrendingUp size={16} /> Workload Balance & Queue
                                    </div>
                                    <span className="item-pts">+35 Points</span>
                                </div>
                                <div className="breakdown-item">
                                    <div className="item-title">
                                        <Star size={16} /> Customer Ratings & Satisfaction
                                    </div>
                                    <span className="item-pts">+25 Points</span>
                                </div>
                                <div className="breakdown-item">
                                    <div className="item-title">
                                        <CheckCircle2 size={16} /> Availability & Immediate Response
                                    </div>
                                    <span className="item-pts">+20 Points</span>
                                </div>
                                <div className="breakdown-item">
                                    <div className="item-title">
                                        <Award size={16} /> Experience & Certified Skills
                                    </div>
                                    <span className="item-pts">+20 Points</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer-actions">
                            <button
                                type="button"
                                className="modal-submit-btn full-width"
                                onClick={() => setScoreInfoWorker(null)}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: DIGITAL PAYMENT MODAL */}
            {paymentBooking && (
                <div className="dashboard-modal-overlay">
                    <div className="dashboard-modal-card">
                        <div className="modal-header">
                            <div>
                                <h2>Digital Payment Simulation</h2>
                                <p>Secure service settlement for Ref #{paymentBooking._id.slice(-6).toUpperCase()}</p>
                            </div>
                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={() => setPaymentBooking(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {paymentSuccess ? (
                            <div className="modal-alert success">
                                <CheckCircle2 size={18} />
                                <span>{paymentSuccess}</span>
                            </div>
                        ) : (
                            <form onSubmit={handleProcessPayment} className="modal-form">
                                <div className="payment-amount-display">
                                    <span>Total Payable Amount</span>
                                    <h3>₹{paymentBooking.amount || 350}</h3>
                                </div>

                                <div className="payment-method-selector">
                                    <label>Select Payment Mode</label>
                                    <div className="methods-grid">
                                        <button
                                            type="button"
                                            className={`method-tile ${paymentMethod === "UPI" ? "active" : ""}`}
                                            onClick={() => setPaymentMethod("UPI")}
                                        >
                                            <Zap size={20} />
                                            <span>UPI / QR</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`method-tile ${paymentMethod === "Card" ? "active" : ""}`}
                                            onClick={() => setPaymentMethod("Card")}
                                        >
                                            <CreditCard size={20} />
                                            <span>Debit / Credit Card</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`method-tile ${paymentMethod === "Cash" ? "active" : ""}`}
                                            onClick={() => setPaymentMethod("Cash")}
                                        >
                                            <CircleDollarSign size={20} />
                                            <span>Cash on Completion</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="modal-footer-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setPaymentBooking(null)}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        className="modal-submit-btn"
                                        disabled={paymentSubmitting}
                                    >
                                        {paymentSubmitting ? "Processing..." : `Pay ₹${paymentBooking.amount || 350}`}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 4: RATING & REVIEW MODAL */}
            {reviewBooking && (
                <div className="dashboard-modal-overlay">
                    <div className="dashboard-modal-card">
                        <div className="modal-header">
                            <div>
                                <h2>Rate & Review Completed Service</h2>
                                <p>Help cooperative workers improve their service quality</p>
                            </div>
                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={() => setReviewBooking(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {reviewSuccess ? (
                            <div className="modal-alert success">
                                <CheckCircle2 size={18} />
                                <span>{reviewSuccess}</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitReview} className="modal-form">
                                <div className="rating-stars-picker">
                                    <label>Service Rating</label>
                                    <div className="stars-row">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-btn ${reviewForm.rating >= star ? "active" : ""}`}
                                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-input-field">
                                    <label>Feedback & Comments</label>
                                    <textarea
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                        placeholder="Share your experience (punctuality, workmanship, behavior)..."
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="form-input-field">
                                    <label>Work Photo URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={reviewForm.workPhoto}
                                        onChange={(e) => setReviewForm({ ...reviewForm, workPhoto: e.target.value })}
                                        placeholder="https://example.com/work-photo.jpg"
                                    />
                                </div>

                                <div className="modal-footer-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setReviewBooking(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="modal-submit-btn"
                                        disabled={reviewSubmitting}
                                    >
                                        {reviewSubmitting ? "Submitting..." : "Submit Review"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomerDashboard;