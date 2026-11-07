const Order = require("../models/Order");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { emitToOrder } = require("../services/socket.service");

//============================================================== DASHBOARD / ORDERS =====================================================

exports.getDashboardStats = async (req, res) => {
    try {
        const deliveryBoyId = req.user;
        const orders = await Order.find({ deliveryPartner: deliveryBoyId });

        let totalAssigned = orders.length;
        let pendingDeliveries = 0;
        let outForDelivery = 0;
        let delivered = 0;
        let cancelled = 0;
        let todayDeliveries = 0;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        orders.forEach(order => {
            if (["PROCESSING", "CONFIRMED", "READY_FOR_PICKUP", "ACCEPTED"].includes(order.status)) {
                pendingDeliveries++;
            }
            if (["OUT_FOR_DELIVERY", "ARRIVED"].includes(order.status)) {
                outForDelivery++;
            }
            if (order.status === "DELIVERED") {
                delivered++;
                if (order.updatedAt >= startOfToday) todayDeliveries++;
            }
            if (["CANCELLED", "RETURNED", "FAILED"].includes(order.status)) {
                cancelled++;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalAssigned,
                pendingDeliveries,
                outForDelivery,
                delivered,
                cancelled,
                todayDeliveries
            }
        });
    } catch (error) {
        console.error("Error fetching delivery dashboard stats:", error);
        res.status(500).json({ success: false, message: "Unable to fetch dashboard stats", error: error.message });
    }
};

