import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { slug } from "../helpers/slug.js";
import CollectionModel from "../models/Collection.model.js";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "collections",
//     allowed_formats: ["jpg", "jpeg", "png", "webp", "video"],
//   },
// });

// export const upload = multer(
//   {
//     storage,
//     limits: { fileSize: 10 * 1024 * 1024 },   // 10MB
//     fileFilter: (req, file, cb) => {
//       if (file.mimetype.startsWith("image/")) cb(null, true);
//       else cb(new Error("Only image allowed"), false);
//     },
//   });

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {

    // multer has parsed form-data here ✅
    const body = req.body || {};

    let folder = "Photo Gallery/temp";

    // ===== COLLECTION CREATE =====
    if (req.baseUrl.includes("collections")) {
      if (!body.collectionName) {
        throw new Error("collection name is required");
      }

      folder = `Photo Gallery/collections/${slug(body.collectionName)}/thumbnail`;
    }

    // ===== GALLERY CREATE =====
    else if (req.baseUrl.includes("gallery")) {

      const { collection, galleryName } = body;

      if (!collection || !galleryName) {
        throw new Error("collectionId and galleryName are required");
      }

      // Fetch from DB
      const collectionsData = await CollectionModel.findById(collection);

      if (!collectionsData) throw new Error("Invalid collectionId");

      const collectionSlug = slug(collectionsData.collectionName);
      const gallerySlug = slug(galleryName);

      folder = `Photo Gallery/collections/${collectionSlug}/${gallerySlug}/images`;
    }

    return {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});



export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default cloudinary;

