import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "collections",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

export const upload = multer(
  {
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },   // 10MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Only image allowed"), false);
    },
  });

export default cloudinary;