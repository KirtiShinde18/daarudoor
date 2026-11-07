const User = require('../models/User');
const { isAgeEligible } = require('../services/ageVerification.service');
const { verificationRequired } = require('../utils/ageVerification.config');

exports.requireVerifiedAge = async (req, res, next) => {
    try {
        if (!verificationRequired) {
            return next();
        }

        // Assuming req.user is set by auth middleware
        const user = await User.findById(req.user);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const verification = user.ageVerification || {};

        if (verification.status === "VERIFIED") {
            // Re-verify eligibility just in case DOB was manipulated or rules changed
            if (!verification.dateOfBirth) {
                 return res.status(403).json({
                    success: false,
                    code: "AGE_VERIFICATION_REQUIRED",
                    message: "Date of Birth is missing."
                });
            }
            
            // Assume category is passed in body if needed, otherwise use a generic check
            const state = user.location?.state || 'Unknown';
            const category = 'alcohol'; // Defaulting to alcohol

            if (!isAgeEligible(verification.dateOfBirth, state, category)) {
                return res.status(403).json({
                    success: false,
                    code: "UNDER_MINIMUM_AGE",
                    message: "You do not meet the minimum age requirement."
                });
            }

            return next();
        }

        return res.status(403).json({
            success: false,
            code: "AGE_VERIFICATION_REQUIRED",
            message: "Age verification is required before placing an alcohol order."
        });
    } catch (error) {
        console.error("Age Verification Middleware Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error during age check" });
    }
};

exports.requireDeliveryAgeCheck = async (req, res, next) => {
    try {
        const orderId = req.params.id || req.body.orderId;
        const Order = require('../models/Order');
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.deliveryAgeVerification?.status === "VERIFIED" || order.deliveryAgeVerification?.status === "NOT_REQUIRED") {
            return next();
        }

        return res.status(403).json({
            success: false,
            code: "DELIVERY_AGE_CHECK_REQUIRED",
            message: "Age verification must be completed before this order can be delivered."
        });

    } catch(error) {
         return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
