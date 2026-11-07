const User = require("../models/User");
const ReplacementRequest = require("../models/ReplacementRequest");
const Notification = require("../models/Notification");
const cryptoUtils = require("../utils/crypto");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/email");
const { emitToOrder } = require("../services/socket.service");

//============================================================== NOTIFICATIONS =====================================================

exports.getDashboardStats = async (req, res) => {
    try {
        const Order = require("../models/Order");
        const Product = require("../models/Product");

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Customers
        const totalCustomers = await User.countDocuments({ role: "customer", isDelete: false });
        const newCustomersToday = await User.countDocuments({ 
            role: "customer", 
            isDelete: false, 
            createdAt: { $gte: startOfToday, $lte: endOfToday } 
        });

        // Delivery Boys & Availability
        const totalDeliveryBoys = await User.countDocuments({ role: "delivery", isDelete: false });

        // Identify delivery boys currently with active orders
        const busyPartnerIds = await Order.distinct("deliveryPartner", {
            status: { $in: ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
            deliveryPartner: { $ne: null }
        });

        const busyDeliveryBoys = await User.countDocuments({
            _id: { $in: busyPartnerIds },
            role: "delivery",
            isDelete: false
        });

        const availableDeliveryBoys = await User.countDocuments({
            _id: { $nin: busyPartnerIds },
            role: "delivery",
            active: true,
            isDelete: false
        });

        // Orders Breakdown
        const totalOrders = await Order.countDocuments();
        const ordersToday = await Order.countDocuments({ 
            createdAt: { $gte: startOfToday, $lte: endOfToday } 
        });

        const awaitingAssignment = await Order.countDocuments({
            status: { $in: ["PENDING", "CONFIRMED"] },
            deliveryPartner: null
        });

        const pendingDeliveries = await Order.countDocuments({
            status: { $in: ["PROCESSING", "READY_FOR_PICKUP"] }
        });

        const activeDeliveries = await Order.countDocuments({
            status: "OUT_FOR_DELIVERY"
        });

        const deliveredOrders = await Order.countDocuments({
            status: "DELIVERED"
        });

        const failedDeliveries = await Order.countDocuments({
            status: "FAILED"
        });

        const cancelledOrders = await Order.countDocuments({
            status: { $in: ["CANCELLED", "RETURNED"] }
        });

        // Sales Aggregation:
        // Rule: Only count realized revenue.
        // Paid online: paymentStatus === 'PAID' and not cancelled/returned/failed.
        // COD: status === 'DELIVERED'.
        const realizedSalesMatch = {
            $or: [
                { paymentStatus: "PAID", status: { $nin: ["CANCELLED", "RETURNED", "FAILED"] } },
                { paymentMethod: "COD", status: "DELIVERED" }
            ]
        };

        const totalSalesAgg = await Order.aggregate([
            { $match: realizedSalesMatch },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalSales = totalSalesAgg[0]?.total || 0;

        const todaySalesAgg = await Order.aggregate([
            {
                $match: {
                    ...realizedSalesMatch,
                    $or: [
                        { deliveredAt: { $gte: startOfToday, $lte: endOfToday } },
                        { deliveredAt: { $exists: false }, updatedAt: { $gte: startOfToday, $lte: endOfToday }, status: "DELIVERED" },
                        { paymentStatus: "PAID", createdAt: { $gte: startOfToday, $lte: endOfToday } }
                    ]
                }
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const todaySales = todaySalesAgg[0]?.total || 0;

        // Delayed/Overdue Orders check (active orders with last update > 45 minutes ago)
        const delayedThreshold = new Date(Date.now() - 45 * 60 * 1000);
        const delayedOrdersCount = await Order.countDocuments({
            status: { $in: ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
            updatedAt: { $lt: delayedThreshold }
        });

        const totalProducts = await Product.countDocuments();

        const recentOrders = await Order.find()
            .populate("customer", "name email mobile")
            .populate("deliveryPartner", "name mobile")
            .sort({ createdAt: -1 })
            .limit(10);

        const recentCustomers = await User.find({ role: "customer", isDelete: false })
            .select("name email mobile profilePic createdAt")
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    // 15 Standard KPIs
                    totalOrders,
                    ordersToday,
                    totalCustomers,
                    newCustomersToday,
                    totalDeliveryBoys,
                    availableDeliveryBoys,
                    busyDeliveryBoys,
                    awaitingAssignment,
                    pendingDeliveries,
                    activeDeliveries,
                    deliveredOrders,
                    failedDeliveries,
                    cancelledOrders,
                    totalSales: Math.round(totalSales * 100) / 100,
                    todaySales: Math.round(todaySales * 100) / 100,

                    // Extended metrics
                    totalProducts,
                    delayedOrdersCount,
                    totalRevenue: Math.round(totalSales * 100) / 100 // backward compatibility
                },
                recentOrders,
                recentCustomers
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, message: "Unable to fetch dashboard stats", error: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Unable to fetch notifications", error: error.message });
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all notifications read:", error);
        res.status(500).json({ success: false, message: "Unable to mark notifications read", error: error.message });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        res.status(200).json({ success: true, message: "Notification marked as read", data: notification });
    } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ success: false, message: "Unable to mark notification read", error: error.message });
    }
};

//============================================================== PROFILE =====================================================


exports.getAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user).select("name email role profilePic");
        if (!user) {
            return res.status(404).json({ message: "Admin profile not found" });
        }
        res.status(200).json({ message: "Admin profile fetched successfully", result: user });
    } catch (error) {
        console.error("Error in getAdminProfile:", error);
        res.status(500).json({ message: "Unable to fetch admin profile", error: error.message });
    }
};

//============================================================== ORDERS =====================================================
const Order = require("../models/Order");
const mongoose = require("mongoose");

