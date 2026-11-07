const { loginCustomer, loginAdmin, loginDelivery, getCustomerProfile, registerCustomer, sendOTP, verifyOTP, sendForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword, signoutCustomer, signoutAdmin, verifyEmailOTP } = require("../controllers/auth.controller")
const { adminProtect, protect } = require("../middlewares/auth.middlewares")

const router = require("express").Router()

router
    .post("/customer/login", loginCustomer)
    .post("/admin/login", loginAdmin)
    .post("/delivery/login", loginDelivery)
    .get("/customer/me", protect("customer"), getCustomerProfile)
    .post("/customer/register", registerCustomer)
    
    // Existing routes compatibility
    .post("/signin", loginCustomer) // fallback for old frontend
    .post("/register-customer", registerCustomer)
    .post("/verify-email-otp", verifyEmailOTP)
    .post("/signout-customer", protect("customer"), signoutCustomer)
    .post("/signout-admin", protect("admin"), signoutAdmin)
    .post("/send-otp", sendOTP)
    .post("/verify-otp", verifyOTP)
    .post("/forget-password-otp", sendForgotPasswordOTP)
    .post("/verify-forget-password-otp", verifyForgotPasswordOTP)
    .post("/reset-password", resetPassword)
    
    .post("/customer/onboarding", protect("customer"), require("../controllers/auth.controller").updateOnboarding)
    
    // Unified login
    .post("/login", require("../controllers/auth.controller").loginUniversal);

module.exports = router