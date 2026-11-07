const User = require("../models/User");
const Order = require("../models/Order");
const ReplacementRequest = require("../models/ReplacementRequest");

exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, formattedAddress, city, state, postalCode, country } = req.body;
        
        if (!latitude || !longitude || !formattedAddress) {
            return res.status(400).json({ success: false, message: "Latitude, longitude and address are required" });
        }

        const locationData = {
            latitude,
            longitude,
            formattedAddress,
            city,
            state,
            postalCode,
            country
        };

        const updatedUser = await User.findByIdAndUpdate(
            req.user, // from protect middleware
            { location: locationData },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "Location updated successfully", data: updatedUser.location });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Unable to update location" });
    }
};

const { uploadImage } = require("../utils/upload");

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, mobile, profilePic } = req.body;
        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.mobile = mobile || user.mobile;

        if (profilePic && profilePic.startsWith("data:image")) {
            const uploaded = await uploadImage(profilePic, "profiles");
            if (uploaded) {
                user.profilePic = uploaded.secure_url;
            }
        } else if (profilePic === '') {
            user.profilePic = '';
        }

        await user.save();
        
        const updatedUser = await User.findById(req.user).select("-password -__v -otp");

        res.status(200).json({ success: true, message: "Profile updated successfully", data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Unable to update profile", error: error.message });
    }
};


exports.getMyOrders = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        let query = { customer: req.user };

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("getMyOrders error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

exports.getActiveOrders = async (req, res) => {
    try {
        const activeStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "ACCEPTED", "OUT_FOR_DELIVERY", "ARRIVED"];
        const orders = await Order.find({ 
            customer: req.user,
            status: { $in: activeStatuses }
        })
        .populate("deliveryPartner", "name mobile profilePic")
        .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("getActiveOrders error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch active orders" });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, customer: req.user })
            .populate("deliveryPartner", "name mobile profilePic");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("getOrderById error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch order details" });
    }
};

exports.getOrderLocation = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, customer: req.user })
            .select("currentLocation status deliveryPartner customer deliveryAddress products totalAmount paymentMethod createdAt assignedAt acceptedAt pickedUpAt arrivedAt deliveredAt updatedAt")
            .populate("customer", "location name mobile")
            .populate("deliveryPartner", "name mobile profilePic location lastActiveAt");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
        }

        const hasOrderLocation = !!(order.currentLocation && order.currentLocation.latitude && order.currentLocation.longitude);
        const lastUpdated = order.currentLocation?.timestamp || order.updatedAt;
        const staleThresholdMs = 15 * 60 * 1000; // 15 mins
        const isStale = hasOrderLocation && (Date.now() - new Date(lastUpdated).getTime() > staleThresholdMs);

        // Fallback: if order.currentLocation is not set yet, use delivery partner's current position if active
        let liveCoordinates = null;
        if (hasOrderLocation) {
            liveCoordinates = {
                latitude: order.currentLocation.latitude,
                longitude: order.currentLocation.longitude,
                heading: order.currentLocation.heading || 0,
                speed: order.currentLocation.speed || 0,
                accuracy: order.currentLocation.accuracy || 0,
                timestamp: order.currentLocation.timestamp
            };
        } else if (order.deliveryPartner?.location?.latitude && ["ACCEPTED", "OUT_FOR_DELIVERY", "ARRIVED"].includes(order.status)) {
            liveCoordinates = {
                latitude: order.deliveryPartner.location.latitude,
                longitude: order.deliveryPartner.location.longitude,
                heading: 0,
                speed: 0,
                accuracy: 0,
                timestamp: order.deliveryPartner.lastActiveAt || order.updatedAt
            };
        }

        // Customer destination coordinates
        let customerCoords = null;
        if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
            customerCoords = {
                latitude: order.deliveryAddress.latitude,
                longitude: order.deliveryAddress.longitude
            };
        } else if (order.customer?.location?.latitude && order.customer?.location?.longitude) {
            customerCoords = {
                latitude: order.customer.location.latitude,
                longitude: order.customer.location.longitude
            };
        }

        res.status(200).json({ 
            success: true, 
            data: { 
                orderId: order._id,
                currentLocation: liveCoordinates, 
                customerLocation: customerCoords,
                deliveryAddress: order.deliveryAddress,
                status: order.status, 
                isLocationStale: isStale,
                lastLocationUpdate: lastUpdated,
                deliveryPartner: order.deliveryPartner ? {
                    _id: order.deliveryPartner._id,
                    name: order.deliveryPartner.name,
                    mobile: order.deliveryPartner.mobile,
                    profilePic: order.deliveryPartner.profilePic
                } : null,
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                itemCount: order.products?.length || 0,
                timestamps: {
                    createdAt: order.createdAt,
                    assignedAt: order.assignedAt,
                    acceptedAt: order.acceptedAt,
                    pickedUpAt: order.pickedUpAt,
                    arrivedAt: order.arrivedAt,
                    deliveredAt: order.deliveredAt
                }
            } 
        });
    } catch (error) {
        console.error("getOrderLocation error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch order location" });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, customer: req.user });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        
        // Only allow cancellation in early stages
        const allowedStatuses = ["PENDING", "CONFIRMED"];
        if (!allowedStatuses.includes(order.status)) {
            return res.status(400).json({ success: false, message: `Cannot cancel order in ${order.status} state` });
        }
        
        order.status = "CANCELLED";
        
        // If payment was online and paid, update payment status based on existing rules
        if (order.paymentMethod === "RAZORPAY" || order.paymentMethod === "ONLINE") {
            if (order.paymentStatus === "PAID" || order.paymentStatus === "SUCCESS") {
                order.paymentStatus = "REFUND_PENDING"; // Keep it simple and trackable
            }
        }
        
        await order.save();
        
        res.status(200).json({ success: true, message: "Order cancelled successfully", data: order });
    } catch (error) {
        console.error("cancelOrder error:", error);
        res.status(500).json({ success: false, message: "Failed to cancel order" });
    }
};

