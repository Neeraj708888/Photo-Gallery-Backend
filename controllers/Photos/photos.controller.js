import mongoose from "mongoose";
import PhotosModel from "../../models/Photos.model.js";
import cloudinary from "../../middlewares/cloudinary.js";

// Create Photos
// export const createPhotos = async (req, res) => {
//   try {
//     const { title, gallery } = req.body;

//     const images = req.files.map(file => ({
//       url: file.path,        // Cloudinary URL
//       public_id: file.filename, // Cloudinary public_id
//     }));

//     const photo = await Photo.create({
//       title,
//       images,
//       gallery,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Photo created successfully",
//       data: photo,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const createPhotos = async (req, res) => {
    try {
        const { title, gallery } = req.body;

        if (!gallery) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(gallery)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Gallery Id"
            });
        }

        const images = req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        const photo = await PhotosModel.create({
            title,
            gallery,
            images,
        });

        // ✅ FIXED LOOKUP
        const populatedphoto = await PhotosModel.findById(photo._id)
            .populate("gallery", "galleryName")
            .select("_id title images status createdAt");


        // ✅ SEND AGGREGATED DATA
        res.status(201).json({
            success: true,
            message: "Photos created successfully",
            data: populatedphoto,
        });

    } catch (error) {
        console.log("Photo Create Error: ", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};

// Update Photos
// export const updatePhotos = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { title, gallery, mode = "append", existingImages } = req.body;

//         // 1️⃣ Validate Photo Id
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid Photo Id",
//             });
//         }

//         // 2️⃣ Validate Gallery Id (ONLY if provided)
//         if (gallery && !mongoose.Types.ObjectId.isValid(gallery)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid Gallery Id",
//             });
//         }

//         const photo = await PhotosModel.findById(id);
//         if (!photo) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Photo not found",
//             });
//         }

//         // 3️⃣ Update simple fields
//         if (title) photo.title = title;
//         if (gallery) photo.gallery = gallery;

//         // 4️⃣ Parse existing images safely
//         let safeExistingImages = [];
//         if (existingImages) {
//             safeExistingImages = JSON.parse(existingImages);
//         }

//         // 5️⃣ Identify removed images
//         const removedImages = photo.images.filter(
//             oldImg =>
//                 !safeExistingImages.some(
//                     newImg => newImg.public_id === oldImg.public_id
//                 )
//         );

//         // 6️⃣ Delete removed images from Cloudinary
//         for (const img of removedImages) {
//             await cloudinary.uploader.destroy(img.public_id);
//         }

//         // 7️⃣ Map newly uploaded images
//         let newImages = [];
//         if (Array.isArray(req.files) && req.files.length > 0) {
//             newImages = req.files.map(file => ({
//                 url: file.path,        // ❗ FIXED
//                 public_id: file.filename,
//             }));
//         }

//         // 8️⃣ Merge logic (append / replace)
//         if (mode === "replace") {
//             photo.images = [...safeExistingImages, ...newImages];
//         } else {
//             photo.images = [...photo.images, ...newImages];
//         }

//         await photo.save();

//         // 9️⃣ Aggregated response with galleryName
//         const result = await PhotosModel.aggregate([
//             { $match: { _id: photo._id } },
//             {
//                 $lookup: {
//                     from: "galleries",
//                     localField: "gallery",
//                     foreignField: "_id",
//                     as: "gallery",
//                 },
//             },
//             { $unwind: "$gallery" },
//             {
//                 $project: {
//                     _id: 1,
//                     title: 1,
//                     images: 1,
//                     status: 1,
//                     updatedAt: 1,
//                     gallery: {
//                         _id: "$gallery._id",
//                         galleryName: "$gallery.galleryName",
//                     },
//                 },
//             },
//         ]);

//         res.status(200).json({
//             success: true,
//             message: "Photo updated successfully",
//             data: result[0],
//         });

//     } catch (error) {
//         console.log("Photo Update Error:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message || "Something went wrong",
//         });
//     }
// };

export const updatePhotos = async (req, res) => {
    try {
        const { title, gallery, removeImages = [] } = req.body;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({
            success: false,
            message: "Invalid Photo Id",
        });

        const photo = await PhotosModel.findById(id);

        if (!photo) return res.status(404).json({
            success: false,
            message: "Photo not found"
        });

        //    Delete Images from Cloudinary
        if (removeImages.length > 0) await Promise.all(removeImages.map((public_id) => cloudinary.uploader.destroy(public_id)));

        photo.images = photo.images.filter(img => (
            img => !removeImages.includes(img.public_id)
        ));

        // Add New Images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: req.path,
                public_id: file.filename,
            }));

            photo.images.push(...newImages);
        }

        // Updata Meta Data
        if (title) photo.title = title;
        if (gallery && mongoose.Types.ObjectId.isValid(gallery)) {
            photo.gallery = gallery;
        }

        await photo.save();

        // Fast Populate
        const updatedPhoto = await PhotosModel.findById(photo._id).populate("gallery title")
            .select("_id title images status createdAt");

        res.status(200).json({
            success: true,
            message: "Photo updated successfully",
            data: updatedPhoto,
        });

    } catch (error) {
        console.log("Photo updated Error: ", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong" || error.message
        });
    }
};

