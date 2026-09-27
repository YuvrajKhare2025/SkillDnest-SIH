const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },
        workerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true
        },
        service: {
            type: String,
            required: true
        },
        date: {
            type: String,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            default: 0
        },
        isEmergency: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: [
                "Pending",
                "Accepted",
                "OnTheWay",
                "InProgress",
                "Completed",
                "Rejected",
                "Cancelled"
            ],
            default: "Pending"
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Booking", bookingSchema);