exports.getAllOrders = async (req, res) => {
    try {
        const { 
            search, 
            status, 
            paymentStatus, 
            deliveryPartnerId, 
            dateRange, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 20, 
            sortBy = "createdAt", 
            sortOrder = "desc" 
        } = req.query;

        const query = {};

        // Status Filter
        if (status && status !== "ALL") {
            query.status = status;
        }

        // Payment Status Filter
        if (paymentStatus && paymentStatus !== "ALL") {
            query.paymentStatus = paymentStatus;
        }

        // Delivery Partner Filter
        if (deliveryPartnerId && deliveryPartnerId !== "ALL") {
            if (deliveryPartnerId === "UNASSIGNED") {
                query.deliveryPartner = null;
            } else if (mongoose.Types.ObjectId.isValid(deliveryPartnerId)) {
                query.deliveryPartner = deliveryPartnerId;
            }
        }

        // Search Filter
        if (search && search.trim()) {
            const s = search.trim();
            const orConditions = [
                { "deliveryAddress.fullName": { $regex: s, $options: "i" } },
                { "deliveryAddress.mobile": { $regex: s, $options: "i" } },
                { "deliveryAddress.city": { $regex: s, $options: "i" } },
                { "deliveryAddress.area": { $regex: s, $options: "i" } },
            ];

            if (mongoose.Types.ObjectId.isValid(s)) {
                orConditions.push({ _id: s });
            }

            // Customer match
            const matchedCustomers = await User.find({
                role: "customer",
                $or: [
                    { name: { $regex: s, $options: "i" } },
                    { mobile: { $regex: s, $options: "i" } },
                    { email: { $regex: s, $options: "i" } },
                ]
            }).select("_id");

            if (matchedCustomers.length > 0) {
                orConditions.push({ customer: { $in: matchedCustomers.map(c => c._id) } });
            }

            query.$or = orConditions;
        }

        // Date Range Filter
        const now = new Date();
        let rangeStart = null;
        let rangeEnd = null;

        if (dateRange && dateRange !== "ALL") {
            if (dateRange === "TODAY") {
                rangeStart = new Date();
                rangeStart.setHours(0, 0, 0, 0);
                rangeEnd = new Date();
                rangeEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "YESTERDAY") {
                rangeStart = new Date();
                rangeStart.setDate(rangeStart.getDate() - 1);
                rangeStart.setHours(0, 0, 0, 0);
                rangeEnd = new Date();
                rangeEnd.setDate(rangeEnd.getDate() - 1);
                rangeEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "THIS_WEEK") {
                rangeStart = new Date();
                rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay());
                rangeStart.setHours(0, 0, 0, 0);
                rangeEnd = new Date();
                rangeEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "THIS_MONTH") {
                rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
                rangeEnd = new Date();
                rangeEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "CUSTOM" && (startDate || endDate)) {
                if (startDate) rangeStart = new Date(startDate);
                if (endDate) {
                    rangeEnd = new Date(endDate);
                    rangeEnd.setHours(23, 59, 59, 999);
                }
            }
        } else if (startDate || endDate) {
            if (startDate) rangeStart = new Date(startDate);
            if (endDate) {
                rangeEnd = new Date(endDate);
                rangeEnd.setHours(23, 59, 59, 999);
            }
        }

        if (rangeStart || rangeEnd) {
            query.createdAt = {};
            if (rangeStart) query.createdAt.$gte = rangeStart;
            if (rangeEnd) query.createdAt.$lte = rangeEnd;
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = limit === "all" ? 1000 : (parseInt(limit) || 20);
        const skip = (pageNum - 1) * limitNum;
        const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [total, orders] = await Promise.all([
            Order.countDocuments(query),
            Order.find(query)
                .populate("customer", "name email mobile location")
                .populate("deliveryPartner", "name email mobile profilePic active")
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
        ]);

        res.status(200).json({ 
            success: true, 
            message: "Orders fetched successfully", 
            data: orders,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({ success: false, message: "Unable to fetch orders", error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("customer", "name email mobile location profilePic")
            .populate("deliveryPartner", "name email mobile profilePic active location isOnline")
            .populate("assignmentHistory.deliveryPartner", "name mobile")
            .populate("assignmentHistory.assignedBy", "name email")
            .populate("statusHistory.changedBy", "name email role")
            .populate("internalNotes.addedBy", "name email");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        res.status(500).json({ success: false, message: "Unable to fetch order", error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, failureReason, cancelReason, note } = req.body;
        const validStatuses = [
            "PENDING", 
            "CONFIRMED", 
            "PROCESSING", 
            "READY_FOR_PICKUP", 
            "ACCEPTED",
            "OUT_FOR_DELIVERY", 
            "ARRIVED",
            "DELIVERED", 
            "FAILED", 
            "CANCELLED", 
            "RETURNED"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const currentStatus = order.status;

        // Terminal state guards
        if (currentStatus === "DELIVERED") {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot modify an order that has already been delivered." 
            });
        }
        if (currentStatus === "CANCELLED" && status !== "CONFIRMED") {
            return res.status(400).json({ 
                success: false, 
                message: "Order is already cancelled." 
            });
        }

        // Requirements for status updates
        if (status === "OUT_FOR_DELIVERY" && !order.deliveryPartner) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot mark OUT_FOR_DELIVERY without an assigned delivery partner." 
            });
        }

        if (status === "FAILED" && !failureReason && !note) {
            return res.status(400).json({
                success: false,
                message: "A failure reason is required when marking an order as FAILED."
            });
        }

        // Fetch admin user name
        const adminUser = await User.findById(req.user).select("name email");
        const adminName = adminUser ? adminUser.name : "Admin";

        const updateFields = { status };
        const now = new Date();

        if (status === "CONFIRMED" && !order.confirmedAt) updateFields.confirmedAt = now;
        if (status === "READY_FOR_PICKUP") updateFields.readyForPickupAt = now;
        if (status === "OUT_FOR_DELIVERY") updateFields.pickedUpAt = order.pickedUpAt || now;
        if (status === "DELIVERED") {
            updateFields.deliveredAt = now;
            // If COD, mark payment status as PAID upon delivery
            if (order.paymentMethod === "COD") {
                updateFields.paymentStatus = "PAID";
            }
        }
        if (status === "FAILED") {
            updateFields.failedAt = now;
            updateFields.failureReason = failureReason || note || "Delivery failed";
        }
        if (status === "CANCELLED") {
            updateFields.cancelledAt = now;
            updateFields.cancelReason = cancelReason || note || "Cancelled by admin";
        }

        const historyEntry = {
            status,
            changedAt: now,
            changedBy: req.user,
            changerRole: "admin",
            changerName: adminName,
            note: note || `Status transitioned from ${currentStatus} to ${status} by admin`
        };

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                $set: updateFields,
                $push: { statusHistory: historyEntry }
            },
            { new: true }
        )
        .populate("customer", "name email mobile")
        .populate("deliveryPartner", "name email mobile active");

        // Emit real-time status update to order room
        emitToOrder(updatedOrder._id, "order_status_updated", {
            orderId: updatedOrder._id,
            status,
            updatedAt: now
        });

        res.status(200).json({ 
            success: true, 
            message: `Order status updated to ${status}`, 
            data: updatedOrder 
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Unable to update order status", error: error.message });
    }
};

exports.assignDeliveryBoy = async (req, res) => {
    try {
        const { deliveryPartnerId, note } = req.body;
        if (!deliveryPartnerId) {
            return res.status(400).json({ success: false, message: "Delivery partner ID is required" });
        }

        const deliveryPartner = await User.findOne({ 
            _id: deliveryPartnerId, 
            role: "delivery", 
            active: true, 
            isDelete: false 
        });

        if (!deliveryPartner) {
            return res.status(404).json({ success: false, message: "Active delivery partner not found" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === "DELIVERED" || order.status === "CANCELLED") {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot assign delivery partner to an order with status ${order.status}` 
            });
        }

        const adminUser = await User.findById(req.user).select("name email");
        const adminName = adminUser ? adminUser.name : "Admin";
        const now = new Date();

        const isReassignment = !!order.deliveryPartner && order.deliveryPartner.toString() !== deliveryPartnerId;
        const action = isReassignment ? "REASSIGNED" : "ASSIGNED";

        const assignmentEntry = {
            deliveryPartner: deliveryPartnerId,
            deliveryPartnerName: deliveryPartner.name,
            assignedAt: now,
            assignedBy: req.user,
            action
        };

        const statusNote = isReassignment
            ? `Reassigned to ${deliveryPartner.name} by ${adminName}`
            : `Assigned to ${deliveryPartner.name} by ${adminName}`;

        const statusEntry = {
            status: order.status === "PENDING" || order.status === "CONFIRMED" ? "PROCESSING" : order.status,
            changedAt: now,
            changedBy: req.user,
            changerRole: "admin",
            changerName: adminName,
            note: note || statusNote
        };

        const updateData = {
            deliveryPartner: deliveryPartnerId,
            assignedAt: now,
        };

        // If order was PENDING or CONFIRMED, advance to PROCESSING
        if (order.status === "PENDING" || order.status === "CONFIRMED") {
            updateData.status = "PROCESSING";
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                $set: updateData,
                $push: { 
                    assignmentHistory: assignmentEntry,
                    statusHistory: statusEntry
                }
            },
            { new: true }
        )
        .populate("customer", "name email mobile")
        .populate("deliveryPartner", "name email mobile");

        res.status(200).json({ 
            success: true, 
            message: `Order successfully ${action.toLowerCase()} to ${deliveryPartner.name}`, 
            data: updatedOrder 
        });
    } catch (error) {
        console.error("Error assigning delivery boy:", error);
        res.status(500).json({ success: false, message: "Unable to assign delivery boy", error: error.message });
    }
};

exports.unassignDeliveryBoy = async (req, res) => {
    try {
        const { note } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (!order.deliveryPartner) {
            return res.status(400).json({ success: false, message: "Order is already unassigned" });
        }

        if (order.status === "DELIVERED" || order.status === "OUT_FOR_DELIVERY") {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot unassign delivery partner while order status is ${order.status}` 
            });
        }

        const adminUser = await User.findById(req.user).select("name email");
        const adminName = adminUser ? adminUser.name : "Admin";
        const now = new Date();

        const assignmentEntry = {
            deliveryPartner: order.deliveryPartner,
            assignedAt: order.assignedAt || now,
            unassignedAt: now,
            assignedBy: req.user,
            action: "UNASSIGNED"
        };

        const statusEntry = {
            status: "CONFIRMED",
            changedAt: now,
            changedBy: req.user,
            changerRole: "admin",
            changerName: adminName,
            note: note || `Delivery partner unassigned by ${adminName}`
        };

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                $set: { 
                    deliveryPartner: null, 
                    assignedAt: null,
                    status: "CONFIRMED"
                },
                $push: {
                    assignmentHistory: assignmentEntry,
                    statusHistory: statusEntry
                }
            },
            { new: true }
        )
        .populate("customer", "name email mobile");

        res.status(200).json({ 
            success: true, 
            message: "Delivery partner unassigned successfully", 
            data: updatedOrder 
        });
    } catch (error) {
        console.error("Error unassigning delivery boy:", error);
        res.status(500).json({ success: false, message: "Unable to unassign delivery boy", error: error.message });
    }
};

