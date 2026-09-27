const express = require("express");

const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");
const User = require("../models/User");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const createNotification = require("../utils/notificationHelper");

const router = express.Router();

// =====================================================
// CREATE BOOKING (CUSTOMER ONLY)
// =====================================================
router.post(
    "/",
    protect,
    allowRoles("Customer"),
    async (req, res) => {
        try {
            const {
                workerId,
                service,
                date,
                time,
                address,
                amount,
                isEmergency,
                notes
            } = req.body;

            if (
                !workerId ||
                !service ||
                !date ||
                !time ||
                !address
            ) {
                return res.status(400).json({
                    message: "Worker, service, date, time, and address are required"
                });
            }

            // Auto-heal / fetch Customer profile
            let customer = await Customer.findOne({
                userId: req.user.id
            });

            if (!customer) {
                const user = await User.findById(req.user.id);
                if (user) {
                    customer = await Customer.create({
                        userId: user._id,
                        name: user.name,
                        phone: user.phone,
                        location: address || "Local Community"
                    });
                } else {
                    return res.status(404).json({
                        message: "Customer profile not found"
                    });
                }
            }

            const worker = await Worker.findById(workerId);
            if (!worker) {
                return res.status(404).json({
                    message: "Selected worker not found"
                });
            }

            // Create booking
            const booking = await Booking.create({
                customerId: customer._id,
                workerId: worker._id,
                service,
                date,
                time,
                address,
                amount: Number(amount) || 0,
                isEmergency: Boolean(isEmergency),
                notes: notes || "",
                status: "Pending"
            });

            // Notify Worker
            if (worker.userId) {
                await createNotification(
                    worker.userId,
                    `New ${isEmergency ? "🚨 EMERGENCY " : ""}booking received for ${service} on ${date} at ${time}.`,
                    "Booking"
                );
            }

            // Also notify customer of successful booking placement
            await createNotification(
                req.user.id,
                `Your booking for ${service} on ${date} at ${time} has been placed. Waiting for worker confirmation.`,
                "Booking"
            );

            const populatedBooking = await Booking.findById(booking._id)
                .populate("customerId")
                .populate({
                    path: "workerId",
                    populate: { path: "cooperativeId", select: "societyName phone district" }
                });

            res.status(201).json({
                message: "Booking created successfully",
                booking: populatedBooking
            });
        } catch (error) {
            console.error("Create booking error:", error);
            res.status(500).json({
                message: "Error creating booking",
                error: error.message
            });
        }
    }
);

// =====================================================
// GET BOOKINGS (ROLE BASED)
// =====================================================
router.get("/", protect, async (req, res) => {
    try {
        // CUSTOMER
        if (req.user.role === "Customer") {
            let customer = await Customer.findOne({
                userId: req.user.id
            });

            if (!customer) {
                const user = await User.findById(req.user.id);
                if (user) {
                    customer = await Customer.create({
                        userId: user._id,
                        name: user.name,
                        phone: user.phone,
                        location: "Local Community"
                    });
                }
            }

            const bookings = await Booking.find({
                customerId: customer ? customer._id : null
            })
                .sort({ createdAt: -1 })
                .populate("customerId")
                .populate({
                    path: "workerId",
                    populate: { path: "cooperativeId", select: "societyName phone district" }
                });

            return res.status(200).json({
                count: bookings.length,
                bookings
            });
        }

        // WORKER
        if (req.user.role === "Worker") {
            const worker = await Worker.findOne({
                userId: req.user.id
            });

            const filter = worker ? { workerId: worker._id } : {};
            const bookings = await Booking.find(filter)
                .sort({ createdAt: -1 })
                .populate("customerId")
                .populate({
                    path: "workerId",
                    populate: { path: "cooperativeId", select: "societyName phone district" }
                });

            return res.status(200).json({
                count: bookings.length,
                bookings
            });
        }

        // COOPERATIVE ADMIN
        if (req.user.role === "CooperativeAdmin") {
            const bookings = await Booking.find()
                .sort({ createdAt: -1 })
                .populate("customerId")
                .populate({
                    path: "workerId",
                    populate: { path: "cooperativeId", select: "societyName phone district" }
                });

            return res.status(200).json({
                count: bookings.length,
                bookings
            });
        }

        return res.status(403).json({
            message: "Access denied"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching bookings",
            error: error.message
        });
    }
});

