import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  LogOut,
  ShieldCheck,
  Users,
  Wrench,
  CalendarCheck,
  MapPin,
  Phone,
  Building2,
  CheckCircle2,
  Plus,
  ArrowRight,
  UserRound,
  BriefcaseBusiness,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Bell,
  ChevronRight,
  Star,
  TrendingUp,
  Clock3,
  Globe,
  Bot,
  Layers,
  Award,
  Calendar,
  Check,
  Navigation,
  Activity
} from "lucide-react";

import logo from "../assets/Skill D Nest.jpeg";
import api from "../services/api";
import { translations } from "../utils/translations";
import ServiceMap from "../components/ServiceMap";
import "./CooperativeDashboard.css";

function CooperativeDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const t = translations[lang] || translations.en;

  const [society, setSociety] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [allocations, setAllocations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("overview"); // overview, workers, bookings, map, ai-forecast

  const toggleLanguage = () => {
    const next = lang === "en" ? "hi" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Cooperatives
      const coopRes = await api.get("/cooperatives");
      const societies = coopRes.data?.cooperatives || coopRes.data || [];

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const currentSociety =
        societies.find((item) => item.phone && item.phone === user.phone) ||
        societies.find((item) => item._id && user.cooperativeId && item._id === user.cooperativeId) ||
        societies[0] ||
        null;

      setSociety(currentSociety);

      if (currentSociety?._id) {
        // 2. Cooperative Workers
        try {
          const workerRes = await api.get(`/cooperatives/${currentSociety._id}/workers`);
          const workerData = workerRes.data?.workers || workerRes.data || [];
          setWorkers(Array.isArray(workerData) ? workerData : []);
        } catch (err) {
          console.warn("Workers fetch warning:", err.message);
        }
      }

      // 3. Cooperative Bookings
      try {
        const bookingRes = await api.get("/bookings");
        const bookingData = bookingRes.data?.bookings || bookingRes.data || [];
        setBookings(Array.isArray(bookingData) ? bookingData : []);
      } catch (err) {
        console.warn("Bookings fetch warning:", err.message);
      }

      // 4. AI Demand Forecast & Workforce Allocation
      try {
        setAiLoading(true);
        const forecastRes = await api.get("/ai/demand-forecast");
        setForecast(forecastRes.data);

        const allocRes = await api.get("/ai/workforce-allocation");
        setAllocations(allocRes.data);
      } catch (aiErr) {
        console.warn("AI intelligence warning:", aiErr.message);
      } finally {
        setAiLoading(false);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.response?.data?.message || "Unable to load cooperative dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [location.key]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/cooperative-login");
  };

  const handleAddWorker = () => {
    navigate("/add-worker", {
      state: { cooperativeId: society?._id }
    });
  };

  const handleWorkerManagement = () => {
    navigate("/worker-management", {
      state: { cooperativeId: society?._id }
    });
  };

  // Accept / Complete booking from cooperative side
  const handleBookingAction = async (bookingId, action) => {
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} booking.`);
    }
  };

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workers;

    return workers.filter((worker) => {
      const name = String(worker.name || "").toLowerCase();
      const skills = Array.isArray(worker.skills)
        ? worker.skills.join(" ").toLowerCase()
        : String(worker.skills || "").toLowerCase();
      const phone = String(worker.phone || "").toLowerCase();
      return name.includes(query) || skills.includes(query) || phone.includes(query);
    });
  }, [workers, search]);

  const societyName = society?.societyName || society?.name || "Cooperative Society";
  const isVerified = society?.verificationStatus === "Verified";
  const activeWorkersCount = workers.filter(w => w.availability).length;
  const completedBookingsCount = bookings.filter(b => b.status === "Completed").length;
  const workersWithCoords = workers.filter(w => w.latitude && w.longitude);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-card">
          <img src={logo} alt="SkillDnest Logo" className="loading-brand-img" />
          <div className="loading-spinner">
            <RefreshCw size={24} />
          </div>
          <h2>Loading SkillDnest Cooperative Portal</h2>
          <p>Connecting with cooperative registry and workforce intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cooperative-dashboard">
      {/* NAVBAR */}
      <header className="dashboard-navbar">
        <div className="navbar-left">
          <button className="brand" onClick={() => navigate("/cooperative-dashboard")}>
            <img src={logo} alt="SkillDnest Logo" className="navbar-logo-img" />
            <div>
              <div className="brand-name">{t.brandName || "SkillDnest"}</div>
              <div className="brand-tagline">Cooperative Administration Portal</div>
            </div>
          </button>
        </div>

        <div className="navbar-center">
          <div className="dashboard-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search workers, skills, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>×</button>
            )}
          </div>
        </div>

        <div className="navbar-right">
          <button className="nav-action-pill" onClick={toggleLanguage} title="Change Language">
            <Globe size={16} />
            <span>{lang === "en" ? "हिन्दी" : "English"}</span>
          </button>

          <div className="portal-label">
            <Building2 size={17} />
            <span>{societyName}</span>
          </div>

          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            {t.logout}
          </button>
        </div>
      </header>

      {/* SUBNAV TABS */}
      <div className="coop-subnav-tabs">
        <button
          className={activeSection === "overview" ? "subnav-btn active" : "subnav-btn"}
          onClick={() => setActiveSection("overview")}
        >
          <TrendingUp size={16} /> Overview & Stats
        </button>
        <button
          className={activeSection === "workers" ? "subnav-btn active" : "subnav-btn"}
          onClick={() => setActiveSection("workers")}
        >
          <Users size={16} /> Workforce ({workers.length})
        </button>
        <button
          className={activeSection === "bookings" ? "subnav-btn active" : "subnav-btn"}
          onClick={() => setActiveSection("bookings")}
        >
          <Calendar size={16} /> Bookings ({bookings.length})
        </button>
        <button
          className={activeSection === "map" ? "subnav-btn active" : "subnav-btn"}
          onClick={() => setActiveSection("map")}
        >
          <Navigation size={16} /> Workforce Map
        </button>
        <button
          className={activeSection === "ai-forecast" ? "subnav-btn active" : "subnav-btn"}
          onClick={() => setActiveSection("ai-forecast")}
        >
          <Sparkles size={16} /> {t.aiForecast || "AI Forecast & Allocation"}
        </button>
      </div>

      <main className="dashboard-main">
        {error && (
          <div className="dashboard-error">
            <div>
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
            <button onClick={loadDashboard}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {/* SECTION 1: OVERVIEW & STATS */}
        {activeSection === "overview" && (
          <>
            {/* WELCOME STRIP */}
            <section className="dashboard-welcome-strip">
              <div>
                <div className="welcome-small">COOPERATIVE SERVICES MANAGEMENT</div>
                <h1>
                  Welcome to <span>{societyName}</span>
                </h1>
                <p>
                  District: <strong>{society?.district || "Local Region"}</strong> • Registration: <strong>{society?.registrationNumber || "REG-COOP-001"}</strong>
                </p>
              </div>

              <div className="welcome-actions">
                <button className="secondary-dashboard-btn" onClick={handleWorkerManagement}>
                  <Users size={17} />
                  Manage Workforce
                </button>
                <button className="primary-dashboard-btn" onClick={handleAddWorker}>
                  <Plus size={18} />
                  Add New Worker
                </button>
              </div>
            </section>

            {/* KEY METRICS CARDS */}
            <section className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon green">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <span>Society Verification</span>
                  <strong>{isVerified ? "Verified Society" : "Pending Verification"}</strong>
                </div>
                <CheckCircle2 className="stat-check" size={19} />
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">
                  <Users size={22} />
                </div>
                <div>
                  <span>Total Workers</span>
                  <strong>{workers.length}</strong>
                </div>
                <TrendingUp className="stat-check" size={19} />
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <span>Active Bookings</span>
                  <strong>{bookings.length}</strong>
                </div>
                <Clock3 className="stat-check" size={19} />
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">
                  <Award size={22} />
                </div>
                <div>
                  <span>Completed Jobs</span>
                  <strong>{completedBookingsCount}</strong>
                </div>
                <Star className="stat-check" size={19} />
              </div>
            </section>

            {/* EMBEDDED WORKFORCE MAP OVERVIEW */}
            <ServiceMap
              title="Workforce Location Overview"
              subtitle={`Geospatial deployment of ${workers.length} registered cooperative specialists in ${society?.district || "your region"}.`}
              workers={workers}
              userLocation={society?.district || "Satna, MP"}
              height="360px"
            />

            {/* AI DEMAND FORECASTING HIGHLIGHT */}
            <section className="dashboard-forecast-banner">
              <div className="forecast-banner-header">
                <div className="ai-badge-pill">
                  <Bot size={17} />
                  <span>Gemini AI Demand Intelligence</span>
                </div>
                <button className="text-link-btn" onClick={() => setActiveSection("ai-forecast")}>
                  View Full Forecast & Allocation Insights <ArrowRight size={15} />
                </button>
              </div>

              <div className="forecast-quick-cards">
                {forecast?.forecasts?.slice(0, 3).map((item, idx) => (
                  <div className="forecast-mini-card" key={idx}>
                    <div className="forecast-trend-tag">
                      <TrendingUp size={14} /> {item.trend}
                    </div>
                    <h3>{item.category}</h3>
                    <p>{item.reason}</p>
                    <div className="forecast-action-tip">
                      💡 {item.recommendedAllocation}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* SECTION 2: WORKFORCE MANAGEMENT */}
        {activeSection === "workers" && (
          <section className="coop-workers-section">
            <div className="section-header-row">
              <div>
                <h2>Cooperative Workforce ({filteredWorkers.length})</h2>
                <p>All workers registered under {societyName} with skills, contact and availability.</p>
              </div>
              <button className="primary-dashboard-btn" onClick={handleAddWorker}>
                <Plus size={16} /> Add Worker
              </button>
            </div>

            {filteredWorkers.length === 0 ? (
              <div className="empty-state-box">
                <Users size={40} />
                <h3>No workers found</h3>
                <p>Register workers under your cooperative to start receiving community bookings.</p>
                <button onClick={handleAddWorker}>+ Register Worker</button>
              </div>
            ) : (
              <div className="coop-workers-table-card">
                <table className="coop-table">
                  <thead>
                    <tr>
                      <th>Worker</th>
                      <th>Skills</th>
                      <th>Location</th>
                      <th>Experience</th>
                      <th>Rating</th>
                      <th>Availability</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker) => {
                      const skills = Array.isArray(worker.skills)
                        ? worker.skills.join(", ")
                        : worker.skills || "General";

                      return (
                        <tr key={worker._id}>
                          <td>
                            <div className="table-worker-cell">
                              <div className="table-avatar">
                                {worker.photo ? <img src={worker.photo} alt={worker.name} /> : <UserRound size={20} />}
                              </div>
                              <div>
                                <strong>{worker.name}</strong>
                                <small>{worker.phone}</small>
                              </div>
                            </div>
                          </td>
                          <td><span className="table-skill-badge">{skills}</span></td>
                          <td>{worker.location || "Local District"}</td>
                          <td>{worker.experience || 1} yrs</td>
                          <td>⭐ {Number(worker.rating || 4.8).toFixed(1)}</td>
                          <td>
                            <span className={`status-tag ${worker.availability ? "available" : "offline"}`}>
                              {worker.availability ? "Available" : "Busy"}
                            </span>
                          </td>
                          <td>
                            <span className="status-tag verified">
                              <CheckCircle2 size={12} /> {worker.verificationStatus || "Verified"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: BOOKINGS OVERVIEW */}
        {activeSection === "bookings" && (
          <section className="coop-bookings-section">
            <div className="section-header-row">
              <div>
                <h2>Customer Service Bookings ({bookings.length})</h2>
                <p>Track all active and past service requests for workers in your cooperative.</p>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="empty-state-box">
                <Calendar size={40} />
                <h3>No customer bookings yet</h3>
                <p>When customers match and book services with your workers, they will appear here in real-time.</p>
              </div>
            ) : (
              <div className="coop-bookings-grid">
                {bookings.map((booking) => (
                  <div className="coop-booking-card" key={booking._id}>
                    <div className="coop-booking-header">
                      <div>
                        <h3>{booking.service}</h3>
                        <small>Booking #{booking._id.slice(-8)}</small>
                      </div>
                      <span className={`status-pill ${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="coop-booking-details">
                      <p><strong>Customer:</strong> {booking.customerId?.name || "Customer"} ({booking.customerId?.phone || "Phone hidden"})</p>
                      <p><strong>Worker:</strong> {booking.workerId?.name || "Assigned Worker"}</p>
                      <p><strong>Schedule:</strong> {booking.date} at {booking.time}</p>
                      <p><strong>Address:</strong> {booking.address}</p>
                      <p><strong>Amount:</strong> ₹{booking.amount} ({booking.paymentStatus === "Paid" ? "✓ Paid" : "Pending"})</p>
                    </div>

                    {booking.status === "Pending" && (
                      <div className="booking-control-actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleBookingAction(booking._id, "accept")}
                        >
                          <Check size={14} /> Accept Booking
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleBookingAction(booking._id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 4: WORKFORCE MAP VIEW */}
        {activeSection === "map" && (
          <section className="coop-map-section">
            <div className="section-header-row">
              <div>
                <h2>Workforce Location Overview</h2>
                <p>Interactive geographic distribution of your registered cooperative members.</p>
              </div>
            </div>

            <ServiceMap
              title="Workforce Location Overview"
              subtitle={`Showing live deployment locations of cooperative specialists.`}
              workers={workers}
              userLocation={society?.district || "Satna, MP"}
              height="500px"
            />
          </section>
        )}

        {/* SECTION 5: AI FORECAST & WORKFORCE ALLOCATION */}
        {activeSection === "ai-forecast" && (
          <section className="coop-ai-section">
            <div className="section-header-row">
              <div>
                <div className="ai-badge-pill">
                  <Sparkles size={16} />
                  <span>Gemini Demand & Workforce Intelligence</span>
                </div>
                <h2>AI Demand Forecasting & Optimal Allocation</h2>
                <p>Data-driven insights to help cooperative societies optimize workforce dispatch and maximize member income.</p>
              </div>
            </div>

            {aiLoading ? (
              <div className="empty-state-box">
                <span className="spinner"></span>
                <p>Generating AI demand models from historical service trends...</p>
              </div>
            ) : (
              <>
                {/* FORECAST CARDS */}
                <div className="forecast-cards-grid">
                  {forecast?.forecasts?.map((item, idx) => (
                    <div className="forecast-card-detailed" key={idx}>
                      <div className="forecast-card-top">
                        <span className="category-tag">{item.category}</span>
                        <span className="trend-badge">{item.trend}</span>
                      </div>
                      <h4>Market Demand Analysis</h4>
                      <p className="reason-text">{item.reason}</p>
                      <div className="allocation-recommendation">
                        <strong>AI Recommendation:</strong>
                        <p>{item.recommendedAllocation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* WORKFORCE ALLOCATION SUGGESTIONS */}
                <div className="workforce-allocation-card">
                  <div className="allocation-header">
                    <Bot size={22} />
                    <div>
                      <h3>AI-Assisted Dispatch & Allocation Suggestions</h3>
                      <p>{allocations?.summary || "Worker queue optimized by Fair Opportunity Score & Skill Rating."}</p>
                    </div>
                  </div>

                  <div className="allocation-table-wrapper">
                    <table className="allocation-table">
                      <thead>
                        <tr>
                          <th>Worker</th>
                          <th>Skill Focus</th>
                          <th>Rating</th>
                          <th>Suggested Role / Dispatch Priority</th>
                          <th>Priority Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations?.allocations?.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.workerName}</strong></td>
                            <td>{item.skills}</td>
                            <td>⭐ {item.rating || 4.8}</td>
                            <td>
                              <span className="role-tag">{item.recommendedRole}</span>
                            </td>
                            <td>
                              <strong style={{ color: "#0f6b5b" }}>{item.priorityScore}%</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default CooperativeDashboard;