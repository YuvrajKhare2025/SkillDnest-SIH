const express = require("express");

const Customer = require("../models/Customer");
const User = require("../models/User");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// ADD / UPDATE CUSTOMER PROFILE
// ===============================
router.post(
    "/",
    protect,
    allowRoles("Customer"),
    async (req, res) => {
        try {
            const { name, phone, location } = req.body;

            if (!name || !phone || !location) {
                return res.status(400).json({
                    message: "Name, phone, and location are required"
                });
            }

            let customer = await Customer.findOne({
                userId: req.user.id
            });

            if (customer) {
                customer.name = name;
                customer.phone = phone;
                customer.location = location;
                await customer.save();

                return res.status(200).json({
                    message: "Customer profile updated successfully",
                    customer
                });
            }

            customer = await Customer.create({
                userId: req.user.id,
                name,
                phone,
                location
            });

            res.status(201).json({
                message: "Customer added successfully",
                customer
            });
        } catch (error) {
            res.status(500).json({
                message: "Error saving customer profile",
                error: error.message
            });
        }
    }
);

// ===============================
// GET ALL CUSTOMERS (ADMIN ONLY)
// ===============================
router.get(
    "/",
    protect,
    allowRoles("CooperativeAdmin"),
    async (req, res) => {
        try {
            const customers = await Customer.find();
            res.status(200).json(customers);
        } catch (error) {
            res.status(500).json({
                message: "Error fetching customers",
                error: error.message
            });
        }
    }
);

// ===============================
// GET MY PROFILE
// ===============================
router.get(
    "/profile/me",
    protect,
    allowRoles("Customer"),
    async (req, res) => {
        try {
            let customer = await Customer.findOne({
                userId: req.user.id
            });

            // Auto-heal if profile not created yet
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

            res.status(200).json(customer);
        } catch (error) {
            res.status(500).json({
                message: "Error fetching customer profile",
                error: error.message
            });
        }
    }
);

// ===============================
// GET CUSTOMER BY ID
// ===============================
router.get(
    "/:id",
    protect,
    async (req, res) => {
        try {
            const customer = await Customer.findById(req.params.id);

            if (!customer) {
                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            if (
                req.user.role === "Customer" &&
                customer.userId &&
                customer.userId.toString() !== req.user.id.toString()
            ) {
                return res.status(403).json({
                    message: "You can only view your own profile"
                });
            }

            res.status(200).json(customer);
        } catch (error) {
            res.status(500).json({
                message: "Error fetching customer",
                error: error.message
            });
        }
    }
);

// ===============================
// UPDATE CUSTOMER
// ===============================
router.patch(
    "/:id",
    protect,
    async (req, res) => {
        try {
            const customer = await Customer.findById(req.params.id);

            if (!customer) {
                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            if (
                req.user.role === "Customer" &&
                customer.userId &&
                customer.userId.toString() !== req.user.id.toString()
            ) {
                return res.status(403).json({
                    message: "You can only update your own profile"
                });
            }

            const updatedCustomer = await Customer.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

            res.status(200).json({
                message: "Customer updated successfully",
                customer: updatedCustomer
            });
        } catch (error) {
            res.status(500).json({
                message: "Error updating customer",
                error: error.message
            });
        }
    }
);

module.exports = router;