exports.getAssignedOrders = async (req, res) => {
    try {
        const deliveryBoyId = req.user;
        const { startDate, endDate } = req.query;

        const query = { deliveryPartner: deliveryBoyId };
        
        if (startDate || endDate) {
            const dateQuery = {};
            if (startDate) dateQuery.$gte = new Date(startDate);
            if (endDate) dateQuery.$lte = new Date(endDate);
            
            query.$or = [
                { assignedAt: dateQuery },
                { assignedAt: { $exists: false }, createdAt: dateQuery }
            ];
        }

        const orders = await Order.find(query)
            .populate("customer", "name email mobile location")
            .sort({ assignedAt: -1, createdAt: -1 });

        // Ensure deliveryAddress has latitude/longitude fallback
        const enrichedOrders = orders.map(order => {
            const orderObj = order.toObject();
            if (orderObj.deliveryAddress && (!orderObj.deliveryAddress.latitude || !orderObj.deliveryAddress.longitude)) {
                if (orderObj.customer?.location?.latitude && orderObj.customer?.location?.longitude) {
                    orderObj.deliveryAddress.latitude = orderObj.customer.location.latitude;
                    orderObj.deliveryAddress.longitude = orderObj.customer.location.longitude;
                }
            }
            return orderObj;
        });

        res.status(200).json({ success: true, data: enrichedOrders });
    } catch (error) {
        console.error("Error fetching assigned orders:", error);
        res.status(500).json({ success: false, message: "Unable to fetch assigned orders", error: error.message });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const deliveryBoyId = req.user;
        const order = await Order.findOne({ _id: req.params.id, deliveryPartner: deliveryBoyId })
            .populate("customer", "name email mobile location")
            .populate("deliveryPartner", "name mobile profilePic");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
        }

        const orderObj = order.toObject();
        // Fallback coordinates if deliveryAddress lacks them
        if (orderObj.deliveryAddress && (!orderObj.deliveryAddress.latitude || !orderObj.deliveryAddress.longitude)) {
            if (orderObj.customer?.location?.latitude && orderObj.customer?.location?.longitude) {
                orderObj.deliveryAddress.latitude = orderObj.customer.location.latitude;
                orderObj.deliveryAddress.longitude = orderObj.customer.location.longitude;
            }
        }

        res.status(200).json({ success: true, data: orderObj });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({ success: false, message: "Unable to fetch order details", error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const deliveryBoyId = req.user;
        const { status } = req.body;
        
        // Delivery boy can transition through these statuses:
        // ACCEPTED -> OUT_FOR_DELIVERY -> ARRIVED -> DELIVERED
        const validStatuses = ["ACCEPTED", "OUT_FOR_DELIVERY", "ARRIVED", "DELIVERED"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid status update for delivery partner. Must be one of: ${validStatuses.join(", ")}` 
            });
        }

        const order = await Order.findOne({ _id: req.params.id, deliveryPartner: deliveryBoyId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
        }

        const deliveryPartnerUser = await User.findById(deliveryBoyId).select("name mobile");

        const now = new Date();
        order.status = status;

        if (status === "ACCEPTED") {
            order.acceptedAt = now;
        } else if (status === "OUT_FOR_DELIVERY") {
            order.pickedUpAt = now;
        } else if (status === "ARRIVED") {
            order.arrivedAt = now;
        } else if (status === "DELIVERED") {
            order.deliveredAt = now;
            if (order.paymentMethod === "COD") {
                order.paymentStatus = "PAID";
            }
        }

        order.statusHistory.push({
            status,
            changedAt: now,
            changedBy: deliveryBoyId,
            changerRole: "delivery",
            changerName: deliveryPartnerUser?.name || "Delivery Partner",
            note: `Status updated to ${status} by delivery partner`
        });

        await order.save();

        // Real-time broadcast to order tracking room
        emitToOrder(order._id, "order_status_updated", {
            orderId: order._id,
            status,
            updatedAt: now,
            timestamps: {
                assignedAt: order.assignedAt,
                acceptedAt: order.acceptedAt,
                pickedUpAt: order.pickedUpAt,
                arrivedAt: order.arrivedAt,
                deliveredAt: order.deliveredAt,
            }
        });

        res.status(200).json({ 
            success: true, 
            message: `Order status updated to ${status}`, 
            data: order 
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Unable to update order status", error: error.message });
    }
};

exports.updateOrderLocation = async (req, res) => {
    try {
        const deliveryBoyId = req.user;
        const { latitude, longitude, heading, speed, accuracy } = req.body;
        
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ success: false, message: "Valid latitude and longitude are required" });
        }

        const locationData = {
            latitude: lat,
            longitude: lng,
            heading: Number(heading) || 0,
            speed: Number(speed) || 0,
            accuracy: Number(accuracy) || 0,
            timestamp: new Date()
        };

        const order = await Order.findOneAndUpdate(
            { 
                _id: req.params.id, 
                deliveryPartner: deliveryBoyId, 
                status: { $in: ["ACCEPTED", "OUT_FOR_DELIVERY", "ARRIVED"] } 
            },
            { currentLocation: locationData },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found, not assigned to you, or not in an active tracking state" 
            });
        }

        // Also update delivery partner user's live position
        await User.findByIdAndUpdate(deliveryBoyId, {
            "location.latitude": lat,
            "location.longitude": lng,
            lastActiveAt: new Date(),
            isOnline: true
        });

        // Broadcast real-time location update to order room
        emitToOrder(order._id, "delivery_location_updated", {
            orderId: order._id,
            currentLocation: locationData,
            status: order.status,
            updatedAt: locationData.timestamp
        });

        res.status(200).json({ 
            success: true, 
            message: "Location updated successfully", 
            currentLocation: locationData 
        });
    } catch (error) {
        console.error("Error updating order location:", error);
        res.status(500).json({ success: false, message: "Unable to update order location", error: error.message });
    }
};

//============================================================== PROFILE =====================================================

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user).select("-password -otp");
        if (!user || user.role !== "delivery") {
            return res.status(404).json({ success: false, message: "Delivery profile not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Error fetching delivery profile:", error);
        res.status(500).json({ success: false, message: "Unable to fetch profile", error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, mobile, address, profilePic, password } = req.body;
        
        const updateData = { name, mobile, address, profilePic };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const user = await User.findByIdAndUpdate(
            req.user,
            { $set: updateData },
            { new: true }
        ).select("-password -otp");

        res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
    } catch (error) {
        console.error("Error updating delivery profile:", error);
        res.status(500).json({ success: false, message: "Unable to update profile", error: error.message });
    }
};