exports.requestReplacement = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { productId, reason, description } = req.body;
        
        const order = await Order.findOne({ _id: orderId, customer: req.user });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        
        if (order.status !== "DELIVERED") {
            return res.status(400).json({ success: false, message: "Can only request replacement for delivered orders" });
        }
        
        const productItem = order.products.find(p => p.product.toString() === productId);
        if (!productItem) {
            return res.status(404).json({ success: false, message: "Product not found in this order" });
        }

        const existingRequest = await ReplacementRequest.findOne({ order: orderId, product: productId });
        if (existingRequest) {
            return res.status(400).json({ success: false, message: "Replacement already requested for this item" });
        }

        const replacement = await ReplacementRequest.create({
            order: orderId,
            customer: req.user,
            product: productId,
            originalItemName: productItem.name,
            originalItemImage: productItem.image,
            quantity: productItem.quantity,
            reason,
            description
        });

        res.status(201).json({ success: true, message: "Replacement request submitted successfully", data: replacement });
    } catch (error) {
        console.error("requestReplacement error:", error);
        res.status(500).json({ success: false, message: "Failed to request replacement" });
    }
};

exports.getOrderReplacements = async (req, res) => {
    try {
        const orderId = req.params.id;
        const replacements = await ReplacementRequest.find({ order: orderId, customer: req.user });
        res.status(200).json({ success: true, data: replacements });
    } catch (error) {
        console.error("getOrderReplacements error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch replacements" });
    }
};

exports.getMyReplacements = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        let query = { customer: req.user };

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        const replacements = await ReplacementRequest.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: replacements });
    } catch (error) {
        console.error("getMyReplacements error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch replacements" });
    }
};

exports.submitDeliveryRating = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { score, review, isDismissed } = req.body;

        const order = await Order.findOne({ _id: orderId, customer: req.user });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status !== "DELIVERED") {
            return res.status(400).json({ success: false, message: "Can only rate delivered orders" });
        }

        if (order.deliveryRating && order.deliveryRating.score) {
            return res.status(400).json({ success: false, message: "Rating already submitted for this order" });
        }

        order.deliveryRating = {
            score,
            review,
            isDismissed: isDismissed || false,
            createdAt: new Date()
        };

        await order.save();
        res.status(200).json({ success: true, message: "Rating submitted successfully" });
    } catch (error) {
        console.error("submitDeliveryRating error:", error);
        res.status(500).json({ success: false, message: "Failed to submit rating" });
    }
};
