const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { PRODUCTION, FRONTEND_URL } = require("../utils/config")
const crypto = require("crypto")
const cryptoUtils = require("../utils/crypto")
const { sendEmail } = require("../utils/email")
const { registerTemplate } = require("../email-templates/registerTemplate")
const { otpTemplate } = require("../email-templates/otpTemplate")
const { differenceInSeconds } = require("date-fns")
const { forgetPasswordTemplate } = require("../email-templates/forgetPasswordTemplate")
const { isEmail, isStrongPassword, isMobilePhone, isEmpty, isJWT } = require("validator")

const loginHandler = (role) => async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: "email and password are required" });
        if(!isEmail(email)) return res.status(400).json({ success: false, message: "invalid email" });
        const normalizedEmail = email.trim().toLowerCase();
        
        let query = { email: normalizedEmail };
        if (role === "admin") {
            query.$or = [{ role: "admin" }, { department: "Management" }];
        } else {
            query.role = role;
        }

        const result = await User.findOne(query);
        if (!result) {
            return res.status(401).json({
                success: false,
                message: process.env.NODE_ENV === PRODUCTION ? "Invalid Credentials" : "User Not Found or Invalid Role"
            });
        }
        
        if (role === "customer" && !result.isEmailVerified) {
            return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
        }
        
        if (!result.active) {
            return res.status(403).json({ success: false, message: "Your account has been blocked.", isBlocked: true });
        }

        // Normalize admin role if it's incorrect (e.g. legacy seeding)
        if (role === "admin" && result.role !== "admin") {
            result.role = "admin";
            await result.save();
        }

        const verify = await bcrypt.compare(password, result.password);
        if (!verify) {
            return res.status(401).json({
                success: false,
                message: process.env.NODE_ENV === PRODUCTION ? "Invalid Credentials" : "Invalid Password"
            });
        }

        const token = jwt.sign({ id: result._id, _id: result._id, role: result.role }, process.env.JWT_KEY, { expiresIn: "1d" });
                
        const cookieName = role.toUpperCase();
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === PRODUCTION,
            maxAge: 1000 * 60 * 60 * 24
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                name: result.name,
                email: result.email,
                mobile: result.mobile,
                profilePic: result.profilePic,
                _id: result._id,
                role: result.role,
                ageVerified: result.ageVerification && result.ageVerification.status === "VERIFIED"
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "unable to login" });
    }
};

exports.loginCustomer = loginHandler("customer");
exports.loginAdmin = loginHandler("admin");
exports.loginDelivery = loginHandler("delivery");

exports.loginUniversal = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: "email and password are required" });
        if(!isEmail(email)) return res.status(400).json({ success: false, message: "invalid email" });
        const normalizedEmail = email.trim().toLowerCase();
        
        const result = await User.findOne({ email: normalizedEmail });
        if (!result) {
            return res.status(401).json({
                success: false,
                message: process.env.NODE_ENV === PRODUCTION ? "Invalid Credentials" : "User Not Found"
            });
        }
        
        if (result.role === "customer" && !result.isEmailVerified) {
            return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
        }
        
        if (!result.active) {
            return res.status(403).json({ success: false, message: "Your account has been blocked.", isBlocked: true });
        }

        const verify = await bcrypt.compare(password, result.password);
        if (!verify) {
            return res.status(401).json({
                success: false,
                message: process.env.NODE_ENV === PRODUCTION ? "Invalid Credentials" : "Invalid Password"
            });
        }

        const token = jwt.sign({ id: result._id, _id: result._id, role: result.role }, process.env.JWT_KEY, { expiresIn: "1d" });
                
        const cookieName = result.role.toUpperCase();
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === PRODUCTION,
            maxAge: 1000 * 60 * 60 * 24
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            role: result.role,
            user: {
                name: result.name,
                email: result.email,
                mobile: result.mobile,
                profilePic: result.profilePic,
                _id: result._id,
                role: result.role,
                ageVerified: result.ageVerification && result.ageVerification.status === "VERIFIED"
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "unable to login" });
    }
};

