const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
    {
        cooperativeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cooperative",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        // Worker photo ka URL
        photo: {
            type: String,
            default: ""
        },

        skills: [
            {
                type: String
            }
        ],

        subServices: [
            {
                type: String
            }
        ],

        experience: {
            type: Number,
            default: 0
        },

        certificate: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            required: true
        },

        latitude: {
            type: Number,
            default: null
        },

        longitude: {
            type: Number,
            default: null
        },

        availability: {
            type: Boolean,
            default: true
        },

        verificationStatus: {
            type: String,
            default: "Pending"
        },

        rating: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// High-Concurrency Performance Indexes
workerSchema.index({ cooperativeId: 1, availability: 1 });
workerSchema.index({ skills: 1 });
workerSchema.index({ phone: 1 });
workerSchema.index({ userId: 1 });

module.exports = mongoose.model(
    "Worker",
    workerSchema
);