exports.addOrderNote = async (req, res) => {
    try {
        const { note } = req.body;
        if (!note || !note.trim()) {
            return res.status(400).json({ success: false, message: "Note text is required" });
        }

        const adminUser = await User.findById(req.user).select("name email");
        const adminName = adminUser ? adminUser.name : "Admin";

        const newNote = {
            note: note.trim(),
            addedBy: req.user,
            addedByName: adminName,
            createdAt: new Date()
        };

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { $push: { internalNotes: newNote } },
            { new: true }
        ).select("internalNotes");

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Internal note added successfully", 
            data: updatedOrder.internalNotes 
        });
    } catch (error) {
        console.error("Error adding order note:", error);
        res.status(500).json({ success: false, message: "Unable to add internal note", error: error.message });
    }
};

exports.getOrderTracking = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("customer", "name mobile location")
            .populate("deliveryPartner", "name mobile profilePic active isOnline location lastActiveAt");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const hasLocation = !!(order.currentLocation && order.currentLocation.latitude);
        const lastUpdated = order.currentLocation?.timestamp || order.updatedAt;
        const staleThresholdMs = 15 * 60 * 1000; // 15 mins
        const isStale = hasLocation && (Date.now() - new Date(lastUpdated).getTime() > staleThresholdMs);

        // Fallback coordinates from delivery partner if order location not yet updated
        let displayCoordinates = null;
        if (hasLocation) {
            displayCoordinates = {
                latitude: order.currentLocation.latitude,
                longitude: order.currentLocation.longitude,
                heading: order.currentLocation.heading || 0,
                timestamp: order.currentLocation.timestamp
            };
        } else if (order.deliveryPartner?.location?.latitude) {
            displayCoordinates = {
                latitude: order.deliveryPartner.location.latitude,
                longitude: order.deliveryPartner.location.longitude,
                heading: 0,
                timestamp: order.deliveryPartner.lastActiveAt || order.updatedAt
            };
        }

        let customerCoords = null;
        if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
            customerCoords = {
                latitude: order.deliveryAddress.latitude,
                longitude: order.deliveryAddress.longitude
            };
        } else if (order.customer?.location) {
            customerCoords = order.customer.location;
        }

        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                status: order.status,
                deliveryAddress: order.deliveryAddress,
                currentLocation: displayCoordinates,
                customerLocation: customerCoords,
                isLocationStale: isStale,
                hasActiveTracking: !!displayCoordinates,
                lastLocationUpdate: lastUpdated,
                deliveryPartner: order.deliveryPartner ? {
                    _id: order.deliveryPartner._id,
                    name: order.deliveryPartner.name,
                    mobile: order.deliveryPartner.mobile,
                    profilePic: order.deliveryPartner.profilePic,
                    isOnline: order.deliveryPartner.isOnline,
                    active: order.deliveryPartner.active
                } : null,
                timestamps: {
                    createdAt: order.createdAt,
                    assignedAt: order.assignedAt,
                    readyForPickupAt: order.readyForPickupAt,
                    pickedUpAt: order.pickedUpAt,
                    deliveredAt: order.deliveredAt,
                    failedAt: order.failedAt
                }
            }
        });
    } catch (error) {
        console.error("Error fetching order tracking:", error);
        res.status(500).json({ success: false, message: "Unable to fetch order tracking", error: error.message });
    }
};

