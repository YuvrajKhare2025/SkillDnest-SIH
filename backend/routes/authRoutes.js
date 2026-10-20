const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Customer = require("../models/Customer");
const Worker = require("../models/Worker");
const Cooperative = require("../models/Cooperative");

const router = express.Router();

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
    try {
        const { name, phone, email, password, role, location, skills, experience, cooperativeId } = req.body;

        // Required fields check
        if (!name || !phone || !password) {
            return res.status(400).json({
                message: "Name, phone, and password are required"
            });
        }

        const trimmedPhone = phone.trim();
        const trimmedEmail = email ? email.trim().toLowerCase() : undefined;

        // Check existing phone
        const existingPhone = await User.findOne({ phone: trimmedPhone });
        if (existingPhone) {
            return res.status(400).json({
                message: "Phone number already registered. Please login instead."
            });
        }

        // Check existing email if provided
        if (trimmedEmail) {
            const existingEmail = await User.findOne({ email: trimmedEmail });
            if (existingEmail) {
                return res.status(400).json({
                    message: "Email already registered."
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const assignedRole = role || "Customer";

        // Create user
        const user = await User.create({
            name: name.trim(),
            phone: trimmedPhone,
            email: trimmedEmail || undefined,
            password: hashedPassword,
            role: assignedRole
        });

        // If Customer role, create/link Customer profile
        let customerProfile = null;
        let workerProfile = null;

        if (assignedRole === "Customer") {
            customerProfile = await Customer.create({
                userId: user._id,
                name: user.name,
                phone: user.phone,
                location: location ? location.trim() : "Local Community"
            });
        } else if (assignedRole === "Worker") {
            // Find existing worker by phone or create new
            let worker = await Worker.findOne({ phone: trimmedPhone });
            if (worker) {
                worker.userId = user._id;
                await worker.save();
                workerProfile = worker;
            } else {
                let coopId = cooperativeId;
                if (!coopId) {
                    const firstCoop = await Cooperative.findOne();
                    coopId = firstCoop ? firstCoop._id : null;
                }
                if (coopId) {
                    workerProfile = await Worker.create({
                        cooperativeId: coopId,
                        userId: user._id,
                        name: user.name,
                        phone: user.phone,
                        skills: skills ? (Array.isArray(skills) ? skills : [skills]) : ["General Service"],
                        experience: Number(experience) || 1,
                        location: location ? location.trim() : "Local Community",
                        availability: true,
                        verificationStatus: "Verified"
                    });
                }
            }
        }

        // Generate JWT token on register so user can proceed directly
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET || "SkillDnest_Coop_Secret_2026",
            {
                expiresIn: "7d"
            }
        );

        res.status(201).json({
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                customerProfileId: customerProfile?._id,
                workerProfileId: workerProfile?._id
            }
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            message: "Server error during registration",
            error: error.message
        });
    }
});

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
    try {
        const { phone, email, password } = req.body;

        const lookupIdentifier = phone ? phone.trim() : (email ? email.trim().toLowerCase() : "");

        // Required fields check
        if (!lookupIdentifier || !password) {
            return res.status(400).json({
                message: "Phone or Email and Password are required"
            });
        }

        // Find user by phone OR email
        const user = await User.findOne({
            $or: [
                { phone: lookupIdentifier },
                { email: lookupIdentifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid phone/email or password"
            });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid phone/email or password"
            });
        }

        // Ensure Customer profile exists if role is Customer
        let customerProfile = null;
        let workerProfile = null;

        if (user.role === "Customer") {
            customerProfile = await Customer.findOne({ userId: user._id });
            if (!customerProfile) {
                customerProfile = await Customer.create({
                    userId: user._id,
                    name: user.name,
                    phone: user.phone,
                    location: "Local Community"
                });
            }
        } else if (user.role === "Worker") {
            workerProfile = await Worker.findOne({
                $or: [{ userId: user._id }, { phone: user.phone }]
            }).populate("cooperativeId", "societyName phone district");

            if (workerProfile && !workerProfile.userId) {
                workerProfile.userId = user._id;
                await workerProfile.save();
            }
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET || "SkillDnest_Coop_Secret_2026",
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                customerProfileId: customerProfile?._id,
                workerProfileId: workerProfile?._id,
                worker: workerProfile ? {
                    id: workerProfile._id,
                    name: workerProfile.name,
                    skills: workerProfile.skills,
                    rating: workerProfile.rating,
                    availability: workerProfile.availability,
                    location: workerProfile.location,
                    cooperative: workerProfile.cooperativeId
                } : null
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            message: "Server error during login",
            error: error.message
        });
    }
});

module.exports = router;