// =====================================================
// GET BOOKING STATUS
// =====================================================
router.get("/:id/status", protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("customerId")
            .populate({
                path: "workerId",
                populate: { path: "cooperativeId", select: "societyName phone district" }
            });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.status(200).json({
            bookingId: booking._id,
            service: booking.service,
            date: booking.date,
            time: booking.time,
            address: booking.address,
            amount: booking.amount,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            isEmergency: booking.isEmergency,
            worker: booking.workerId,
            customer: booking.customerId
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching booking status",
            error: error.message
        });
    }
});

// Helper for status updates & notifications
const updateBookingStatus = async (req, res, newStatus, successMsg, notifyWorkerMsg, notifyCustomerMsg) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("customerId")
            .populate("workerId");

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        booking.status = newStatus;
        await booking.save();

        // Customer notification
        if (booking.customerId?.userId && notifyCustomerMsg) {
            await createNotification(
                booking.customerId.userId,
                notifyCustomerMsg(booking),
                "Booking"
            );
        }

        // Worker notification
        if (booking.workerId?.userId && notifyWorkerMsg) {
            await createNotification(
                booking.workerId.userId,
                notifyWorkerMsg(booking),
                "Booking"
            );
        }

        res.status(200).json({
            message: successMsg,
            booking
        });
    } catch (error) {
        res.status(500).json({
            message: `Error updating booking to ${newStatus}`,
            error: error.message
        });
    }
};

// =====================================================
// ACCEPT BOOKING (Worker or Admin)
// =====================================================
router.patch("/:id/accept", protect, async (req, res) => {
    return updateBookingStatus(
        req,
        res,
        "Accepted",
        "Booking accepted successfully",
        () => "You have accepted the booking.",
        (b) => `Your booking for ${b.service} has been ACCEPTED by worker.`
    );
});

// =====================================================
// ON THE WAY (Worker on the way)
// =====================================================
router.patch("/:id/on-the-way", protect, async (req, res) => {
    return updateBookingStatus(
        req,
        res,
        "OnTheWay",
        "Worker is on the way",
        () => "You updated status: On the way to client location.",
        (b) => `The worker is ON THE WAY for your ${b.service} service.`
    );
});

// =====================================================
// START SERVICE (In Progress)
// =====================================================
router.patch("/:id/start", protect, async (req, res) => {
    return updateBookingStatus(
        req,
        res,
        "InProgress",
        "Service started",
        () => "You have started the service.",
        (b) => `Your ${b.service} service has STARTED.`
    );
});

// =====================================================
// COMPLETE BOOKING
// =====================================================
router.patch("/:id/complete", protect, async (req, res) => {
    return updateBookingStatus(
        req,
        res,
        "Completed",
        "Booking completed successfully",
        () => "You marked the booking as Completed. Great job!",
        (b) => `Your ${b.service} service is COMPLETED. Please rate your experience!`
    );
});

// =====================================================
// REJECT BOOKING
// =====================================================
router.patch("/:id/reject", protect, async (req, res) => {
    return updateBookingStatus(
        req,
        res,
        "Rejected",
        "Booking rejected",
        () => "You have rejected the booking.",
        (b) => `Your booking for ${b.service} was rejected by worker.`
    );
});

// =====================================================
// CANCEL BOOKING (Customer)
// =====================================================
router.patch("/:id/cancel", protect, async (req, res) => {
    return updateBookingStatus(
        req,
        res,
        "Cancelled",
        "Booking cancelled successfully",
        (b) => `Booking for ${b.service} was cancelled by the customer.`,
        () => "You have cancelled your booking."
    );
});

// =====================================================
// GENERAL STATUS UPDATE
// =====================================================
router.patch("/:id/status", protect, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["Pending", "Accepted", "OnTheWay", "InProgress", "Completed", "Rejected", "Cancelled"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
    }

    return updateBookingStatus(
        req,
        res,
        status,
        `Booking status updated to ${status}`,
        (b) => `Booking #${b._id.toString().slice(-6)} status updated to ${status}`,
        (b) => `Your booking for ${b.service} is now ${status}`
    );
});

module.exports = router;