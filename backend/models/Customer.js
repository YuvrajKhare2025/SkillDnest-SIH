const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({

    // Link Customer profile with User account
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    }

}, { timestamps: true });

// High-Concurrency Performance Indexes
customerSchema.index({ userId: 1 });
customerSchema.index({ phone: 1 });

module.exports = mongoose.model("Customer", customerSchema);