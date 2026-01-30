import mongoose from "mongoose";
import GalleryModel from "../../models/Gallery.model.js";
import cloudinary from "../../middlewares/cloudinary.js";
import { slug } from "../../helpers/slug.js";

//Create Gallery
export const createGallery = async (req, res) => {
    try {
        const { galleryName, collection } = req.body;

        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

        if (!galleryName || !collection) {
            return res.status(400).json({
                success: false,
                message: "galleryName and collection are required",
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one image required",
            });
        }

        const images = req.files.map(file => ({
            url: file.path,
            public_id: file.filename,
        }));

        const gallery = await GalleryModel.create({
            galleryName,
            collection,
            images,
        });

        res.status(201).json({
            success: true,
            message: "Gallery created successfully",
            data: gallery,
        });

    } catch (error) {
        console.error("CREATE GALLERY ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update Gallery Using Aggregate Pipeline
export const updateGallery = async (req, res) => {
    try {
        const { id } = req.params;
        const { galleryName, collection, removedImages } = req.body;

        // ✅ Validate Gallery ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Gallery Id",
            });
        }

        // ✅ Validate Collection ID
        if (collection && !mongoose.Types.ObjectId.isValid(collection)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Collection Id",
            });
        }

        // 🔍 Find existing gallery
        const gallery = await GalleryModel.findById(id);
        if (!gallery) {
            return res.status(404).json({
                success: false,
                message: "Gallery not found",
            });
        }

        // 🔹 Clone images
        let images = [...gallery.images];

        /* ---------------- REMOVE IMAGES ---------------- */
        if (removedImages) {
            const removedIds = JSON.parse(removedImages); // array of public_id

            for (const img of images) {
                if (removedIds.includes(img.public_id)) {
                    // 🔥 delete from cloudinary
                    await cloudinary.uploader.destroy(img.public_id);
                }
            }

            // 🧹 remove from DB array
            images = images.filter(
                (img) => !removedIds.includes(img.public_id)
            );
        }

        /* ---------------- ADD NEW IMAGES ---------------- */
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file) => ({
                url: file.path,        // ✅ already uploaded
                public_id: file.filename,
            }));

            images.push(...newImages);
        }

        /* ---------------- UPDATE FIELDS ---------------- */
        if (galleryName) gallery.galleryName = galleryName;
        if (collection) gallery.collection = collection;
        gallery.images = images;

        await gallery.save();

        /* ---------------- POPULATED RESPONSE ---------------- */
        const populatedGallery = await GalleryModel.findById(id)
            .populate("collection", "_id collectionName")
            .select("_id galleryName images status createdAt updatedAt")
            .lean();

        res.status(200).json({
            success: true,
            message: "Gallery updated successfully",
            data: populatedGallery,
        });

    } catch (error) {
        console.error("UPDATE GALLERY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};

// Delete Gallery
export const deleteGallery = async (req, res) => {
    try {

        const { id } = req.params;

        // Find Gallery
        const gallery = await GalleryModel.findById(id).populate("collection", "collectionName");

        if (!gallery) return res.status(404).json({
            success: false,
            message: "Gallery not found",
        });

        const collectionSlug = slug(gallery.collection.collectionName);
        const gallerySlug = slug(gallery.galleryName);

        // Delet Gallery Images from Cloudinary
        for (const image of gallery.images) {
            await cloudinary.uploader.destroy(image.public_id);
        }

        // Delete Gallery Folder
        const galleryFolder = `Photo Gallery/collections/${collectionSlug}/${gallerySlug}`;

        await cloudinary.api.delete_resources_by_prefix(galleryFolder);
        await cloudinary.api.delete_folder(galleryFolder);

        // DB Delete Folder
        await GalleryModel.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Gallery deleted permanently successfully"
        });

    } catch (error) {
        console.log("Delete Gallery Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};

// Toggle Status
export const toggleGalleryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (typeof status !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Status must be boolean",
            });
        }

        const updated = await GalleryModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Gallery not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Gallery status has been changed",
            updated,
        });

    } catch (error) {
        console.error("Toggle Gallery Status Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Error in gallery status change",
            id: id,
        });
    }
};

