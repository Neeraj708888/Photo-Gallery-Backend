import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema({
    galleryName: {
        type: String,
        trim: true,
        required: true,
    },
    images: [
        {
            url: {
                type: String,
                required: true
            },
            public_id: {
                type: String,
                required: true
            },
        }
    ],
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",  // Relation
        required: true,
        index: true,
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
GallerySchema.index({ collection: 1 });

export default mongoose.model("Gallery", GallerySchema);