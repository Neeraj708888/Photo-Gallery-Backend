import mongoose from "mongoose";
import GalleryModel from "../../models/Gallery.model.js";

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
export const updateGallery = async () => {
    try {

        const { id } = req.params;

        const gallery = await GalleryModel.findById(id);
        if (!gallery) return res.status(404).json({ message: "Galley not found" });

        if (req.body.galleryName) gallery.galleryName = req.body.galleryName;
        if (req.body.collection) gallery.collection = req.body.collection;

        if (req.file) {
            gallery.thumbnail = {
                url: req.file.path,
                public_id: req.file.filename,
            }
        }

        await gallery.save();
        res.status(200).json({ success: true, data: gallery });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong" || error.message });
    }
}

// Delete Gallery
export const deleteGallery = async (req, res) => {
    try {

        const { id } = req.params;

        const gallery = await GalleryModel.findByIdAndDelete(id);

        if (!gallery) return res.status(404).json({ message: "Gallery not found" });

        res.status(200).json({ success: true, message: "Gallery deleted" });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong" || error.message });
    }
}

// Toggle Status
export const toggleGalleryStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const gallery = await GalleryModel.findById(id);
        if (!gallery) res.status(404).json({ message: "Gallery not found" });

        gallery.status = !gallery.status;
        await gallery.save();

        res.status(200).json({
            success: true,
            status: gallery.status,
        });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong" || error.message });
    }
}

// Get Gallery
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