// Get Gallery + Search
export const getAllGallery = async (req, res) => {
    try {
        const { status, search } = req.query;

        const pipeline = [];

        // 🔍 Filter by status
        if (status !== undefined) {
            pipeline.push({
                $match: { status: status === "true" },
            });
        }

        // 🔍 Search by galleryName
        if (search) {
            pipeline.push({
                $match: {
                    galleryName: { $regex: search, $options: "i" },
                },
            });
        }

        // 🔗 JOIN Collection
        pipeline.push(
            {
                $lookup: {
                    from: "collections",
                    localField: "collection",
                    foreignField: "_id",
                    as: "collection",
                },
            },
            { $unwind: "$collection" }
        );

        // 🎯 Project only required fields
        pipeline.push({
            $project: {
                _id: 1,
                galleryName: 1,
                status: 1,
                images: 1,
                createdAt: 1,
                "collection._id": 1,
                "collection.collectionName": 1,
            },
        });

        // ⬇️ Latest first
        pipeline.push({ $sort: { createdAt: -1 } });

        const galleries = await GalleryModel.aggregate(pipeline);

        res.status(200).json({
            success: true,
            total: galleries.length,
            data: galleries,
        });

    } catch (error) {
        console.error("GET GALLERIES ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};

// Get Single Gellery
export const getSingleGallery = async (req, res) => {
    try {
        const { id } = req.params;

        const gallery = await GalleryModel.findById(id).populate("collection", "collectionName status thumbnail -_id");

        if (!gallery) return res.status(404).json({
            success: false,
            message: "Gallery not found",
        });

        res.status(200).json({
            success: true,
            data: gallery,
        });


    } catch (error) {
        console.log("Get Single Gallery Error:", error);
        res.status(500).json({
            message: "Something went wrong" || error.message
        });
    }
};
















































// Update Gallery
// export const updateGallery = async (req, res) => {
//     try {

//         const { id } = req.params;

//         const gallery = await GalleryModel.findById(id);
//         if (!gallery) return res.status(404).json({ message: "Galley not found" });

//         if (req.body.galleryName) gallery.galleryName = req.body.galleryName;
//         if (req.body.collection) gallery.collection = req.body.collection;

//         if (req.file) {
//             gallery.thumbnail = {
//                 url: req.file.path,
//                 public_id: req.file.filename,
//             }
//         }

//         await gallery.save();
//         res.status(200).json({ success: true, data: gallery });

//     } catch (error) {
//         res.status(500).json({ message: "Something went wrong" || error.message });
//     }
// }
// Get Single Gallery by Using lookup + projects
// export const getSingleGallery = async (req, res) => {
//     try {
//         const { id } = req.params;

//         if (!mongoose.isValidObjectId(id)) return res.status(400).json({
//             success: false,
//             message: "Invalid Gallery Id",
//         });

//         const pipeline = [
//             {
//                 $match: {
//                     _id: mongoose.Types.ObjectId.createFromHexString(id),
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "collections",           // Kis collection DB se
//                     localField: "collection",      // apni kis local field
//                     foreignField: "_id",
//                     as: "collection"
//                 },
//             },
//             { $unwind: "$collection" },
//             {
//                 $project: {
//                     __v: 0,
//                     "collection.__v": 0,
//                     "collection.createdAt": 0,
//                     "collection.updatedAt": 0,
//                 }
//             }
//         ];

//         const gallery = await GalleryModel.aggregate(pipeline);

//         if (!gallery.length) return res.status(404).json({
//             success: false,
//             message: "Gallery not found",
//         });

//         res.status(200).json({
//             success: true,
//             total: gallery.length,
//             data: gallery[0],
//         });

//     } catch (error) {
//         console.log("Get Single Gallery Error:", error);
//         res.status(500).json({
//             message: "Something went wrong" || error.message
//         });
//     }
// }
// Search and Filter
// export const filterGallery = async (req, res) => {
//     try {
//         const { q, status, collection } = req.query;

//         const query = {};

//         if (q) query.galleryName = { $regex: q, $options: "i" };
//         if (status !== undefined) query.status = status === "true";
//         if (collection) query.collection = collection;

//         const galleries = await GalleryModel.find(query).sort({ createdAt: -1 }).populate("collection", "collectionName");

//         res.status(200).json({
//             success: true,
//             total: galleries.length,
//             data: galleries
//         });


//     } catch (error) {
//         res.status(500).json({ message: "Something went wrong" || error.message });
//     }
// } 
