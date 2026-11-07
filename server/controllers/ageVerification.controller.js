const User = require('../models/User');
const { calculateAge, isAgeEligible, getProvider } = require('../services/ageVerification.service');

// Save DOB
exports.saveDOB = async (req, res) => {
    try {
        const { dateOfBirth } = req.body;
        if (!dateOfBirth) {
            return res.status(400).json({ success: false, message: "Date of Birth is required" });
        }

        const user = await User.findById(req.user);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Basic validation
        try {
            calculateAge(dateOfBirth); 
        } catch (e) {
            return res.status(400).json({ success: false, code: "INVALID_DOB", message: e.message });
        }

        // Initialize verification object if it doesn't exist
        const currentStatus = user.ageVerification?.status;
        
        // We only allow setting DOB if they aren't already verified
        if (currentStatus === "VERIFIED") {
            return res.status(400).json({ success: false, message: "User is already verified. Cannot change DOB." });
        }

        const state = user.location?.state || 'Unknown';
        if (!isAgeEligible(dateOfBirth, state, 'alcohol')) {
             return res.status(403).json({ success: false, code: "UNDER_MINIMUM_AGE", message: "You do not meet the minimum age requirement." });
        }

        user.ageVerification = {
            ...user.ageVerification,
            dateOfBirth,
            status: "PENDING" // Starts pending state
        };

        await user.save();

        return res.status(200).json({
            success: true,
            ageVerification: {
                status: user.ageVerification.status,
                dateOfBirth: user.ageVerification.dateOfBirth
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Start Verification
exports.startVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.ageVerification?.dateOfBirth) {
            return res.status(400).json({ success: false, message: "Please save Date of Birth first" });
        }

        if (user.ageVerification?.status === "VERIFIED") {
            return res.status(400).json({ success: false, message: "Already verified" });
        }

        const provider = getProvider();
        const session = await provider.createSession(user);

        user.ageVerification.status = "PENDING";
        user.ageVerification.verificationReference = session.referenceId;
        user.ageVerification.provider = process.env.AGE_VERIFICATION_PROVIDER || 'dummy';
        
        await user.save();

        return res.status(200).json({
            success: true,
            status: "PENDING",
            verificationReference: session.referenceId,
            verificationUrl: session.url,
            sdkToken: session.sdkToken // if applicable
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to start verification" });
    }
};

// Get Status
exports.getVerificationStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Optionally, check with provider if it's currently pending
        if (user.ageVerification?.status === "PENDING" && user.ageVerification?.verificationReference) {
            try {
                const provider = getProvider();
                const remoteStatus = await provider.getStatus(user.ageVerification.verificationReference);
                
                if (remoteStatus && remoteStatus.status !== "PENDING") {
                    user.ageVerification.status = remoteStatus.status;
                    if (remoteStatus.status === "VERIFIED") {
                        user.ageVerification.verifiedAt = remoteStatus.verifiedAt || new Date();
                    }
                    await user.save();
                }
            } catch(e) {
                console.error("Error polling provider status", e);
            }
        }

        return res.status(200).json({
            success: true,
            ageVerification: user.ageVerification || { status: "NOT_STARTED" }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Webhook
exports.handleWebhook = async (req, res) => {
    try {
        const provider = getProvider();
        const signature = req.headers['x-provider-signature'];
        
        let result;
        try {
            result = await provider.verifyWebhook(req.body, signature);
        } catch (e) {
            return res.status(401).json({ success: false, message: "Invalid signature" });
        }

        const { referenceId, status, reason } = result;
        
        const user = await User.findOne({ "ageVerification.verificationReference": referenceId });
        if (!user) {
            return res.status(200).json({ success: true, message: "User not found, but acknowledged" }); // Idempotent
        }

        if (user.ageVerification.status === status) {
             return res.status(200).json({ success: true, message: "Already in this status" });
        }

        user.ageVerification.status = status;
        if (status === "VERIFIED") {
            user.ageVerification.verifiedAt = new Date();
        } else if (status === "FAILED") {
            user.ageVerification.failureReason = reason;
        }

        await user.save();

        return res.status(200).json({ success: true, message: "Webhook processed" });

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ success: false, message: "Internal server error processing webhook" });
    }
};