//============================================================== DELIVERY BOYS =====================================================

exports.createDeliveryBoy = async (req, res) => {
    try {
        console.log("createDeliveryBoy called with body:", req.body);
        const { name, email, mobile, password, address, birthYear, active } = req.body;
        
        if (!name || !email || !mobile || !password) {
            console.log("Missing fields:", { name, email, mobile, password: !!password });
            return res.status(400).json({ success: false, message: "Name, email, mobile and password are required" });
        }

        const isFound = await User.findOne({ $or: [{ email }, { mobile }] });
        if (isFound) {
            console.log("User already exists with email or mobile");
            return res.status(409).json({ success: false, message: "Email or mobile already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Creating user in DB with plaintext password length:", password.length);
        
        const deliveryBoy = await User.create({
            name,
            email,
            mobile,
            password: hashedPassword,
            role: "delivery",
            active: active !== undefined ? active : true,
            address,
            birthYear,
            isEmailVerified: true,
            onboardingCompleted: true
        });

        // Send email
        console.log("Preparing to send email to:", email, "with password length:", password.length);
        const { deliveryBoyTemplate } = require("../email-templates/deliveryBoyTemplate");
        const emailHtml = deliveryBoyTemplate({ email, password });
        console.log("Email template generated successfully");
        
        try {
            console.log("Calling sendEmail utility...");
            await sendEmail({ email, subject: "DaaruDoor Delivery Account Created", message: emailHtml });
            console.log("Email dispatched successfully");
        } catch (err) {
            console.log("Failed to send welcome email to delivery boy:", err.message);
            // Rollback the created account
            await User.findByIdAndDelete(deliveryBoy._id);
            return res.status(500).json({ success: false, message: "Failed to send email with credentials. Account creation was rolled back. Please verify SMTP configuration." });
        }

        res.status(201).json({ success: true, message: "Delivery boy created successfully", data: deliveryBoy });
    } catch (error) {
        console.error("Error creating delivery boy:", error);
        res.status(500).json({ success: false, message: "Unable to create delivery boy", error: error.message });
    }
};

exports.getDeliveryBoys = async (req, res) => {
    try {
        const deliveryBoys = await User.find({ role: "delivery", isDelete: false }).select("-password").lean();

        // Enrich with real-time order and performance stats
        const enrichedDeliveryBoys = await Promise.all(
            deliveryBoys.map(async (boy) => {
                const boyId = boy._id;

                const [
                    activeDeliveries,
                    completedDeliveries,
                    failedDeliveries,
                    cancelledDeliveries,
                    totalAssigned,
                    ratingAgg
                ] = await Promise.all([
                    Order.countDocuments({
                        deliveryPartner: boyId,
                        status: { $in: ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] }
                    }),
                    Order.countDocuments({
                        deliveryPartner: boyId,
                        status: "DELIVERED"
                    }),
                    Order.countDocuments({
                        deliveryPartner: boyId,
                        status: "FAILED"
                    }),
                    Order.countDocuments({
                        deliveryPartner: boyId,
                        status: { $in: ["CANCELLED", "RETURNED"] }
                    }),
                    Order.countDocuments({
                        $or: [
                            { deliveryPartner: boyId },
                            { "assignmentHistory.deliveryPartner": boyId }
                        ]
                    }),
                    Order.aggregate([
                        { 
                            $match: { 
                                deliveryPartner: boyId, 
                                "deliveryRating.score": { $exists: true, $gt: 0 } 
                            } 
                        },
                        {
                            $group: {
                                _id: null,
                                avgRating: { $avg: "$deliveryRating.score" },
                                ratingCount: { $sum: 1 }
                            }
                        }
                    ])
                ]);

                const totalCompletedOrFailed = completedDeliveries + failedDeliveries + cancelledDeliveries;
                const completionRate = totalCompletedOrFailed > 0
                    ? Math.round((completedDeliveries / totalCompletedOrFailed) * 100)
                    : 100;

                // Availability state
                let availability = "AVAILABLE";
                if (!boy.active) {
                    availability = "INACTIVE";
                } else if (activeDeliveries > 0) {
                    availability = "BUSY";
                }

                const avgRating = ratingAgg[0]?.avgRating ? Math.round(ratingAgg[0].avgRating * 10) / 10 : 5.0;
                const ratingCount = ratingAgg[0]?.ratingCount || 0;

                return {
                    ...boy,
                    activeDeliveries,
                    completedDeliveries,
                    failedDeliveries,
                    cancelledDeliveries,
                    totalAssigned,
                    completionRate,
                    availability,
                    avgRating,
                    ratingCount
                };
            })
        );

        res.status(200).json({ success: true, data: enrichedDeliveryBoys });
    } catch (error) {
        console.error("Error fetching delivery boys:", error);
        res.status(500).json({ success: false, message: "Unable to fetch delivery boys", error: error.message });
    }
};

exports.getDeliveryBoyPerformance = async (req, res) => {
    try {
        const boyId = req.params.id;
        const boy = await User.findOne({ _id: boyId, role: "delivery" }).select("-password");
        if (!boy) {
            return res.status(404).json({ success: false, message: "Delivery boy not found" });
        }

        const { startDate, endDate, dateRange } = req.query;
        let dStart = null;
        let dEnd = null;
        const now = new Date();

        if (dateRange) {
            if (dateRange === "TODAY") {
                dStart = new Date(); dStart.setHours(0, 0, 0, 0);
                dEnd = new Date(); dEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "THIS_WEEK") {
                dStart = new Date(); dStart.setDate(dStart.getDate() - dStart.getDay()); dStart.setHours(0, 0, 0, 0);
                dEnd = new Date(); dEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "THIS_MONTH") {
                dStart = new Date(now.getFullYear(), now.getMonth(), 1);
                dEnd = new Date(); dEnd.setHours(23, 59, 59, 999);
            }
        } else if (startDate || endDate) {
            if (startDate) dStart = new Date(startDate);
            if (endDate) {
                dEnd = new Date(endDate);
                dEnd.setHours(23, 59, 59, 999);
            }
        }

        const dateQuery = {};
        if (dStart) dateQuery.$gte = dStart;
        if (dEnd) dateQuery.$lte = dEnd;

        const baseMatch = { deliveryPartner: boy._id };
        if (dStart || dEnd) {
            baseMatch.createdAt = dateQuery;
        }

        const [
            activeDeliveries,
            completedDeliveries,
            failedDeliveries,
            cancelledDeliveries,
            totalAssigned,
            completedOrdersWithTime,
            ratings
        ] = await Promise.all([
            Order.countDocuments({
                deliveryPartner: boy._id,
                status: { $in: ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] }
            }),
            Order.countDocuments({
                ...baseMatch,
                status: "DELIVERED"
            }),
            Order.countDocuments({
                ...baseMatch,
                status: "FAILED"
            }),
            Order.countDocuments({
                ...baseMatch,
                status: { $in: ["CANCELLED", "RETURNED"] }
            }),
            Order.countDocuments({
                $or: [
                    { ...baseMatch },
                    { "assignmentHistory.deliveryPartner": boy._id }
                ]
            }),
            // Delivered orders with timing for avg delivery time
            Order.find({
                deliveryPartner: boy._id,
                status: "DELIVERED",
                deliveredAt: { $exists: true }
            }).select("createdAt assignedAt pickedUpAt deliveredAt"),
            // Reviews & ratings
            Order.find({
                deliveryPartner: boy._id,
                "deliveryRating.score": { $exists: true, $gt: 0 }
            })
            .select("deliveryRating createdAt customer")
            .populate("customer", "name profilePic")
            .sort({ createdAt: -1 })
            .limit(20)
        ]);

        // Calculate average delivery duration in minutes
        let totalDurationMinutes = 0;
        let timedOrdersCount = 0;

        completedOrdersWithTime.forEach(o => {
            const start = o.pickedUpAt || o.assignedAt || o.createdAt;
            const end = o.deliveredAt;
            if (start && end) {
                const diffMin = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60);
                if (diffMin > 0 && diffMin < 600) { // filter anomalies > 10 hours
                    totalDurationMinutes += diffMin;
                    timedOrdersCount++;
                }
            }
        });

        const avgDeliveryTimeMinutes = timedOrdersCount > 0 
            ? Math.round(totalDurationMinutes / timedOrdersCount) 
            : 25; // standard 25 mins baseline

        const totalHandled = completedDeliveries + failedDeliveries + cancelledDeliveries;
        const completionRate = totalHandled > 0 
            ? Math.round((completedDeliveries / totalHandled) * 100) 
            : 100;

        const ratingScores = ratings.map(r => r.deliveryRating?.score).filter(Boolean);
        const avgRating = ratingScores.length > 0 
            ? Math.round((ratingScores.reduce((a, b) => a + b, 0) / ratingScores.length) * 10) / 10 
            : 5.0;

        res.status(200).json({
            success: true,
            data: {
                deliveryBoy: boy,
                performance: {
                    totalAssigned,
                    activeDeliveries,
                    completedDeliveries,
                    failedDeliveries,
                    cancelledDeliveries,
                    completionRate,
                    avgDeliveryTimeMinutes,
                    avgRating,
                    totalRatings: ratingScores.length,
                    reviews: ratings.map(r => ({
                        orderId: r._id,
                        score: r.deliveryRating?.score,
                        review: r.deliveryRating?.review,
                        createdAt: r.createdAt,
                        customerName: r.customer?.name || "Customer"
                    }))
                }
            }
        });
    } catch (error) {
        console.error("Error fetching delivery boy performance:", error);
        res.status(500).json({ success: false, message: "Unable to fetch performance report", error: error.message });
    }
};

