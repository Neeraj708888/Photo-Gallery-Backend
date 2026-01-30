import mongoose from "mongoose";


const tokenShema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },

    expiresAt: { type: Date, required: true },

}, { timestamps: true });

export default mongoose.model("TokenBlacklist", tokenShema);            
