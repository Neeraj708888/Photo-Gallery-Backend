import mongoose from "mongoose";


const PhotoSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
    },
    images: [
        {
            url: {
                type: String,
                required: true,
            },
            public_id: {
                type: String,
                required: true,
            }
        }
    ],
    // Gallery Relation
    gallery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gallery",
        required: true,
        index: true,
    },
    status: {
        type: Boolean,
        default: true
    },
},

    { timestamps: true, versionKey: false }
);

// Fast Searching
PhotoSchema.index({ title: 1, status: 1 });
PhotoSchema.index({ gallery: 1 });

export default mongoose.model("Photo", PhotoSchema);