import multer from 'multer';
import path from 'path';

// Storage Engine
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/collections");
//     },

//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));  // Unique file name
//     }
// });

// File filter (only images)
// const fileFilter = (req, file, cb) => {
//     const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

//     if (allowed.includes(file.mimetype)) cb(null, true);
//     else cb(new Error("Only image allowed !"), false);
// };

// export const upload = multer({ storage, fileFilter });