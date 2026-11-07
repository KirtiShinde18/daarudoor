const mongoose = require("mongoose")
module.exports = mongoose.model("user", new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, lowercase: true, unique: true, trim: true },
    password: { type: String, required: true },
    mobile: { type: String },
    department: { type: String },

    active: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
    role: { type: String, enum: ["admin", "customer", "delivery"], default: "customer" },
    profilePic: { type: String },
    
    gender: { type: String, enum: ["Male", "Female"], default: null },
    birthYear: { type: Number, default: null },
    onboardingCompleted: { type: Boolean, default: false },

    encryptedAadhaar: { type: String },
    aadhaarHash: { type: String, sparse: true, unique: true },
    maskedAadhaar: { type: String },
    
    encryptedPan: { type: String },
    panHash: { type: String, sparse: true, unique: true },
    maskedPan: { type: String },
    
    address: { type: String },
    alternativeMobile: { type: String },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        formattedAddress: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
    },

    ageVerification: {
        status: {
            type: String,
            enum: ["NOT_STARTED", "PENDING", "VERIFIED", "FAILED", "EXPIRED"],
            default: "NOT_STARTED"
        },
        dateOfBirth: { type: Date, default: null },
        verifiedAt: { type: Date, default: null },
        verificationReference: { type: String, default: null },
        provider: { type: String, default: null },
        failureReason: { type: String, default: null }
    },

    otp: { type: String },
    otpSendOn: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    accessToken: { type: String },
    isDelete: { type: Boolean, default: false },

}, { timestamps: true }))