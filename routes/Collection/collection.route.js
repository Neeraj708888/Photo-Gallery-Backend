import express from "express";
import { upload } from "../../middlewares/cloudinary.js";
import { createCollection, deleteCollection, getAllCollection, getCollectionById, searchCollection, toggleCollectionStatus, updateCollection } from "../../controllers/Collection/collection.controller.js";
import { verifyToken } from "../../middlewares/auth.middlewares.js";

const router = express.Router();

// collections-route
router.post("/create", verifyToken, upload.single("thumbnail"), createCollection);
router.put("/update/:id", verifyToken, upload.single("thumbnail"), updateCollection);
router.delete("/delete/:id", verifyToken, deleteCollection);
router.get("/", getAllCollection);
router.get("/search", searchCollection);
router.get("/:id", getCollectionById);
router.patch("/status/:id", verifyToken, toggleCollectionStatus);


export default router;