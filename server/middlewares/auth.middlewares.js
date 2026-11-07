const User = require("../models/User")
const { PRODUCTION } = require("../utils/config")
const jwt = require("jsonwebtoken")

exports.authenticate = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            const authHeaderToken = req.headers.authorization.split(" ")[1];
            if (authHeaderToken && authHeaderToken !== "undefined" && authHeaderToken !== "null") {
                token = authHeaderToken;
            }
        } 
        
        if (!token && req.cookies) {
            token = req.cookies.ADMIN || req.cookies.CUSTOMER || req.cookies.DELIVERY;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);
        
        const user = await User.findById(decoded.id || decoded._id);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found", isDeleted: true });
        }
        
        if (!user.active) {
            return res.status(403).json({ success: false, message: "Account is blocked", isBlocked: true });
        }

        req.user = user._id; // Backward compatibility
        req.userData = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token", isInvalid: true });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.userData || !roles.includes(req.userData.role)) {
            return res.status(403).json({ success: false, message: "Not authorized to access this route" });
        }
        next();
    };
};

// Backward compatibility
exports.adminProtect = [exports.authenticate, exports.authorize("admin")];
exports.protect = (role) => [exports.authenticate, exports.authorize(role)];

