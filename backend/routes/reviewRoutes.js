const express = require("express");

const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");
const User = require("../models/User");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const createNotification = require("../utils/notificationHelper");

const router = express.Router();

// ==========================================
// ADD REVIEW (Customer)
// ==========================================
router.post(
    "/",
    protect,
    allowRoles("Customer"),
    async (req, res) => {
        try {
            const {
                bookingId,
                rating,
                comment,
                workPhoto
            } = req.body;

            if (!bookingId || !rating) {
                return res.status(400).json({
                    message: "Booking ID and rating are required"
                });
            }

            const parsedRating = Number(rating);
            if (parsedRating < 1 || parsedRating > 5) {
                return res.status(400).json({
                    message: "Rating must be between 1 and 5"
                });
            }

            // Current customer profile
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
                } else {
                    return res.status(404).json({
                        message: "Customer profile not found"
                    });
                }
            }

            // Find booking
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return res.status(404).json({
                    message: "Booking not found"
                });
            }

            // Verify ownership
            if (
                booking.customerId.toString() !== customer._id.toString()
            ) {
                return res.status(403).json({
                    message: "You can only review your own booking"
                });
            }

            // Check duplicate review
            const existingReview = await Review.findOne({
                bookingId: booking._id
            });

            if (existingReview) {
                return res.status(400).json({
                    message: "Review already submitted for this booking",
                    review: existingReview
                });
            }

            // Create review
            const review = await Review.create({
                customerId: customer._id,
                workerId: booking.workerId,
                bookingId: booking._id,
                rating: parsedRating,
                comment: comment ? comment.trim() : "",
                workPhoto: workPhoto ? workPhoto.trim() : ""
            });

            // Recalculate worker average rating
            const reviews = await Review.find({
                workerId: booking.workerId
            });

            const totalRating = reviews.reduce(
                (total, item) => total + item.rating,
                0
            );

            const averageRating = Number((totalRating / reviews.length).toFixed(1));

            const updatedWorker = await Worker.findByIdAndUpdate(
                booking.workerId,
                { rating: averageRating },
                { new: true }
            );

            // Notify worker
            if (updatedWorker?.userId) {
                await createNotification(
                    updatedWorker.userId,
                    `You received a new ${parsedRating}⭐ review from ${customer.name}!`,
                    "Review"
                );
            }

            res.status(201).json({
                message: "Review submitted successfully",
                review,
                workerAverageRating: averageRating
            });
        } catch (error) {
            console.error("Add review error:", error);
            res.status(500).json({
                message: "Error adding review",
                error: error.message
            });
        }
    }
);

// ==========================================
// GET WORKER REVIEWS
// ==========================================
router.get(
    "/worker/:workerId",
    async (req, res) => {
        try {
            const reviews = await Review.find({
                workerId: req.params.workerId
            })
                .sort({ createdAt: -1 })
                .populate("customerId", "name location")
                .populate("bookingId", "service date");

            res.status(200).json({
                count: reviews.length,
                reviews
            });
        } catch (error) {
            res.status(500).json({
                message: "Error fetching worker reviews",
                error: error.message
            });
        }
    }
);

// ==========================================
// GET ALL REVIEWS
// ==========================================
router.get("/", async (req, res) => {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .populate("customerId", "name location")
            .populate("workerId", "name skills");

        res.status(200).json({
            count: reviews.length,
            reviews
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching reviews",
            error: error.message
        });
    }
});

module.exports = router;