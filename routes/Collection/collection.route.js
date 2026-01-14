import express from "express";
import { upload } from "../../middlewares/cloudinary.js";
import { createCollection, deleteCollection, getAllCollection, getCollectionById, searchCollection, toggleCollectionStatus, updateCollection } from "../../controllers/Collection/collection.controller.js";

const router = express.Router();

// collections-route
router.post("/create", upload.single("thumbnail"), createCollection);
router.put("/update/:id", upload.single("thumbnail"), updateCollection);
router.delete("/delete/:id", deleteCollection);
router.get("/", getAllCollection);
router.get("/search", searchCollection);
router.get("/:id", getCollectionById);
router.patch("/status/:id", toggleCollectionStatus);


export default router;