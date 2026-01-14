import mongoose from "mongoose";


const CollectionSchema = new mongoose.Schema({
    collectionName: { type: String, required: true, unique: true, trim: true },
    thumbnail: {
        url: { type: String, required: true }, public_id: { type: String, required: true }
    },
    status: {
        type: Boolean,
        default: true,
    },
},
    { timestamps: true },
);

CollectionSchema.index({ collectionName: 1 });

export default mongoose.model('Collection', CollectionSchema);