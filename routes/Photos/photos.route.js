
import express from "express";
import { createPhotos, deletePhotos, getAllPhotos, getImagesByGallery, getSinglePhoto, togglePhotoStatus, updatePhotos } from "../../controllers/Photos/photos.controller.js";
import { upload } from "../../middlewares/cloudinary.js";
import { verifyToken } from "../../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/create", verifyToken, upload.array("images", 10), createPhotos);
router.post("/update/:id", verifyToken, upload.array("images", 10), updatePhotos);
router.delete("/:photoId/image", verifyToken, deletePhotos);
router.get("/", getAllPhotos);
router.get("/:galleryId", getImagesByGallery);
router.patch("/status/:id", verifyToken, togglePhotoStatus);
router.get("/:id", getSinglePhoto);

export default router;