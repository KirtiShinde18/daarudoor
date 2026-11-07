const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: false
    },
    action: {
        type: String,
        required: true
        // e.g., "completed a task", "submitted an attendance request"
    },
    type: {
        type: String,
        required: true,
        enum: ["todo", "attendance", "attendance_request", "checkin", "checkout", "order", "other"]
    },
    title: {
        type: String,
        // The task name, attendance status, etc.
    },
    status: {
        type: String,
        // Pending, Completed, Approved, Rejected, etc.
    },
    link: {
        type: String,
        required: true
        // Admin route to navigate to (e.g. "/admin/todo")
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
