const mongoose = require("mongoose");

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env['MONGO_URI'] as string);
    } catch (err) {
        process.exit(1);
    }
};

