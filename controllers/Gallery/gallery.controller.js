import mongoose, { version } from "mongoose";
import GalleryModel from "../../models/Gallery.model.js";
import cloudinary from "../../middlewares/cloudinary.js";

//Create Gallery
export const createGallery = async (req, res) => {
    try {

        const { galleryName, collection } = req.body;

        // ✅ Required check
        if (!galleryName || !collection) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing",
            });
        }

        // ✅ ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(collection)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Collection Id",
            });
        }

        // ✅ Create gallery
        const gallery = await GalleryModel.create({
            galleryName,
            collection,
            thumbnail: req.file
                ? { url: req.file.path, public_id: req.file.filename }
                : undefined,
        });

        // ✅ Lookup + Project
        const result = await GalleryModel.aggregate([
            {
                $match: { _id: gallery._id },
            },
            {
                $lookup: {
                    from: "collections",         // ----> DB Name
                    localField: "collection",    // ----> Gallery Schema ki local Field
                    foreignField: "_id",        //  ----> Collection DB m Gallery ki _id
                    as: "collection",           //  ----> Show karo same collection field
                },
            },
            { $unwind: "$collection" }, // ✅ FIXED
            {
                $project: {
                    _id: 1,
                    galleryName: 1,
                    status: 1,
                    thumbnail: 1,
                    createdAt: 1,
                    "collection._id": 1,                 // ✅ FIXED
                    "collection.collectionName": 1,      // ✅ FIXED
                },
            },
        ]);

        res.status(201).json({
            success: true,
            message: "Gallery created successfully",
            data: result[0],
        });

    } catch (error) {
        console.error("CREATE GALLERY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
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

// Update Gallery Using Aggregate Pipeline
export const updateGallery = async (req, res) => {
    try {
        alo:

        console.log("BODY:", req.body);
        console.log("FILE:", req.file);
        const { id } = req.params;
        const { galleryName, collection } = req.body || {};

        // 🔴 Validate gallery id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Gallery Id",
            });
        }

        // 🔴 Validate collection id (if provided)
        if (collection && !mongoose.Types.ObjectId.isValid(collection)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Collection Id",
            });
        }

        // 🔄 Build update object dynamically
        const updateData = {};
        if (galleryName) updateData.galleryName = galleryName;
        if (collection) updateData.collection = collection;
        // if (status !== undefined) updateData.status = status === "true" || status === true;

        if (req.file) {
            updateData.thumbnail = {
                url: req.file.path,
                public_id: req.file.filename,
            };
        }

        // 🔴 Nothing to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided to update",
            });
        }

        // ✅ Update Gallery
        const updatedGallery = await GalleryModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedGallery) {
            return res.status(404).json({
                success: false,
                message: "Gallery not found",
            });
        }

        // 🔥 Fetch updated gallery with lookup + project
        const result = await GalleryModel.aggregate([
            { $match: { _id: updatedGallery._id } },
            {
                $lookup: {
                    from: "collections",
                    localField: "collection",
                    foreignField: "_id",
                    as: "collection",
                },
            },
            { $unwind: "$collection" },
            {
                $project: {
                    _id: 1,
                    galleryName: 1,
                    status: 1,
                    thumbnail: 1,
                    updatedAt: 1,
                    "collection._id": 1,
                    "collection.collectionName": 1,
                },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "Gallery updated successfully",
            data: result[0],
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

        // Validate Gallery Id
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({
            success: false,
            message: "Invalid Gallery Id",
        });

        // Find Gallery First (thumbnail cleanup)
        const gallery = await GalleryModel.findById(id);

        if (!gallery) return res.status(404).json({
            success: false,
            message: "Gallery not found"
        });

        // Delete Thumbnail from Cloudinary
        if (gallery.thumbnail?.public_id) {
            const cloudResponse = await cloudinary.uploader.destroy(gallery.thumbnail.public_id);

            if (cloudResponse.result !== "ok") {
                console.warn("Cloudinary deleted failed", cloudResponse);
            }
        }

        // Delete Gallery
        await GalleryModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Gallery deleted",
            id
        });

    } catch (error) {
        console.log("Delete Gallery Error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong" || error.message
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
        const { collection, status, search } = req.query;

        const pipeline = [];

        // 🔍 Filter by status
        if (status !== undefined) {
            pipeline.push({
                $match: { status: status === "true" },
            });
        }

        // 🔍 Filter by collection
        // if (collection && mongoose.Types.ObjectId.isValid(collection)) {
        //     pipeline.push({
        //         $match: {
        //             collection: new mongoose.Types.ObjectId(collection),
        //         },
        //     });
        // }

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
                thumbnail: 1,
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
