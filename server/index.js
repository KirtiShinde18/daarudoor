require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { protect } = require("./middlewares/auth.middlewares.js");
const { FRONTEND_URL } = require("./utils/config.js");
const { initSocket } = require("./services/socket.service.js");

const app = express();
const httpServer = http.createServer(app);
initSocket(httpServer);

// ==============================
// Database Connection
// ==============================
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB connected ✅");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
};

app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// ==============================
// Middlewares
// ==============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// ==============================
// CORS
// ==============================
const allowedOrigins = [
    process.env.LIVE_URL,
    process.env.LIVE_WEBSITE_URL,
    process.env.LOCAL_URL,
    FRONTEND_URL,
    "https://daarudoor.vercel.app",
].filter(Boolean);

console.log("Allowed CORS Origins:", allowedOrigins);

app.use(
    cors({
        origin: function (origin, callback) {
            // React Native / Postman / server-to-server requests may not have an Origin
            if (!origin) {
                return callback(null, true);
            }

            if (
                allowedOrigins.includes(origin) ||
                origin.startsWith("http://localhost:") ||
                origin.startsWith("http://127.0.0.1:") ||
                origin.startsWith("http://10.") ||
                origin.startsWith("http://192.168.") ||
                origin.endsWith(".vercel.app")
            ) {
                return callback(null, true);
            }

            console.log("❌ CORS blocked:", origin);

            // Pass false instead of Error to avoid uncaught 500 exceptions
            return callback(null, false);
        },

        credentials: true,
    })
);

// ==============================
// Health Check
// ==============================
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DaaruDoor API is running 🚀",
    });
});

// ==============================
// Routes
// ==============================
app.use(
    "/api/auth",
    require("./routes/auth.routes.js")
);

app.use(
    "/api/admin",
    protect("admin"),
    require("./routes/admin.routes.js")
);

app.use(
    "/api/customer",
    require("./routes/customer.routes.js")
);

app.use(
    "/api/delivery",
    protect("delivery"),
    require("./routes/delivery.routes.js")
);

app.use(
    "/api/payments",
    require("./routes/payment.routes.js")
);

app.use(
    "/api/users/me/age-verification",
    protect("customer"),
    require("./routes/ageVerification.routes.js")
);

app.use(
    "/api/webhooks/age-verification",
    require("./routes/webhook.routes.js")
);

// ==============================
// 404 Handler
// ==============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Resource not found: ${req.method} ${req.originalUrl}`,
    });
});

// ==============================
// Global Error Handler
// ==============================
app.use((err, req, res, next) => {
    // Safe server-side error logging (never logs tokens, passwords, or secrets)
    console.error("Server Error:", {
        message: err.message,
        path: req.originalUrl,
        method: req.method,
    });

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// ==============================
// Local Development Only
// ==============================
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;

    connectDB().then(() => {
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server & Socket.IO running on port ${PORT} at 0.0.0.0`);
            console.log(`Mode: ${process.env.NODE_ENV}`);
            console.log(`CORS Allowed: ${allowedOrigins.join(", ")}`);
        });
    });
}

app.httpServer = httpServer;
module.exports = app;