exports.getCustomerProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user).select("-password -otp");
        if (!user || user.role !== "customer") {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        res.status(200).json({
            success: true,
            user: {
                ...user.toObject(),
                ageVerified: user.ageVerification && user.ageVerification.status === "VERIFIED"
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

//===================================  REGISTER CUSTOMER ===================================
exports.registerCustomer = async (req, res) => {
    try {
        let { name, email, mobile, password: plainPassword } = req.body
        if (!name || !email || !mobile || !plainPassword) {
            return res.status(400).json({ success: false, message: "all required fields must be provided" })
        }
        
        email = email.trim().toLowerCase();
        
        // validator email
        if(!isEmail(email)){
            return res.status(400).json({ message: "invalid email" })
        }

        // validator mobile
        if(!isMobilePhone(mobile, "en-IN")){
            return res.status(400).json({ message: "invalid mobile" })
        }

        if(!isStrongPassword(plainPassword)){
            return res.status(400).json({ message: "Password must be at least 8 characters, include one uppercase letter, one lowercase letter, one number, and one special character." })
        }

        const orConditions = [{ email }, { mobile }]
        const isFound = await User.findOne({ $or: orConditions })
        
        if (isFound) {
            if (isFound.email === email) {
                return res.status(409).json({ success: false, message: "An account with this email already exists." })
            }
            if (isFound.mobile === mobile) {
                return res.status(409).json({ success: false, message: "An account with this mobile number already exists." })
            }
        }

        const password = await bcrypt.hash(plainPassword, 10)
        
        const createdUser = await User.create({ 
            name, email, mobile, password, role: "customer", isEmailVerified: true
        })

        const otp = crypto.randomInt(100000, 1000000)
        const hashOTP = await bcrypt.hash(String(otp), 10)
        
        createdUser.otp = hashOTP
        createdUser.otpSendOn = new Date()
        await createdUser.save()

        await sendEmail({
            email: createdUser.email,
            subject: "Verification OTP",
            message: otpTemplate({
                name: createdUser.name,
                otp,
                sec: process.env.OTP_EXPIRY || 600,
                min: (process.env.OTP_EXPIRY || 600) / 60
            })
        })

        res.status(201).json({
          success: true,
          message: "Customer registered successfully",
          user: {
            id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            mobile: createdUser.mobile,
            role: "customer"
          }
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "unable to register customer" })
    }
}

//=================================== SIGNOUT ===================================
exports.signoutAdmin = async (req, res) => {
    try {
        res.clearCookie("ADMIN")
        res.status(200).json({ message: "signout success" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "unable to signout employee" })
    }
}

//=================================== SIGNOUT CUSTOMER ===================================
exports.signoutCustomer = async (req, res) => {
    try {
        res.clearCookie("CUSTOMER")
        res.status(200).json({ message: "signout success" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "unable to signout customer" })
    }
}

exports.sendOTP = async (req, res) => {
    try {
        const { username } = req.body
        if (isEmpty(username)) {
            return res.status(400).json({ message: "email/mobile is required" })
        }
        if(!isEmail(username) && !isMobilePhone(username, "en-IN")){
            return res.status(400).json({ message: "invalid email/mobile" })

        }

        const result = await User.findOne({ $or: [{ email: username }, { mobile: username }] })
        if (!result) {
            return res.status(400).json({ message: "email/mobile not registered with us" })
        }
        // create OTP
        const otp = crypto.randomInt(100000, 1000000)
        // to convert to string 
        // String(otp)
        // otp.toString()
        const hashOTP = await bcrypt.hash(String(otp), 10)
        // add to database
        await User.findByIdAndUpdate(result._id, { otp: hashOTP, otpSendOn: new Date() })
        // Send OTP in email / sms / whatsapp
        await sendEmail({
            email: result.email,
            subject: "Login OTP",
            message: otpTemplate({
                name: result.name,
                otp,
                sec: process.env.OTP_EXPIRY,
                min: process.env.OTP_EXPIRY / 60
            })
        })
        res.status(200).json({ message: "sendOTP success" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "unable to sendOTP " })
    }
}

//=================================== VERIFY OTP ===================================
exports.verifyOTP = async (req, res) => {
    try {
        const { username, otp } = req.body
        if (isEmpty(username) || isEmpty(otp)) {
            return res.status(400).json({ message: "all fields required" })
        }
        if(!isEmail(username) && !isMobilePhone(username, "en-IN")){
            return res.status(400).json({ message: "invalid email/mobile" })

        }
        const result = await User.findOne({ $or: [{ email: username }, { mobile: username }] })
        if (!result) {
            return res.status(400).json({ message: "email/mobile not registered with us" })
        }
        const verify = await bcrypt.compare(otp, String(result.otp))
        if (!verify) {
            return res.status(400).json({ message: "invalid opt" })
        }
        if (differenceInSeconds(new Date(), new Date(result.otpSendOn)) > process.env.OTP_EXPIRY) {
            await User.findByIdAndUpdate(result._id, { otp: null })
            return res.status(400).json({ message: "opt Expired" })
        }
        const token = jwt.sign({ id: result._id, _id: result._id, role: result.role }, process.env.JWT_KEY, { expiresIn: "1d" })
        if(result.role === "admin"){
            res.cookie("ADMIN", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === PRODUCTION,
            maxAge: 1000 * 60 * 60 * 24
        })
        }else if(result.role === "customer") {
            res.cookie("CUSTOMER", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === PRODUCTION,
            maxAge: 1000 * 60 * 60 * 24
        })
        }
        
        res.status(200).json({
            message: "login success", 
            token, // Mobile app needs token in JSON
            result: {
                name: result.name,
                email: result.email,
                mobile: result.mobile,
                profilePic: result.profilePic,
                _id: result._id,
                role: result.role,
                ageVerified: result.ageVerification && result.ageVerification.status === "VERIFIED"
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "unable to verifyOTP" })
    }
}

//=================================== FORGET PASSWORD (OTP-based) ===================================
exports.sendForgotPasswordOTP = async (req, res) => {
    try {
        const { username } = req.body
        if (isEmpty(username)) {
            return res.status(400).json({ message: "email/mobile is required" })
        }
        if(!isEmail(username) && !isMobilePhone(username, "en-IN")){
            return res.status(400).json({ message: "invalid email/mobile" })
        }

        const result = await User.findOne({ $or: [{ email: username }, { mobile: username }], role: { $in: ['customer', 'delivery', 'admin'] } })
        if (!result) {
            return res.status(400).json({ message: "Account not found" })
        }
        
        const otp = crypto.randomInt(100000, 1000000)
        const hashOTP = await bcrypt.hash(String(otp), 10)
        
        // Use accessToken field to store the password reset OTP separately from login OTP
        await User.findByIdAndUpdate(result._id, { accessToken: hashOTP, otpSendOn: new Date() })

        await sendEmail({
            email: result.email,
            subject: "Password Reset OTP",
            message: otpTemplate({
                name: result.name,
                otp,
                sec: process.env.OTP_EXPIRY || 600,
                min: (process.env.OTP_EXPIRY || 600) / 60
            })
        })
        
        if (process.env.NODE_ENV !== PRODUCTION) {
            console.log(`[DEV RESET OTP] for ${result.email}: ${otp}`);
        }

        res.status(200).json({ message: "Password reset OTP sent successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "unable to send password reset OTP" })
    }
}

exports.verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { username, otp } = req.body
        if (isEmpty(username) || isEmpty(otp)) {
            return res.status(400).json({ message: "all fields required" })
        }
        const result = await User.findOne({ $or: [{ email: username }, { mobile: username }], role: { $in: ['customer', 'delivery', 'admin'] } })
        if (!result || !result.accessToken) {
            return res.status(400).json({ message: "Invalid request or OTP expired" })
        }
        
        const verify = await bcrypt.compare(String(otp), result.accessToken)
        if (!verify) {
            return res.status(400).json({ message: "Invalid OTP" })
        }
        
        const expiryTime = process.env.OTP_EXPIRY || 600;
        if (differenceInSeconds(new Date(), new Date(result.otpSendOn)) > expiryTime) {
            await User.findByIdAndUpdate(result._id, { accessToken: null })
            return res.status(400).json({ message: "OTP Expired" })
        }
        
        // Generate a temporary JWT token specifically for password reset
        const resetToken = jwt.sign({ _id: result._id, type: 'password_reset' }, process.env.JWT_KEY, { expiresIn: "15m" })
        
        // Clear the OTP so it can't be reused
        await User.findByIdAndUpdate(result._id, { accessToken: null })
        
        res.status(200).json({
            message: "OTP verified", 
            resetToken
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "unable to verify OTP" })
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, password } = req.body

        if (isEmpty(resetToken) || isEmpty(password)) {
            return res.status(400).json({ message: "Token and new password required" })
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters, include one uppercase letter, one lowercase letter, one number, and one special character." })
        }

        jwt.verify(resetToken, process.env.JWT_KEY, async (err, decoded) => {
            if (err || decoded.type !== 'password_reset') {
                return res.status(400).json({ message: "Invalid or expired token" })
            }
            const hash = await bcrypt.hash(password, 10)
            await User.findByIdAndUpdate(decoded._id, { password: hash })
            res.status(200).json({ message: "Password reset successfully" })
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "unable to reset password" })
    }
}

exports.verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !otp) {
            return res.status(400).json({ message: "email and OTP are required" })
        }
        const user = await User.findOne({ email, role: "customer" })
        if (!user) {
            return res.status(400).json({ message: "Account not found" })
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email is already verified" })
        }
        if (!user.otp) {
            return res.status(400).json({ message: "No OTP request found. Please request a new OTP." })
        }
        
        const isMatch = await bcrypt.compare(String(otp), user.otp)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." })
        }
        
        const expiryTime = process.env.OTP_EXPIRY || 600
        if (differenceInSeconds(new Date(), user.otpSendOn) > expiryTime) {
            return res.status(400).json({ message: "OTP has expired. Please request a new OTP." })
        }
        
        user.isEmailVerified = true
        user.otp = null
        user.otpSendOn = null
        await user.save()
        
        res.status(200).json({ message: "Email verified successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Unable to verify email" })
    }
}



exports.updateOnboarding = async (req, res) => {
    try {
        const { birthYear, gender } = req.body;
        if (!birthYear || !gender) {
            return res.status(400).json({ success: false, message: "Birth year and gender are required" });
        }
        
        const user = await User.findById(req.user);
        if (!user || user.role !== "customer") {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const currentYear = new Date().getFullYear();
        const minLegalAge = 18; // Change as needed
        if (currentYear - birthYear < minLegalAge) {
            return res.status(400).json({ success: false, message: `Must be at least ${minLegalAge} years old` });
        }
        
        user.birthYear = birthYear;
        user.gender = gender;
        user.onboardingCompleted = true;
        user.ageVerification = {
            status: "VERIFIED",
            dateOfBirth: new Date(`${birthYear}-01-01`),
            verifiedAt: new Date()
        };
        await user.save();
        
        res.status(200).json({
            success: true,
            message: "Onboarding completed successfully",
            user: {
                _id: user._id,
                name: user.name,
                mobile: user.mobile,
                onboardingCompleted: user.onboardingCompleted,
                birthYear: user.birthYear,
                gender: user.gender,
                ageVerified: true
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Unable to update onboarding" });
    }
};