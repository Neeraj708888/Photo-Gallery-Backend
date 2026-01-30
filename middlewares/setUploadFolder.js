export const setUploadFolder = (type) => {
    return (req, res, next) => {
        if (type === "collection") {
            if (!req.body.collectionName) {
                return res.status(400).json({
                    success: false,
                    message: "collectionName is required",
                });
            }

            req.uploadFolder = `collections/${req.body.collectionName}`;
        }

        if (type === "gallery") {
            const { collectionName, galleryName } = req.body;

            if (!collectionName || !galleryName) {
                return res.status(400).json({
                    success: false,
                    message: "collectionName and galleryName required",
                });
            }

            req.uploadFolder = `collections/${collectionName}/${galleryName}`;
        }

        next();
    };
};
