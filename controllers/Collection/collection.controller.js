
import cloudinary from "../../middlewares/cloudinary.js";
import CollectionModel from "../../models/Collection.model.js";


// Create Collection
export const createCollection = async (req, res) => {
  try {
    console.log("Body: ", req.body);
    console.log("File: ", req.file);

    const { collectionName } = req.body;

    if (!req.file) return res.status(400).json({ message: "Thumbnail is required" });

    const collection = await CollectionModel.create({
      collectionName,
      thumbnail: {
        url: req.file.path,
        public_id: req.file.filename,
      },
    });

    res.status(201).json(collection);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


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
    const collection = await CollectionModel.findById(id);

    if (!collection) return res.status(404).json({ message: "Collection not found" });

    // Delete image from cloudinary - if exists
    if (collection.thumbnail?.public_id) {
      const cloudResponse = await cloudinary.uploader.destroy(collection.thumbnail?.public_id);

      if (cloudResponse.result !== "ok") {
        console.warn("Cloudinary deleted failed",
          cloudResponse
        );
      }
    }

    // Delete Image from Cloudinary first
    // await cloudinary.uploader.destroy(collection.thumbnail.public_id);

    // Delete DB record
    // await collection.deleteOne();
    await CollectionModel.findByIdAndDelete(id);

    res.json({ message: "Collection deleted successfully", id });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" || error.message });
  }
};

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
    console.log("STATUS TOGGLE API HIT", req.params.id);

    const { id } = req.params;

    const collection = await CollectionModel.findById(id);

    if (!collection) return res.status(404).json({ message: "Collection not found" });

    // Toggle Status
    console.log("OLD STATUS:", collection.status);
    collection.status = !collection.status;
    await collection.save();
    console.log("OLD STATUS:", collection.status);

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      status: collection.status,
    });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" || error.message });
  }
};

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
