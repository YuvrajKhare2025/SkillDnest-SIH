const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 50,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log("MongoDB Connected Successfully (Connection Pool: 50)");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;