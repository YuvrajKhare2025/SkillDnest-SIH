const express = require("express");

const Worker = require("../models/Worker");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Cooperative = require("../models/Cooperative");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// ADD WORKER (CooperativeAdmin or Public/Self with Coop)
// ======================================================
router.post(
    "/",
    protect,
    async (req, res) => {
        try {
            const {
                cooperativeId,
                name,
                phone,
                photo,
                skills,
                subServices,
                experience,
                certificate,
                location,
                latitude,
                longitude,
                availability
            } = req.body;

            if (!name || !phone || !location) {
                return res.status(400).json({
                    message: "Name, phone, and location are required"
                });
            }

            let assignedCoopId = cooperativeId;
            if (!assignedCoopId) {
                const firstCoop = await Cooperative.findOne();
                if (firstCoop) {
                    assignedCoopId = firstCoop._id;
                } else {
                    return res.status(400).json({
                        message: "Cooperative ID is required to register worker"
                    });
                }
            }

            const worker = await Worker.create({
                cooperativeId: assignedCoopId,
                name: name.trim(),
                phone: phone.trim(),
                photo: photo ? photo.trim() : "",
                skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map(s => s.trim()) : []),
                subServices: Array.isArray(subServices) ? subServices : (subServices ? subServices.split(",").map(s => s.trim()) : []),
                experience: Number(experience) || 0,
                certificate: certificate ? certificate.trim() : "",
                location: location.trim(),
                latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : null,
                longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : null,
                availability: availability !== undefined ? Boolean(availability) : true,
                verificationStatus: "Verified" // Verified by cooperative on entry
            });

            res.status(201).json({
                message: "Worker registered successfully",
                worker
            });
        } catch (error) {
            console.error("Add worker error:", error);
            res.status(500).json({
                message: "Error adding worker",
                error: error.message
            });
        }
    }
);

// ======================================================
// GET ALL WORKERS
// ======================================================
router.get("/", async (req, res) => {
    try {
        const workers = await Worker.find().populate("cooperativeId", "societyName district phone");
        res.status(200).json(workers);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching workers",
            error: error.message
        });
    }
});

// ======================================================
// SEARCH WORKERS
// ======================================================
router.get("/search", async (req, res) => {
    try {
        const { skill, category, location, emergency } = req.query;
        const filter = {};

        if (skill) {
            filter.skills = { $regex: skill, $options: "i" };
        }

        if (category) {
            filter.skills = { $regex: category, $options: "i" };
        }

        if (location) {
            filter.location = { $regex: location, $options: "i" };
        }

        if (emergency === "true") {
            filter.availability = true;
        }

        const workers = await Worker.find(filter).populate("cooperativeId", "societyName district phone");
        res.status(200).json(workers);
    } catch (error) {
        res.status(500).json({
            message: "Error searching workers",
            error: error.message
        });
    }
});

// ======================================================
// GET WORKERS BY COOPERATIVE ID (Must be before /:id)
// ======================================================
router.get("/cooperative/:cooperativeId", async (req, res) => {
    try {
        const workers = await Worker.find({
            cooperativeId: req.params.cooperativeId
        }).populate("cooperativeId", "societyName district phone");

        res.status(200).json(workers);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching cooperative workers",
            error: error.message
        });
    }
});

// ======================================================
// FAIR MATCH
// ======================================================
router.get("/fair-match", async (req, res) => {
    try {
        const workers = await Worker.find({
            availability: true
        }).populate("cooperativeId", "societyName district phone");

        const workerWorkload = await Promise.all(
            workers.map(async (worker) => {
                const completedBookings = await Booking.countDocuments({
                    workerId: worker._id,
                    status: "Completed"
                });

                return {
                    worker,
                    completedBookings
                };
            })
        );

        workerWorkload.sort((a, b) => a.completedBookings - b.completedBookings);

        res.status(200).json(workerWorkload);
    } catch (error) {
        res.status(500).json({
            message: "Error finding fair worker match",
            error: error.message
        });
    }
});

