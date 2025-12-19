import express from "express";
import Collection from "../../models/Collection.model.js";
import { upload } from "../../middlewares/cloudinary.js";
import { verifyToken } from "../../middlewares/auth.middlewares.js";



const router = express.Router();

// Create Collection
router.post("/create", verifyToken, upload.single("thumbnail"), async (req, res) => {
  try {
    const { collectionName } = req.body;

    const thumbnail = req.file ? req.file.path : null;

    const newCollection = new Collection({
      collectionName,
      thumbnail,
    });

    await newCollection.save();

    res.status(201).json({
      message: "Collection created successfully",
      collection: newCollection,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating collection", error });
  }
});


// Update Collection
router.put(
  "/:id",
  verifyToken,
  upload.single("thumbnail"), // Cloudinary upload
  async (req, res) => {
    try {
      const { collectionName } = req.body;

      // If new image uploaded → Cloudinary gives path in req.file.path
      const thumbnail = req.file ? req.file.path : undefined;

      // Build dynamic update object
      const updateData = {};

      if (collectionName) updateData.collectionName = collectionName;
      if (thumbnail) updateData.thumbnail = thumbnail;

      const updatedCollection = await Collection.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!updatedCollection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      res.status(200).json({
        message: "Collection updated successfully",
        collection: updatedCollection,
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating collection", error });
    }
  }
);

export default router;
