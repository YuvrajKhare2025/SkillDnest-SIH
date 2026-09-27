const express = require("express");

const Worker = require("../models/Worker");
const Booking = require("../models/Booking");
const Cooperative = require("../models/Cooperative");

const {
    analyzeServiceRequest,
    fallbackAnalyze
} = require("../utils/aiService");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// SMART MATCH
router.post(
    "/smart-match",
    protect,
    async (req, res) => {
        try {
            const { message } = req.body;

            // 1. CHECK CUSTOMER MESSAGE
            if (!message || !message.trim()) {
                return res.status(400).json({
                    message: "Service request message is required"
                });
            }

            // 2. GEMINI AI ANALYSIS (with fallback)
            let aiResult;
            try {
                aiResult = await analyzeServiceRequest(message);
            } catch (err) {
                console.warn("AI match fallback triggered:", err.message);
                aiResult = fallbackAnalyze(message);
            }

            const service = aiResult.service || "";
            const location = aiResult.location || "";

            // 3. FIND COOPERATIVES & WORKERS
            const cooperativeFilter = {
                "services.service": {
                    $regex: service,
                    $options: "i"
                }
            };

            if (location) {
                cooperativeFilter.district = {
                    $regex: location,
                    $options: "i"
                };
            }

            let cooperatives = await Cooperative.find(cooperativeFilter).limit(6);

            // If no district match, find general match for that service
            if (cooperatives.length === 0) {
                cooperatives = await Cooperative.find({
                    "services.service": {
                        $regex: service,
                        $options: "i"
                    }
                }).limit(6);
            }

            // If still empty, fetch top cooperatives
            if (cooperatives.length === 0) {
                cooperatives = await Cooperative.find().limit(6);
            }

            // 4. SOCIETY DATA + WORKERS
            const cooperativeResults = await Promise.all(
                cooperatives.map(async (cooperative) => {
                    const workerFilter = {
                        cooperativeId: cooperative._id,
                        availability: true
                    };

                    if (service && service !== "General Service") {
                        workerFilter.skills = {
                            $regex: service,
                            $options: "i"
                        };
                    }

                    let workers = await Worker.find(workerFilter);

                    // If no worker with exact skill in this coop, get all available workers
                    if (workers.length === 0) {
                        workers = await Worker.find({
                            cooperativeId: cooperative._id,
                            availability: true
                        });
                    }

                    // FAIR OPPORTUNITY SCORE CALCULATION
                    const workersWithBookings = await Promise.all(
                        workers.map(async (worker) => {
                            const completedBookings = await Booking.countDocuments({
                                workerId: worker._id,
                                status: "Completed"
                            });

                            // Calculate Fair Opportunity Score (0-100)
                            const workloadScore = Math.max(0, 40 - completedBookings * 5);
                            const ratingScore = ((worker.rating || 4) / 5) * 30;
                            const availabilityScore = worker.availability ? 20 : 0;
                            const expScore = Math.min(worker.experience || 0, 10);
                            const opportunityScore = Math.min(100, Math.round(workloadScore + ratingScore + availabilityScore + expScore));

                            return {
                                worker,
                                completedBookings,
                                opportunityScore
                            };
                        })
                    );

                    // Sort by Fair Opportunity Score descending
                    workersWithBookings.sort((a, b) => b.opportunityScore - a.opportunityScore);

                    // Matched service and price
                    const matchedService = cooperative.services?.find((item) =>
                        item.service?.toLowerCase().includes(service.toLowerCase())
                    );

                    return {
                        cooperativeId: cooperative._id,
                        societyName: cooperative.societyName,
                        registrationNumber: cooperative.registrationNumber,
                        district: cooperative.district,
                        contactPerson: cooperative.contactPerson,
                        phone: cooperative.phone,
                        photo: cooperative.photo,
                        verificationStatus: cooperative.verificationStatus,
                        service: matchedService?.service || service || "General Service",
                        subServices: matchedService?.subServices || [],
                        price: matchedService?.price || 0,
                        description: matchedService?.description || "",
                        totalWorkers: workersWithBookings.length,
                        workers: workersWithBookings.map((item) => ({
                            id: item.worker._id,
                            name: item.worker.name,
                            phone: item.worker.phone,
                            photo: item.worker.photo,
                            skills: item.worker.skills,
                            subServices: item.worker.subServices,
                            experience: item.worker.experience,
                            rating: item.worker.rating,
                            location: item.worker.location,
                            availability: item.worker.availability,
                            verificationStatus: item.worker.verificationStatus,
                            completedBookings: item.completedBookings,
                            opportunityScore: item.opportunityScore
                        }))
                    };
                })
            );

            // Also find direct individual worker matches across platform
            const directWorkerFilter = {
                availability: true
            };
            if (service && service !== "General Service") {
                directWorkerFilter.skills = {
                    $regex: service,
                    $options: "i"
                };
            }
            const directWorkers = await Worker.find(directWorkerFilter).populate("cooperativeId").limit(10);

            res.status(200).json({
                message: "AI smart cooperative matching successful",
                customerRequest: message,
                aiAnalysis: aiResult,
                totalCooperatives: cooperativeResults.length,
                cooperatives: cooperativeResults,
                directWorkers: directWorkers.map((w) => ({
                    _id: w._id,
                    name: w.name,
                    phone: w.phone,
                    skills: w.skills,
                    subServices: w.subServices,
                    experience: w.experience,
                    rating: w.rating,
                    location: w.location,
                    availability: w.availability,
                    verificationStatus: w.verificationStatus,
                    cooperativeName: w.cooperativeId?.societyName || "Cooperative Network"
                }))
            });
        } catch (error) {
            console.error("Smart Match Error:", error.message);
            res.status(500).json({
                message: "Error finding smart cooperative match",
                error: error.message
            });
        }
    }
);

module.exports = router;