// ======================================================
// NEARBY WORKERS (Geo-spatial / Radius search)
// ======================================================
router.get("/nearby", async (req, res) => {
    try {
        const { latitude, longitude, radius = 25, skill } = req.query;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                message: "Latitude and longitude are required"
            });
        }

        const userLat = Number(latitude);
        const userLng = Number(longitude);

        const filter = {
            availability: true
        };

        if (skill) {
            filter.skills = { $regex: skill, $options: "i" };
        }

        const workers = await Worker.find(filter).populate("cooperativeId", "societyName district phone");

        // Calculate distance using Haversine formula
        const nearbyWorkers = workers
            .map((worker) => {
                let distanceKm = 5; // default nearby estimate if coords null
                if (worker.latitude != null && worker.longitude != null) {
                    const dLat = ((worker.latitude - userLat) * Math.PI) / 180;
                    const dLon = ((worker.longitude - userLng) * Math.PI) / 180;
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos((userLat * Math.PI) / 180) *
                            Math.cos((worker.latitude * Math.PI) / 180) *
                            Math.sin(dLon / 2) *
                            Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    distanceKm = Number((6371 * c).toFixed(1));
                }

                return {
                    worker,
                    distanceKm
                };
            })
            .filter((item) => item.distanceKm <= Number(radius))
            .sort((a, b) => a.distanceKm - b.distanceKm);

        res.status(200).json({
            count: nearbyWorkers.length,
            radiusKm: Number(radius),
            workers: nearbyWorkers
        });
    } catch (error) {
        res.status(500).json({
            message: "Error finding nearby workers",
            error: error.message
        });
    }
});

// ======================================================
// OPPORTUNITY SCORE (Fair Opportunity Score with reasons)
// ======================================================
router.get("/opportunity-score", async (req, res) => {
    try {
        const workers = await Worker.find().populate("cooperativeId", "societyName district");

        const workerScores = await Promise.all(
            workers.map(async (worker) => {
                const completedBookings = await Booking.countDocuments({
                    workerId: worker._id,
                    status: "Completed"
                });

                const workloadScore = Math.max(0, 40 - completedBookings * 4);
                const ratingScore = ((worker.rating || 4) / 5) * 30;
                const availabilityScore = worker.availability ? 20 : 0;
                const experienceScore = Math.min((worker.experience || 0) * 2, 10);

                const opportunityScore = Math.min(
                    100,
                    Math.round(workloadScore + ratingScore + availabilityScore + experienceScore)
                );

                const reasons = [
                    workloadScore >= 30 ? "High availability for new bookings (low active workload)" : "Balanced existing workload",
                    worker.rating >= 4 ? `Proven quality record (${worker.rating || 4.5}⭐)` : "Developing rating profile",
                    worker.availability ? "Immediate availability for service dispatch" : "Currently offline",
                    worker.experience > 0 ? `${worker.experience} yrs community experience` : "Verified fresh talent"
                ];

                return {
                    worker: {
                        id: worker._id,
                        name: worker.name,
                        skills: worker.skills,
                        experience: worker.experience,
                        rating: worker.rating,
                        availability: worker.availability,
                        location: worker.location,
                        photo: worker.photo,
                        verificationStatus: worker.verificationStatus,
                        cooperativeName: worker.cooperativeId?.societyName || "Cooperative Network"
                    },
                    completedBookings,
                    scores: {
                        workloadScore,
                        ratingScore: Number(ratingScore.toFixed(1)),
                        availabilityScore,
                        experienceScore
                    },
                    opportunityScore,
                    reasons
                };
            })
        );

        workerScores.sort((a, b) => b.opportunityScore - a.opportunityScore);

        res.status(200).json({
            message: "Fair opportunity scores calculated successfully",
            count: workerScores.length,
            workers: workerScores
        });
    } catch (error) {
        res.status(500).json({
            message: "Error calculating opportunity scores",
            error: error.message
        });
    }
});

// ======================================================
// GET MY WORKER PROFILE (Logged-in Worker)
// ======================================================
router.get("/me", protect, async (req, res) => {
    try {
        let worker = await Worker.findOne({
            $or: [{ userId: req.user.id }, { phone: req.user.phone }]
        }).populate("cooperativeId", "societyName district phone contactPerson");

        if (!worker) {
            return res.status(404).json({
                message: "Worker profile not found for this account"
            });
        }

        res.status(200).json(worker);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching worker profile",
            error: error.message
        });
    }
});