exports.getDeliveryBoyOrders = async (req, res) => {
    try {
        const boyId = req.params.id;
        const { status, page = 1, limit = 20 } = req.query;

        const query = {
            $or: [
                { deliveryPartner: boyId },
                { "assignmentHistory.deliveryPartner": boyId }
            ]
        };

        if (status && status !== "ALL") {
            query.status = status;
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const skip = (pageNum - 1) * limitNum;

        const [total, orders] = await Promise.all([
            Order.countDocuments(query),
            Order.find(query)
                .populate("customer", "name email mobile")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
        ]);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (error) {
        console.error("Error fetching delivery boy orders:", error);
        res.status(500).json({ success: false, message: "Unable to fetch delivery boy orders", error: error.message });
    }
};

exports.getDeliveryBoyDetails = async (req, res) => {
    try {
        const boyId = req.params.id;
        const boy = await User.findOne({ _id: boyId, role: "delivery" }).select("-password").lean();
        if (!boy) {
            return res.status(404).json({ success: false, message: "Delivery staff not found" });
        }

        // Current active assignments
        const currentAssignments = await Order.find({
            deliveryPartner: boyId,
            status: { $in: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] }
        })
        .populate("customer", "name mobile location")
        .sort({ assignedAt: -1, createdAt: -1 });

        // Historical deliveries
        const deliveryHistory = await Order.find({
            $or: [
                { deliveryPartner: boyId },
                { "assignmentHistory.deliveryPartner": boyId }
            ],
            status: { $in: ["DELIVERED", "FAILED", "CANCELLED", "RETURNED"] }
        })
        .populate("customer", "name mobile")
        .sort({ deliveredAt: -1, updatedAt: -1, createdAt: -1 })
        .limit(50);

        // Calculate delivery duration for history
        const formattedHistory = deliveryHistory.map(ord => {
            const start = ord.pickedUpAt || ord.assignedAt || ord.createdAt;
            const end = ord.deliveredAt || ord.failedAt || ord.cancelledAt || ord.updatedAt;
            let durationMinutes = null;
            if (ord.status === "DELIVERED" && ord.deliveredAt && start) {
                const diff = (new Date(ord.deliveredAt).getTime() - new Date(start).getTime()) / (1000 * 60);
                if (diff > 0 && diff < 1440) {
                    durationMinutes = Math.round(diff);
                }
            }
            return {
                _id: ord._id,
                customer: ord.customer ? { name: ord.customer.name, mobile: ord.customer.mobile } : null,
                deliveryAddress: ord.deliveryAddress,
                totalAmount: ord.totalAmount,
                paymentMethod: ord.paymentMethod,
                paymentStatus: ord.paymentStatus,
                status: ord.status,
                assignedAt: ord.assignedAt,
                deliveredAt: ord.deliveredAt,
                createdAt: ord.createdAt,
                durationMinutes,
                rating: ord.deliveryRating?.score
            };
        });

        // Work Stats
        const [
            activeDeliveries,
            completedDeliveries,
            failedDeliveries,
            cancelledDeliveries,
            totalHandled,
            mostRecentOrder,
            ratingAgg
        ] = await Promise.all([
            Order.countDocuments({
                deliveryPartner: boyId,
                status: "OUT_FOR_DELIVERY"
            }),
            Order.countDocuments({
                deliveryPartner: boyId,
                status: "DELIVERED"
            }),
            Order.countDocuments({
                deliveryPartner: boyId,
                status: "FAILED"
            }),
            Order.countDocuments({
                deliveryPartner: boyId,
                status: { $in: ["CANCELLED", "RETURNED"] }
            }),
            Order.countDocuments({
                $or: [
                    { deliveryPartner: boyId },
                    { "assignmentHistory.deliveryPartner": boyId }
                ]
            }),
            Order.findOne({
                deliveryPartner: boyId,
                status: "DELIVERED"
            }).sort({ deliveredAt: -1, updatedAt: -1 }),
            Order.aggregate([
                { $match: { deliveryPartner: boy._id, "deliveryRating.score": { $exists: true, $gt: 0 } } },
                { $group: { _id: null, avgRating: { $avg: "$deliveryRating.score" } } }
            ])
        ]);

        const assignedOrdersCount = currentAssignments.length;
        let availability = "AVAILABLE";
        if (!boy.active) {
            availability = "INACTIVE";
        } else if (assignedOrdersCount > 0) {
            availability = "BUSY";
        }

        const avgRating = ratingAgg[0]?.avgRating ? Math.round(ratingAgg[0].avgRating * 10) / 10 : 5.0;

        res.status(200).json({
            success: true,
            data: {
                staff: {
                    ...boy,
                    availability,
                    assignedOrdersCount,
                    activeDeliveries,
                    completedDeliveries,
                    failedDeliveries,
                    cancelledDeliveries,
                    totalHandled,
                    avgRating,
                    mostRecentDelivery: mostRecentOrder ? {
                        orderId: mostRecentOrder._id,
                        deliveredAt: mostRecentOrder.deliveredAt || mostRecentOrder.updatedAt,
                        totalAmount: mostRecentOrder.totalAmount
                    } : null
                },
                currentAssignments,
                deliveryHistory: formattedHistory
            }
        });
    } catch (error) {
        console.error("Error fetching delivery boy details:", error);
        res.status(500).json({ success: false, message: "Unable to fetch delivery boy details", error: error.message });
    }
};

exports.updateDeliveryBoy = async (req, res) => {
    try {
        const { name, mobile, address, birthYear, active, password, reassignPartnerId, unassignActive } = req.body;
        
        const existingBoy = await User.findOne({ _id: req.params.id, role: "delivery" });
        if (!existingBoy) {
            return res.status(404).json({ success: false, message: "Delivery boy not found" });
        }

        // Safe deactivation workflow:
        if (active === false && existingBoy.active === true) {
            const activeOrders = await Order.find({
                deliveryPartner: req.params.id,
                status: { $in: ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] }
            });

            if (activeOrders.length > 0) {
                // If admin didn't specify reassignment or unassignment, halt and warn
                if (!reassignPartnerId && !unassignActive) {
                    return res.status(400).json({
                        success: false,
                        hasActiveOrders: true,
                        activeOrdersCount: activeOrders.length,
                        activeOrders: activeOrders.map(o => ({ _id: o._id, status: o.status, totalAmount: o.totalAmount })),
                        message: `Cannot deactivate staff member: ${activeOrders.length} active delivery order(s) currently assigned. Please reassign or unassign active orders before deactivating.`
                    });
                }

                const adminUser = await User.findById(req.user).select("name");
                const adminName = adminUser ? adminUser.name : "Admin";
                const now = new Date();

                if (reassignPartnerId) {
                    const newPartner = await User.findOne({ _id: reassignPartnerId, role: "delivery", active: true, isDelete: false });
                    if (!newPartner) {
                        return res.status(400).json({ success: false, message: "New delivery partner is invalid or inactive" });
                    }

                    // Reassign all active orders to newPartner
                    for (const ord of activeOrders) {
                        await Order.findByIdAndUpdate(ord._id, {
                            $set: { deliveryPartner: newPartner._id, assignedAt: now },
                            $push: {
                                assignmentHistory: {
                                    deliveryPartner: newPartner._id,
                                    deliveryPartnerName: newPartner.name,
                                    assignedAt: now,
                                    assignedBy: req.user,
                                    action: "REASSIGNED"
                                },
                                statusHistory: {
                                    status: ord.status,
                                    changedAt: now,
                                    changedBy: req.user,
                                    changerRole: "admin",
                                    changerName: adminName,
                                    note: `Reassigned from ${existingBoy.name} to ${newPartner.name} due to staff deactivation`
                                }
                            }
                        });
                    }
                } else if (unassignActive) {
                    for (const ord of activeOrders) {
                        await Order.findByIdAndUpdate(ord._id, {
                            $set: { deliveryPartner: null, assignedAt: null, status: "CONFIRMED" },
                            $push: {
                                assignmentHistory: {
                                    deliveryPartner: existingBoy._id,
                                    assignedAt: ord.assignedAt || now,
                                    unassignedAt: now,
                                    assignedBy: req.user,
                                    action: "UNASSIGNED"
                                },
                                statusHistory: {
                                    status: "CONFIRMED",
                                    changedAt: now,
                                    changedBy: req.user,
                                    changerRole: "admin",
                                    changerName: adminName,
                                    note: `Unassigned due to staff deactivation by ${adminName}`
                                }
                            }
                        });
                    }
                }
            }
        }

        const updateData = { name, mobile, address, birthYear, active };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const deliveryBoy = await User.findOneAndUpdate(
            { _id: req.params.id, role: "delivery" },
            { $set: updateData },
            { new: true }
        ).select("-password");

        res.status(200).json({ success: true, message: "Delivery boy updated successfully", data: deliveryBoy });
    } catch (error) {
        console.error("updateDeliveryBoy error:", error);
        res.status(500).json({ success: false, message: "Unable to update delivery boy", error: error.message });
    }
};

