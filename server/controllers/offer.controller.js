const Offer = require("../models/Offer");
const { uploadImage, deleteImage } = require("../utils/upload");

exports.createOffer = async (req, res) => {
    try {
        const { title, description, image, discountType, discountValue, minOrderValue, maxDiscount, code, startDate, endDate, isActive } = req.body;
        
        let imageData = { secure_url: "", public_id: "" };
        if (image && image.startsWith("data:image")) {
            const uploaded = await uploadImage(image, "offers");
            if (uploaded) {
                imageData = uploaded;
            }
        } else {
            return res.status(400).json({ success: false, message: "Image is required" });
        }

        const offer = await Offer.create({
            title, description, image: imageData, discountType, discountValue,
            minOrderValue, maxDiscount, code, startDate, endDate, isActive
        });

        res.status(201).json({ success: true, data: offer });
    } catch (error) {
        console.error("Create Offer Error:", error);
        res.status(500).json({ success: false, message: "Failed to create offer" });
    }
};

exports.updateOffer = async (req, res) => {
    try {
        const { title, description, image, discountType, discountValue, minOrderValue, maxDiscount, code, startDate, endDate, isActive } = req.body;
        
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        if (image && image.startsWith("data:image")) {
            const uploaded = await uploadImage(image, "offers");
            if (uploaded) {
                if (offer.image && offer.image.public_id) {
                    await deleteImage(offer.image.public_id);
                }
                offer.image = uploaded;
            }
        }

        offer.title = title || offer.title;
        offer.description = description !== undefined ? description : offer.description;
        offer.discountType = discountType || offer.discountType;
        offer.discountValue = discountValue !== undefined ? discountValue : offer.discountValue;
        offer.minOrderValue = minOrderValue !== undefined ? minOrderValue : offer.minOrderValue;
        offer.maxDiscount = maxDiscount !== undefined ? maxDiscount : offer.maxDiscount;
        offer.code = code !== undefined ? code : offer.code;
        offer.startDate = startDate || offer.startDate;
        offer.endDate = endDate || offer.endDate;
        offer.isActive = isActive !== undefined ? isActive : offer.isActive;

        await offer.save();
        res.status(200).json({ success: true, data: offer });
    } catch (error) {
        console.error("Update Offer Error:", error);
        res.status(500).json({ success: false, message: "Failed to update offer" });
    }
};

exports.softDeleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        
        offer.isDeleted = true;
        offer.deletedAt = new Date();
        await offer.save();

        res.status(200).json({ success: true, message: "Offer soft deleted successfully" });
    } catch (error) {
        console.error("Soft Delete Offer Error:", error);
        res.status(500).json({ success: false, message: "Failed to soft delete offer" });
    }
};

exports.restoreOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        
        offer.isDeleted = false;
        offer.deletedAt = null;
        await offer.save();

        res.status(200).json({ success: true, message: "Offer restored successfully" });
    } catch (error) {
        console.error("Restore Offer Error:", error);
        res.status(500).json({ success: false, message: "Failed to restore offer" });
    }
};

exports.permanentDeleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        
        if (offer.image && offer.image.public_id) {
            await deleteImage(offer.image.public_id);
        }

        await Offer.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Offer permanently deleted" });
    } catch (error) {
        console.error("Permanent Delete Offer Error:", error);
        res.status(500).json({ success: false, message: "Failed to permanently delete offer" });
    }
};

exports.getAdminOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: offers });
    } catch (error) {
        console.error("Get Admin Offers Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch offers" });
    }
};

exports.getDeletedOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ isDeleted: true }).sort({ deletedAt: -1 });
        res.status(200).json({ success: true, data: offers });
    } catch (error) {
        console.error("Get Deleted Offers Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch deleted offers" });
    }
};

exports.getActiveOffers = async (req, res) => {
    try {
        const now = new Date();
        const offers = await Offer.find({
            isActive: true,
            isDeleted: false,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: offers });
    } catch (error) {
        console.error("Get Active Offers Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch active offers" });
    }
};

exports.validateOffer = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        const now = new Date();
        const offer = await Offer.findOne({ 
            code, 
            isActive: true,
            isDeleted: false,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        if (!offer) {
            return res.status(404).json({ success: false, message: "Invalid or expired offer" });
        }

        if (offer.minOrderValue && cartTotal < offer.minOrderValue) {
            return res.status(400).json({ success: false, message: `Minimum order value of ₹${offer.minOrderValue} required` });
        }

        let discount = 0;
        if (offer.discountType === 'PERCENTAGE') {
            discount = (cartTotal * offer.discountValue) / 100;
            if (offer.maxDiscount && discount > offer.maxDiscount) {
                discount = offer.maxDiscount;
            }
        } else {
            discount = offer.discountValue;
        }

        res.status(200).json({ success: true, data: { offer, discount } });
    } catch (error) {
        console.error("Validate Offer Error:", error);
        res.status(500).json({ success: false, message: "Failed to validate offer" });
    }
};