// ======================================================
// TOGGLE MY AVAILABILITY (Logged-in Worker)
// ======================================================
router.patch("/me/availability", protect, async (req, res) => {
    try {
        const { availability } = req.body;
        const worker = await Worker.findOne({
            $or: [{ userId: req.user.id }, { phone: req.user.phone }]
        });

        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        worker.availability = availability !== undefined ? Boolean(availability) : !worker.availability;
        await worker.save();

        res.status(200).json({
            message: `Availability updated to ${worker.availability ? "Active" : "Offline"}`,
            availability: worker.availability,
            worker
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating availability",
            error: error.message
        });
    }
});

// ======================================================
// GET MY WORKER STATS & EARNINGS
// ======================================================
router.get("/me/stats", protect, async (req, res) => {
    try {
        const worker = await Worker.findOne({
            $or: [{ userId: req.user.id }, { phone: req.user.phone }]
        });

        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        const totalBookings = await Booking.countDocuments({ workerId: worker._id });
        const completedBookings = await Booking.countDocuments({ workerId: worker._id, status: "Completed" });
        const activeBookings = await Booking.countDocuments({ workerId: worker._id, status: { $in: ["Accepted", "OnTheWay", "InProgress"] } });
        const pendingBookings = await Booking.countDocuments({ workerId: worker._id, status: "Pending" });

        const bookings = await Booking.find({ workerId: worker._id, status: "Completed" });
        const totalEarnings = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

        res.status(200).json({
            workerId: worker._id,
            name: worker.name,
            rating: worker.rating || 5.0,
            availability: worker.availability,
            totalBookings,
            completedBookings,
            activeBookings,
            pendingBookings,
            totalEarnings
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching worker stats",
            error: error.message
        });
    }
});

// ======================================================
// GET SINGLE WORKER
// ======================================================
router.get("/:id", async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id).populate("cooperativeId");

        if (!worker) {
            return res.status(404).json({
                message: "Worker not found"
            });
        }

        res.status(200).json(worker);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching worker",
            error: error.message
        });
    }
});

// ======================================================
// UPDATE WORKER
// ======================================================
router.patch("/:id", protect, async (req, res) => {
    try {
        const workerToUpdate = await Worker.findById(req.params.id);
        if (!workerToUpdate) {
            return res.status(404).json({
                message: "Worker not found"
            });
        }

        // Authorization check: only the worker themselves or CooperativeAdmin can update
        const isSelf = (workerToUpdate.userId && workerToUpdate.userId.toString() === req.user.id.toString()) ||
                       (workerToUpdate.phone && workerToUpdate.phone === req.user.phone);
        const isAdmin = req.user.role === "CooperativeAdmin";

        if (!isSelf && !isAdmin) {
            return res.status(403).json({
                message: "Forbidden: You are not authorized to update this worker profile"
            });
        }

        // Prevent non-admin workers from manually setting their own verificationStatus
        const updateData = { ...req.body };
        if (!isAdmin && updateData.verificationStatus !== undefined) {
            delete updateData.verificationStatus;
        }

        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Worker updated successfully",
            worker
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating worker",
            error: error.message
        });
    }
});

// ======================================================
// DELETE WORKER (CooperativeAdmin only)
// ======================================================
router.delete("/:id", protect, allowRoles("CooperativeAdmin"), async (req, res) => {
    try {
        const worker = await Worker.findByIdAndDelete(req.params.id);

        if (!worker) {
            return res.status(404).json({
                message: "Worker not found"
            });
        }

        res.status(200).json({
            message: "Worker deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting worker",
            error: error.message
        });
    }
});

// ======================================================
// VERIFY WORKER (CooperativeAdmin only)
// ======================================================
router.patch("/:id/verify", protect, allowRoles("CooperativeAdmin"), async (req, res) => {
    try {
        const { status } = req.body;
        const newStatus = status || "Verified";

        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: newStatus },
            { new: true }
        );

        if (!worker) {
            return res.status(404).json({
                message: "Worker not found"
            });
        }

        res.status(200).json({
            message: `Worker ${newStatus.toLowerCase()} successfully`,
            worker
        });
    } catch (error) {
        res.status(500).json({
            message: "Error verifying worker",
            error: error.message
        });
    }
});

module.exports = router;