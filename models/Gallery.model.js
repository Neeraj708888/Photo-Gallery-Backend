import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema({
    galleryName: {
        type: String,
        required: true,
    },
    thumbnail: {
        url: String,
        public_id: String,
    },
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",  // Relation
        required: true,
    },
    status: {
        type: Boolean,
        default: true,
    },
},
    {
        timestamps: true,
        versionKey: false,
    },
);

// Fast Filtering
GallerySchema.index({ galleryName: 1, status: 1 });

export default mongoose.model("Gallery", GallerySchema);