const express = require("express");

const Service = require("../models/Service");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

const DEFAULT_SERVICES = [
    { name: "Plumbing", category: "Household", description: "Pipe leakage, fittings, drainage, tap repairs" },
    { name: "Electrical", category: "Household", description: "Wiring, switchboards, fan & appliance repairs" },
    { name: "Carpenter", category: "Household", description: "Furniture repair, door locks, woodwork" },
    { name: "Painter", category: "Household", description: "Wall painting, waterproof coating, whitewash" },
    { name: "Cleaner", category: "Household", description: "Deep house cleaning, sanitation, floor washing" },
    { name: "Mechanic", category: "Community", description: "Bike, scooter & auto repair, emergency assistance" },
    { name: "Driver", category: "Community", description: "Personal driver, temporary local travel" },
    { name: "Tutor", category: "Community", description: "Primary and secondary school home tutoring" },
    { name: "Caregiver", category: "Community", description: "Elder care, patient assistance, nursing support" },
    { name: "Gardener", category: "Community", description: "Lawn trimming, plant care, terrace gardening" },
    { name: "Domestic Worker", category: "Household", description: "Cooking, household assistance, kitchen help" },
    { name: "Agriculture Labour", category: "Agriculture", description: "Harvesting, sowing, field labor, irrigation" }
];

// ADD SERVICE — ADMIN ONLY
router.post(
    "/",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {
            const { name, category, description } = req.body;

            if (!name || !category) {
                return res.status(400).json({
                    message: "Name and category are required"
                });
            }

            const service = await Service.create({
                name,
                category,
                description: description || ""
            });

            res.status(201).json({
                message: "Service added successfully",
                service
            });
        } catch (error) {
            res.status(500).json({
                message: "Error adding service",
                error: error.message
            });
        }
    }
);

// GET ALL ACTIVE SERVICES — PUBLIC
router.get("/", async (req, res) => {
    try {
        let services = await Service.find({ active: true });

        if (services.length === 0) {
            // Auto seed default services if none present
            try {
                await Service.insertMany(DEFAULT_SERVICES);
                services = await Service.find({ active: true });
            } catch {
                services = DEFAULT_SERVICES;
            }
        }

        res.status(200).json(services);
    } catch (error) {
        res.status(200).json(DEFAULT_SERVICES);
    }
});

// GET SERVICES BY CATEGORY — PUBLIC
router.get(
    "/category/:category",
    async (req, res) => {
        try {
            const services = await Service.find({
                category: req.params.category,
                active: true
            });

            res.status(200).json(services);
        } catch (error) {
            res.status(500).json({
                message: "Error fetching category services",
                error: error.message
            });
        }
    }
);

module.exports = router;