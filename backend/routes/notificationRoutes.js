const express = require("express");
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// 1. CREATE NOTIFICATION
router.post("/", protect, async (req, res) => {
    try {
        const { userId, message, type } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                message: "User ID and message are required"
            });
        }

        const notification = await Notification.create({
            userId,
            message,
            type: type || "General"
        });

        res.status(201).json({
            message: "Notification created successfully",
            notification
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating notification",
            error: error.message
        });
    }
});

// 2. GET MY NOTIFICATIONS
router.get("/my", protect, async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.id
        }).sort({ createdAt: -1 }).limit(50);

        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.status(200).json({
            count: notifications.length,
            unreadCount,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching notifications",
            error: error.message
        });
    }
});

// 3. MARK NOTIFICATION AS READ
router.patch("/:id/read", protect, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating notification",
            error: error.message
        });
    }
});

// 4. MARK ALL NOTIFICATIONS AS READ
router.patch("/read-all", protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            message: "All notifications marked as read"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error marking all as read",
            error: error.message
        });
    }
});

module.exports = router;