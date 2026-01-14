import express from "express";
import { createGallery, deleteGallery, getAllGallery, toggleGalleryStatus, updateGallery } from "../../controllers/Gallery/gallery.controller.js";
import { upload } from "../../middlewares/cloudinary.js";

const router = express.Router();


// router.get("/search", filterGallery);
router.post("/create", upload.single("thumbnail"), createGallery);
router.post("/update/:id", upload.single("thumbnail"), updateGallery);
router.patch("/status/:id", toggleGalleryStatus);
router.delete("/:id", deleteGallery);
router.get("/", getAllGallery);

export default router;