const express = require("express");

const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// 1. CREATE PAYMENT
router.post("/", protect, async (req, res) => {
    try {
        const {
            bookingId,
            paymentMethod
        } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                message: "Booking ID is required"
            });
        }

        // Find customer profile from logged-in user
        const customer = await Customer.findOne({
            userId: req.user.id
        });

        // Find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        // Check existing payment
        const existingPayment = await Payment.findOne({
            bookingId
        });

        if (existingPayment) {
            return res.status(200).json({
                message: "Payment record retrieved",
                payment: existingPayment
            });
        }

        const payment = await Payment.create({
            bookingId: booking._id,
            customerId: booking.customerId,
            workerId: booking.workerId,
            amount: booking.amount || 350,
            paymentMethod: paymentMethod || "UPI",
            paymentStatus: "Pending"
        });

        res.status(201).json({
            message: "Payment initialized successfully",
            payment
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating payment",
            error: error.message
        });
    }
});

// 2. MARK PAYMENT AS PAID (Digital Payment Simulation)
router.patch("/:id/pay", protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        payment.paymentStatus = "Paid";
        payment.transactionId = "TXN-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
        await payment.save();

        // Update booking payment status as well
        await Booking.findByIdAndUpdate(payment.bookingId, {
            paymentStatus: "Paid"
        });

        res.status(200).json({
            message: "Payment completed successfully",
            payment
        });
    } catch (error) {
        res.status(500).json({
            message: "Error completing payment",
            error: error.message
        });
    }
});

// 3. GET PAYMENT BY BOOKING ID
router.get("/booking/:bookingId", protect, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            bookingId: req.params.bookingId
        });

        res.status(200).json(payment || null);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching booking payment",
            error: error.message
        });
    }
});

// 4. GET MY PAYMENTS
router.get("/my", protect, async (req, res) => {
    try {
        const customer = await Customer.findOne({
            userId: req.user.id
        });

        const filter = customer ? { customerId: customer._id } : {};
        const payments = await Payment.find(filter)
            .sort({ createdAt: -1 })
            .populate("bookingId", "service date time address")
            .populate("workerId", "name phone");

        res.status(200).json({
            count: payments.length,
            payments
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching payments",
            error: error.message
        });
    }
});

// 5. WORKER EARNINGS
router.get(
    "/worker/:workerId",
    protect,
    async (req, res) => {
        try {
            const payments = await Payment.find({
                workerId: req.params.workerId,
                paymentStatus: "Paid"
            });

            const totalEarnings = payments.reduce(
                (total, payment) => total + payment.amount,
                0
            );

            res.status(200).json({
                workerId: req.params.workerId,
                paidBookings: payments.length,
                totalEarnings
            });
        } catch (error) {
            res.status(500).json({
                message: "Error fetching worker earnings",
                error: error.message
            });
        }
    }
);

module.exports = router;