const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
// IMPORTANT:
// dotenv ko routes import karne se pehle load karna hai
dotenv.config();

const connectDB = require("./config/db");

// Routes
const workerRoutes = require("./routes/workerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const cooperativeRoutes = require("./routes/cooperativeRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const smartMatchRoutes = require("./routes/smartMatchRoutes");

// Connect MongoDB
connectDB();

const app = express();

// Disable tech fingerprinting
app.disable("x-powered-by");

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Home route / Health check
app.get("/", (req, res) => {
    res.status(200).json({
        status: "online",
        platform: "SkillNest Cooperative Gig Platform API",
        version: "2.0.0",
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use("/api/workers", workerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cooperatives", cooperativeRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

// AI + Worker Smart Matching
app.use("/api", smartMatchRoutes);

// Centralized Production Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err.stack || err.message);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        message: err.message || "An internal server error occurred",
        error: process.env.NODE_ENV === "production" ? "Server error" : err.message
    });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});