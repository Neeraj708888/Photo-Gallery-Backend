
import { slug } from "../../helpers/slug.js";
import cloudinary from "../../middlewares/cloudinary.js";
import CollectionModel from "../../models/Collection.model.js";
import GalleryModel from "../../models/Gallery.model.js";


// Create Collection

export const createCollection = async (req, res) => {
  try {
    const collectionName = req.body?.collectionName?.trim();

    // 🔴 Validation
    if (!collectionName) {
      return res.status(400).json({
        success: false,
        message: "collectionName is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail image is required",
      });
    }

    // 🔴 Prevent duplicate collection
    const existingCollection = await CollectionModel.findOne({
      collectionName: {
        $regex: `^${collectionName}$`,
        $options: "i", // case-insensitive
      },
    });

    if (existingCollection) {
      return res.status(409).json({
        success: false,
        message: "Collection already exists",
      });
    }

    // ✅ Create collection
    const collection = await CollectionModel.create({
      collectionName,
      thumbnail: {
        url: req.file.path,           // cloudinary secure_url
        public_id: req.file.filename, // cloudinary public_id
      },
    });

    return res.status(201).json({
      success: true,
      message: "Collection created successfully",
      data: collection,
    });

  } catch (error) {
    console.error("CREATE COLLECTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update Collection
export const updateCollection = async (req, res) => {
  try {
    const collection = await CollectionModel.findById(req.params.id);

    if (!collection) return res.status(404).json({ message: "Collection not found" });

    // Update the name
    if (req.body.collectionName) collection.collectionName = req.body.collectionName;

    // Update Thumbnail
    if (req.file) {
      // Old image destroy from cloudinary
      await cloudinary.uploader.destroy(collection.thumbnail.public_id);

      // Set New Image
      collection.thumbnail = {
        url: req.file.path,
        public_id: req.file.filename,
      }
    }

    await collection.save();
    res.json(collection);

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" || error.message });
  }
};

// Delete Collection
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    // Find Collection
    const collection = await CollectionModel.findById(id);
    if (!collection) return res.status(404).json({
      success: false,
      message: "Collection not found"
    });

    // Store Collection Slug name
    const collectionSlug = slug(collection.collectionName);

    // Delete Gallery Images
    const galleries = await GalleryModel.find({ collection: id });

    for (const gallery of galleries) {
      for (const image of gallery.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    // Delete Gallery Name and doucments
    await GalleryModel.deleteMany({ collection: id });

    // Delete Collection Thumbnail
    if (collection.thumbnail?.public_id) await cloudinary.uploader.destroy(collection.thumbnail.public_id);

    // Delete Entire folder recursively
    const folderPath = `Photo Gallery/collections/${collectionSlug}`;

    await cloudinary.api.delete_resources_by_prefix(folderPath);

    await cloudinary.api.delete_folder(folderPath);

    // Delete Collection Documents
    await CollectionModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Collection deleted permanently successfully"
    });

  } catch (error) {
    console.log("DELETE COLLECTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

// Get All Collection
export const getAllCollection = async (req, res) => {
  try {
    const collections = await CollectionModel.find().sort({ createdAt: -1 });

    res.status(200).json({ success: true, total: collections.length, data: collections });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" || error.message });
  }
};

// Get Single Collection using Id
export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await CollectionModel.findById(id);

    if (!collection) return res.status(404).json({ message: "Collection not found" });

    res.status(200).json({
      success: true,
      data: collection,
    });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" || error.message });

  }
};

// Toggle Status
export const toggleCollectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({ message: "Status must be boolean" });
    }

    const updated = await CollectionModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({
      message: "Collection not found"
    });

    res.status(200).json({
      message: "Collection status has been changed",
      updated,
    });


  } catch (error) {
    console.log("Collection Status Error: ", error);
    res.status(500).json({
      success: true,
      message: "Internal Error in collection status change",
      id: id,
    });
  }
}

// Search Collection
export const searchCollection = async (req, res) => {
  try {
    console.log("SEARCH HIT", req.query);
    const { q, status } = req.query;

    // Build Dynamic Query
    const query = {};

    // Search By Name
    if (q) query.collectionName = { $regex: q, $options: "i" };

    // Optional Status filter (true / false)
    if (status != undefined) query.status = status === "true";

    const collections = await CollectionModel.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: collections.length,
      data: collections,
    });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" || error.message });
  }
};





// Toggle Status
// export const toggleCollectionStatus = async (req, res) => {

//   try {
//     console.log("STATUS TOGGLE API HIT", req.params.id);

//     const { id } = req.params;

//     const collection = await CollectionModel.findById(id);

//     if (!collection) return res.status(404).json({ message: "Collection not found" });

//     // Toggle Status
//     console.log("OLD STATUS:", collection.status);

//     collection.status = !collection.status;
//     await collection.save();
//     console.log("OLD STATUS:", collection.status);

//     res.status(200).json({
//       success: true,
//       message: "Status updated successfully",
//       status: collection.status,
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong" || error.message });
//   }
// };