import mongoose from "mongoose";


const CollectionSchema = new mongoose.Schema({
    collectionName: { type: String, required: true, unique: true, trim: true },
    thumbnail: { type: String, required: true },
}, 
{ timestamps: true },
);

export default mongoose.model('Collection', CollectionSchema);