exports.getDeliveryStaffReports = async (req, res) => {
    try {
        const { staffId, dateRange, startDate, endDate, status } = req.query;

        // Date calculations
        let dStart = null;
        let dEnd = null;
        const now = new Date();

        if (dateRange && dateRange !== "ALL") {
            if (dateRange === "TODAY") {
                dStart = new Date(); dStart.setHours(0, 0, 0, 0);
                dEnd = new Date(); dEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "YESTERDAY") {
                dStart = new Date(); dStart.setDate(dStart.getDate() - 1); dStart.setHours(0, 0, 0, 0);
                dEnd = new Date(); dEnd.setDate(dEnd.getDate() - 1); dEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "THIS_WEEK") {
                dStart = new Date(); dStart.setDate(dStart.getDate() - dStart.getDay()); dStart.setHours(0, 0, 0, 0);
                dEnd = new Date(); dEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "THIS_MONTH") {
                dStart = new Date(now.getFullYear(), now.getMonth(), 1);
                dEnd = new Date(); dEnd.setHours(23, 59, 59, 999);
            } else if (dateRange === "LAST_MONTH") {
                dStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                dEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            } else if (dateRange === "CUSTOM" && (startDate || endDate)) {
                if (startDate) dStart = new Date(startDate);
                if (endDate) {
                    dEnd = new Date(endDate);
                    dEnd.setHours(23, 59, 59, 999);
                }
            }
        } else if (startDate || endDate) {
            if (startDate) dStart = new Date(startDate);
            if (endDate) {
                dEnd = new Date(endDate);
                dEnd.setHours(23, 59, 59, 999);
            }
        }

        // Fetch staff members to report on
        const staffQuery = { role: "delivery", isDelete: false };
        if (staffId && staffId !== "ALL" && mongoose.Types.ObjectId.isValid(staffId)) {
            staffQuery._id = staffId;
        }

        const deliveryStaffList = await User.find(staffQuery).select("-password").lean();
        const activeStaffCount = deliveryStaffList.filter(s => s.active).length;

        // Build base order match
        const orderDateMatch = {};
        if (dStart || dEnd) {
            orderDateMatch.createdAt = {};
            if (dStart) orderDateMatch.createdAt.$gte = dStart;
            if (dEnd) orderDateMatch.createdAt.$lte = dEnd;
        }

        if (status && status !== "ALL") {
            orderDateMatch.status = status;
        }

        // Calculate per-staff report metrics
        const staffReports = await Promise.all(
            deliveryStaffList.map(async (staff) => {
                const sid = staff._id;

                const staffOrderMatch = {
                    ...orderDateMatch,
                    $or: [
                        { deliveryPartner: sid },
                        { "assignmentHistory.deliveryPartner": sid }
                    ]
                };

                const [
                    totalHandled,
                    assignedInPeriod,
                    completedInPeriod,
                    pendingInPeriod,
                    failedInPeriod,
                    cancelledInPeriod,
                    timedDeliveries,
                    latestDelivery,
                    ratingAgg
                ] = await Promise.all([
                    // Total all-time
                    Order.countDocuments({
                        $or: [
                            { deliveryPartner: sid },
                            { "assignmentHistory.deliveryPartner": sid }
                        ]
                    }),
                    // Assigned during period
                    Order.countDocuments({
                        ...staffOrderMatch,
                        $or: [
                            { assignedAt: (dStart || dEnd) ? { ...(dStart && { $gte: dStart }), ...(dEnd && { $lte: dEnd }) } : { $exists: true } },
                            { assignedAt: { $exists: false }, ...orderDateMatch }
                        ]
                    }),
                    // Completed in period
                    Order.countDocuments({
                        ...staffOrderMatch,
                        status: "DELIVERED"
                    }),
                    // Pending in period
                    Order.countDocuments({
                        deliveryPartner: sid,
                        status: { $in: ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] }
                    }),
                    // Failed in period
                    Order.countDocuments({
                        ...staffOrderMatch,
                        status: "FAILED"
                    }),
                    // Cancelled in period
                    Order.countDocuments({
                        ...staffOrderMatch,
                        status: { $in: ["CANCELLED", "RETURNED"] }
                    }),
                    // Timed completed orders for average calculation
                    Order.find({
                        ...staffOrderMatch,
                        status: "DELIVERED",
                        deliveredAt: { $exists: true }
                    }).select("assignedAt pickedUpAt deliveredAt createdAt"),
                    // Latest delivery
                    Order.findOne({
                        deliveryPartner: sid,
                        status: "DELIVERED"
                    }).sort({ deliveredAt: -1, updatedAt: -1 }).select("deliveredAt updatedAt"),
                    // Rating
                    Order.aggregate([
                        { $match: { deliveryPartner: sid, "deliveryRating.score": { $exists: true, $gt: 0 } } },
                        { $group: { _id: null, avgRating: { $avg: "$deliveryRating.score" } } }
                    ])
                ]);

                // Calculate accurate average delivery time in minutes
                let totalDuration = 0;
                let validCount = 0;
                timedDeliveries.forEach(o => {
                    const start = o.pickedUpAt || o.assignedAt || o.createdAt;
                    const end = o.deliveredAt;
                    if (start && end) {
                        const mins = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60);
                        if (mins > 0 && mins < 600) {
                            totalDuration += mins;
                            validCount++;
                        }
                    }
                });

                const avgDeliveryDuration = validCount > 0 ? Math.round(totalDuration / validCount) : 0;
                const denominator = completedInPeriod + failedInPeriod + cancelledInPeriod;
                const completionPercentage = denominator > 0 ? Math.round((completedInPeriod / denominator) * 100) : 100;
                const avgRating = ratingAgg[0]?.avgRating ? Math.round(ratingAgg[0].avgRating * 10) / 10 : 5.0;

                return {
                    staffId: staff._id,
                    staffName: staff.name,
                    profilePic: staff.profilePic,
                    mobile: staff.mobile,
                    email: staff.email,
                    active: staff.active,
                    totalHandled,
                    assignedInPeriod: assignedInPeriod || totalHandled,
                    completedDeliveries: completedInPeriod,
                    pendingDeliveries: pendingInPeriod,
                    failedDeliveries: failedInPeriod,
                    cancelledDeliveries: cancelledInPeriod,
                    completionPercentage,
                    avgDeliveryDuration,
                    avgRating,
                    lastDeliveryDate: latestDelivery?.deliveredAt || latestDelivery?.updatedAt || null
                };
            })
        );

        // Summary totals across reported staff
        const totalDeliveriesAssigned = staffReports.reduce((acc, s) => acc + s.assignedInPeriod, 0);
        const successfullyDelivered = staffReports.reduce((acc, s) => acc + s.completedDeliveries, 0);
        const pendingDeliveries = staffReports.reduce((acc, s) => acc + s.pendingDeliveries, 0);
        const failedDeliveries = staffReports.reduce((acc, s) => acc + s.failedDeliveries, 0);
        const cancelledDeliveries = staffReports.reduce((acc, s) => acc + s.cancelledDeliveries, 0);

        const totalHandledDenominator = successfullyDelivered + failedDeliveries + cancelledDeliveries;
        const completionRate = totalHandledDenominator > 0 
            ? Math.round((successfullyDelivered / totalHandledDenominator) * 100) 
            : 100;

        const staffsWithDuration = staffReports.filter(s => s.avgDeliveryDuration > 0);
        const avgDeliveryTime = staffsWithDuration.length > 0
            ? Math.round(staffsWithDuration.reduce((acc, s) => acc + s.avgDeliveryDuration, 0) / staffsWithDuration.length)
            : 25;

        // Daily aggregated delivery volume for charts (last 7 days)
        const daysToTrack = 7;
        const dailyTrend = [];
        for (let i = daysToTrack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
            const dateStr = dayStart.toLocaleDateString([], { month: "short", day: "numeric" });

            const staffIds = deliveryStaffList.map(s => s._id);
            const [completed, failed, assigned] = await Promise.all([
                Order.countDocuments({
                    deliveryPartner: { $in: staffIds },
                    status: "DELIVERED",
                    $or: [
                        { deliveredAt: { $gte: dayStart, $lte: dayEnd } },
                        { deliveredAt: { $exists: false }, updatedAt: { $gte: dayStart, $lte: dayEnd } }
                    ]
                }),
                Order.countDocuments({
                    deliveryPartner: { $in: staffIds },
                    status: "FAILED",
                    updatedAt: { $gte: dayStart, $lte: dayEnd }
                }),
                Order.countDocuments({
                    deliveryPartner: { $in: staffIds },
                    createdAt: { $gte: dayStart, $lte: dayEnd }
                })
            ]);

            dailyTrend.push({ date: dateStr, completed, failed, assigned });
        }

        // Status Distribution
        const statusDistribution = [
            { name: "Delivered", count: successfullyDelivered, color: "#22C55E" },
            { name: "Pending / Active", count: pendingDeliveries, color: "#3B82F6" },
            { name: "Failed", count: failedDeliveries, color: "#EF4444" },
            { name: "Cancelled", count: cancelledDeliveries, color: "#6B7280" }
        ];

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalDeliveriesAssigned,
                    successfullyDelivered,
                    pendingDeliveries,
                    failedDeliveries,
                    cancelledDeliveries,
                    completionRate,
                    avgDeliveryTime,
                    activeStaffCount
                },
                staffReports,
                charts: {
                    dailyTrend,
                    statusDistribution
                }
            }
        });
    } catch (error) {
        console.error("Error generating delivery staff reports:", error);
        res.status(500).json({ success: false, message: "Unable to generate delivery reports", error: error.message });
    }
};

