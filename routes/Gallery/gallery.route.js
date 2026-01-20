import express from "express";
import { createGallery, deleteGallery, getAllGallery, getSingleGallery, toggleGalleryStatus, updateGallery } from "../../controllers/Gallery/gallery.controller.js";
import { upload } from "../../middlewares/cloudinary.js";
import { verifyToken } from "../../middlewares/auth.middlewares.js";

const router = express.Router();


// router.get("/search", filterGallery);
router.post("/create", verifyToken, upload.array("images", 10), createGallery);
router.post("/update/:id", verifyToken, upload.array("images"), updateGallery);
router.patch("/status/:id", verifyToken, toggleGalleryStatus);
router.delete("/:id", verifyToken, deleteGallery);
router.get("/", getAllGallery);
router.get("/:id", getSingleGallery);
export default router;