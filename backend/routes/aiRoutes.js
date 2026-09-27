const express = require("express");
const {
    analyzeServiceRequest,
    forecastDemand,
    suggestWorkforceAllocation
} = require("../utils/aiService");

const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// 1. AI SERVICE REQUEST ANALYSIS
router.post("/analyze", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Service request message is required"
            });
        }

        const result = await analyzeServiceRequest(message);

        res.status(200).json({
            message: "Service request analyzed successfully",
            result
        });
    } catch (error) {
        console.error("AI Analysis Error:", error.message);
        res.status(500).json({
            message: "Error analyzing service request",
            error: error.message
        });
    }
});

// 2. AI DEMAND FORECASTING
router.get("/demand-forecast", async (req, res) => {
    try {
        const bookings = await Booking.find().limit(200);
        const forecast = await forecastDemand(bookings);

        res.status(200).json({
            message: "AI Demand Forecast generated successfully",
            ...forecast
        });
    } catch (error) {
        console.error("Demand forecast error:", error.message);
        res.status(500).json({
            message: "Error generating demand forecast",
            error: error.message
        });
    }
});

// 3. AI WORKFORCE ALLOCATION
router.get("/workforce-allocation", async (req, res) => {
    try {
        const workers = await Worker.find();
        const pendingBookings = await Booking.find({ status: "Pending" });
        const allocation = await suggestWorkforceAllocation(workers, pendingBookings);

        res.status(200).json({
            message: "AI Workforce Allocation calculated successfully",
            ...allocation
        });
    } catch (error) {
        console.error("Workforce allocation error:", error.message);
        res.status(500).json({
            message: "Error calculating workforce allocation",
            error: error.message
        });
    }
});

module.exports = router;