exports.deleteDeliveryBoy = async (req, res) => {
    try {
        const deliveryBoy = await User.findOneAndUpdate(
            { _id: req.params.id, role: "delivery" },
            { isDelete: true, active: false },
            { new: true }
        );
        if (!deliveryBoy) {
            return res.status(404).json({ success: false, message: "Delivery boy not found" });
        }
        res.status(200).json({ success: true, message: "Delivery boy deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to delete delivery boy" });
    }
};

exports.getDeletedDeliveryBoys = async (req, res) => {
    try {
        const deliveryBoys = await User.find({ role: "delivery", isDelete: true }).select("-password");
        res.status(200).json({ success: true, data: deliveryBoys });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to fetch deleted delivery boys" });
    }
};

exports.restoreDeliveryBoy = async (req, res) => {
    try {
        const deliveryBoy = await User.findOneAndUpdate(
            { _id: req.params.id, role: "delivery" },
            { isDelete: false, active: true },
            { new: true }
        );
        if (!deliveryBoy) {
            return res.status(404).json({ success: false, message: "Delivery boy not found" });
        }
        res.status(200).json({ success: true, message: "Delivery boy restored successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to restore delivery boy" });
    }
};

exports.permanentlyDeleteDeliveryBoy = async (req, res) => {
    try {
        const Order = require("../models/Order");
        const orderCount = await Order.countDocuments({ deliveryPartner: req.params.id });
        if (orderCount > 0) {
            return res.status(400).json({ success: false, message: "Cannot permanently delete. Delivery boy is referenced in historical orders. Please keep them in the Trash to preserve order history." });
        }
        
        const deliveryBoy = await User.findOneAndDelete({ _id: req.params.id, role: "delivery", isDelete: true });
        if (!deliveryBoy) {
            return res.status(404).json({ success: false, message: "Delivery boy not found in trash" });
        }
        res.status(200).json({ success: true, message: "Delivery boy permanently deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to permanently delete delivery boy" });
    }
};

exports.getAllReplacements = async (req, res) => {
    try {
        const replacements = await ReplacementRequest.find()
            .populate("customer", "name email mobile")
            .populate("order", "_id createdAt status")
            .populate("product", "name image")
            .populate("replacementProduct", "name image")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: replacements });
    } catch (error) {
        console.error("getAllReplacements error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch replacement requests" });
    }
};

exports.updateReplacementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, replacementProduct } = req.body;

        const updateData = { status };
        if (replacementProduct) {
            updateData.replacementProduct = replacementProduct;
        }

        const replacement = await ReplacementRequest.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate("customer", "name email mobile")
        .populate("order", "_id createdAt status")
        .populate("product", "name image")
        .populate("replacementProduct", "name image");

        if (!replacement) {
            return res.status(404).json({ success: false, message: "Replacement request not found" });
        }

        res.status(200).json({ success: true, message: "Replacement status updated successfully", data: replacement });
    } catch (error) {
        console.error("updateReplacementStatus error:", error);
        res.status(500).json({ success: false, message: "Failed to update replacement status" });
    }
};