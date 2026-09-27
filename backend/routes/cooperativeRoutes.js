const express = require("express");
const bcrypt = require("bcryptjs");

const Cooperative = require("../models/Cooperative");
const Worker = require("../models/Worker");
const Booking = require("../models/Booking");
const User = require("../models/User");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// REGISTER COOPERATIVE SOCIETY
// ==========================================
router.post("/", async (req, res) => {
    try {
        const {
            societyName,
            registrationNumber,
            district,
            contactPerson,
            phone,
            photo,
            password,
            services
        } = req.body;

        // Required fields
        if (
            !societyName ||
            !registrationNumber ||
            !district ||
            !contactPerson ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Society name, registration number, district, contact person, phone and password are required"
            });
        }

        // Check cooperative registration number
        const existingCooperative = await Cooperative.findOne({
            registrationNumber: registrationNumber.trim()
        });

        if (existingCooperative) {
            return res.status(400).json({
                message: "Cooperative with this registration number already exists"
            });
        }

        // Check phone in User collection
        const existingUser = await User.findOne({
            phone: phone.trim()
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Phone number already registered. Please login instead."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User account
        const user = await User.create({
            name: contactPerson.trim(),
            phone: phone.trim(),
            password: hashedPassword,
            role: "CooperativeAdmin"
        });

        // Default diverse services if empty
        const defaultServices = [
            { service: "Plumbing", subServices: ["Pipe repair", "Tap fitting", "Drainage"], price: 350, description: "Professional plumbing services" },
            { service: "Electrical", subServices: ["Wiring", "Switch replacement", "Fan repair"], price: 400, description: "Certified electricians" },
            { service: "Carpenter", subServices: ["Door repair", "Furniture assembly"], price: 450, description: "Skilled woodwork" },
            { service: "Cleaner", subServices: ["Deep home cleaning", "Office cleaning"], price: 500, description: "Sanitation and cleaning" },
            { service: "Agriculture Labour", subServices: ["Harvesting", "Field prep", "Irrigation"], price: 400, description: "Experienced farm labour" }
        ];

        // Create Cooperative
        const cooperative = await Cooperative.create({
            societyName: societyName.trim(),
            registrationNumber: registrationNumber.trim(),
            district: district.trim(),
            contactPerson: contactPerson.trim(),
            phone: phone.trim(),
            photo: photo ? photo.trim() : "",
            services: services && services.length > 0 ? services : defaultServices,
            verificationStatus: "Verified" // Verified on direct coop onboarding
        });

        res.status(201).json({
            message: "Cooperative registered successfully",
            cooperative: {
                id: cooperative._id,
                societyName: cooperative.societyName,
                registrationNumber: cooperative.registrationNumber,
                district: cooperative.district,
                verificationStatus: cooperative.verificationStatus
            },
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Cooperative Registration Error:", error);
        res.status(500).json({
            message: "Error registering cooperative",
            error: error.message
        });
    }
});

// ==========================================
// GET ALL COOPERATIVES
// ==========================================
router.get("/", async (req, res) => {
    try {
        const cooperatives = await Cooperative.find();
        res.status(200).json(cooperatives);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching cooperatives",
            error: error.message
        });
    }
});

// ==========================================
// GET COOPERATIVE STATS
// ==========================================
router.get("/:id/stats", async (req, res) => {
    try {
        const cooperativeId = req.params.id;
        const cooperative = await Cooperative.findById(cooperativeId);
        if (!cooperative) {
            return res.status(404).json({ message: "Cooperative not found" });
        }

        const workers = await Worker.find({ cooperativeId });
        const workerIds = workers.map(w => w._id);
        const bookings = await Booking.find({ workerId: { $in: workerIds } });
        const completedBookings = bookings.filter(b => b.status === "Completed");

        const avgRating = workers.length > 0
            ? Number((workers.reduce((acc, w) => acc + (w.rating || 4.5), 0) / workers.length).toFixed(1))
            : 4.8;

        res.status(200).json({
            cooperativeId,
            societyName: cooperative.societyName,
            verificationStatus: cooperative.verificationStatus,
            totalWorkers: workers.length,
            availableWorkers: workers.filter(w => w.availability).length,
            totalBookings: bookings.length,
            completedBookings: completedBookings.length,
            averageRating: avgRating,
            servicesOffered: cooperative.services?.length || 0
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching cooperative stats",
            error: error.message
        });
    }
});

// ==========================================
// GET COOPERATIVE WORKERS
// ==========================================
router.get("/:id/workers", async (req, res) => {
    try {
        const workers = await Worker.find({
            cooperativeId: req.params.id
        });

        res.status(200).json({
            cooperativeId: req.params.id,
            totalWorkers: workers.length,
            workers
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching cooperative workers",
            error: error.message
        });
    }
});

// ==========================================
// VERIFY COOPERATIVE
// ==========================================
router.patch(
    "/:id/verify",
    protect,
    async (req, res) => {
        try {
            const { status } = req.body;
            const newStatus = status || "Verified";

            const cooperative = await Cooperative.findByIdAndUpdate(
                req.params.id,
                { verificationStatus: newStatus },
                { new: true }
            );

            if (!cooperative) {
                return res.status(404).json({
                    message: "Cooperative not found"
                });
            }

            res.status(200).json({
                message: `Cooperative ${newStatus.toLowerCase()} successfully`,
                cooperative
            });
        } catch (error) {
            res.status(500).json({
                message: "Error updating cooperative verification status",
                error: error.message
            });
        }
    }
);

// ==========================================
// GET COOPERATIVE BY ID
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const cooperative = await Cooperative.findById(req.params.id);

        if (!cooperative) {
            return res.status(404).json({
                message: "Cooperative not found"
            });
        }

        res.status(200).json(cooperative);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching cooperative",
            error: error.message
        });
    }
});

module.exports = router;
