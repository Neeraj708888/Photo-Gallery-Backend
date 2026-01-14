import mongoose from "mongoose";


const PhotoSchema = new mongoose.Schema({
    title: {
        type: String,
        image: {
            url: String,
            public_id: String,
        },
        gallery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gallery",
            required: true,
        },
    },
}, { timestamps: true }
);

export default mongoose.model("Photo", PhotoSchema);