// Delete One Photo
export const deletePhotos = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate Photo Id
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({
            success: false,
            message: "Invalid Photo Id",
        });

        const photo = await PhotosModel.findById(id).lean();

        if (!photo) return res.status(404).json({
            success: false,
            message: "Photo not found",
        });

        // Delete All images from Cloudinary
        if (photo.images && photo.images.length > 0) {
            await Promise.all(
                photo.images.map(img => cloudinary.uploader.destroy(img.public_id))
            );
        }

        // Delete one Photo
        await photo.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: "Photo deleted successfully"
        });

    } catch (error) {
        console.log("Photo delete Error: ", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong" || error.message
        });
    }
};

// Delete One Photo
// export const deletePhotos = async (req, res) => {
//     try {
//         const { photoId } = req.params;
//         const public_id = req.query.public_id?.trim();
//         console.log("Requested public_id:", public_id);


//         // Validate Photo Id
//         if (!mongoose.Types.ObjectId.isValid(photoId)) return res.status(400).json({
//             success: false,
//             message: "Invalid Photo Id",
//         });

//         // Find Photo
//         const photo = await PhotosModel.findById(photoId);
//         if (!photo) return res.status(404).json({
//             success: false,
//             message: "Photo not found"
//         });

//         console.log("DB images:", photo.images.map(i => i.public_id));
//         // Prevent deleting last image
//         if (photo.images.length === 1) return res.status(400).json({
//             success: false,
//             message: "At least one image must remain in photo",
//         });

//         // Check image exists
//         const imageExists = photo.images.find(img => img.public_id === public_id);

//         if (!imageExists) return res.status(404).json({
//             success: false,
//             message: "Image not found",
//         });

//         await Promise.all([
//             cloudinary.uploader.destroy(public_id)
//         ]);

//         // Delete from Cloudinary
//         photo.images = photo.images.filter(img => img.public_id !== public_id);

//         await photo.save();

//         res.status(200).json({
//             success: true,
//             message: "Image deleted successfully",
//             data: {
//                 photoId: photo._id,
//                 remainigImages: photo.images.length,
//                 images: photo.images,
//             },
//         });

//     } catch (error) {
//         console.log("Single Image Delete Error: ", error);
//         res.status(500).json({
//             success: false,
//             message: error.message || "Something went wrong"
//         });
//     }
// };

// Get All Photos
export const getAllPhotos = async (req, res) => {
    try {
        const { page = 1, limit = 10, title, search = "", gallery, status } = req.query;

        const matchStage = {};

        // Search by title
        if (search) {
            matchStage.title = { $regex: search, $options: "i" };
        }

        // Filter by Gallery
        if (gallery && mongoose.Types.ObjectId.isValid(gallery)) matchStage.gallery = mongoose.Types.createFromHexString(gallery);

        // Filter by Status
        if (status !== undefined) matchStage.status = status === "true" || status === true;

        const skip = (Number(page - 1)) * Number(limit);

        // Fast Query
        const [photos, total] = await Promise.all([
            PhotosModel.find(matchStage)
                .populate("gallery title")
                .select("_id title images status createdAt updatedAt gallery")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),

            PhotosModel.countDocuments(matchStage)
        ]);

        // const total = await PhotosModel.countDocuments(matchStage);

        res.status(200).json({
            success: true,
            pagination: {
                total,
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            },

            data: photos

        });

    } catch (error) {
        console.log("Get All Photos Error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

// Get Single Photo
export const getSinglePhoto = async (req, res) => {
    try {
        const { id } = req.params;

        const photo = await PhotosModel.findById(id);

        if (!photo) {
            return res.status(404).json({
                success: false,
                message: "Photo not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Photo fetched successfully",
            data: photo,
        });

    } catch (error) {
        console.error("Get Single Photo Error: ", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
}
// Toggle Status
export const togglePhotoStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const photo = await PhotosModel.findById(id);

        if (!photo) return res.status(404).json({
            success: false,
            message: "Photo not found",
        });

        // Toggle Status
        photo.status = !photo.status;
        await photo.save();

        res.status(200).json({
            success: true,
            message: "Photo status updated successfully",
            data: {
                _id: photo._id,
                status: photo.status,
            }
        });
    } catch (error) {
        console.log("Toggle Status Error: ", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};