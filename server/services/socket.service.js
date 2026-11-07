const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Mobile apps (Expo) and Web Admin
      methods: ["GET", "POST", "PUT"],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ["websocket", "polling"],
  });

  // JWT Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization &&
          socket.handshake.headers.authorization.replace(/^Bearer\s+/i, ""));

      if (!token) {
        return next(new Error("Authentication error: Token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_KEY);
      if (!decoded || !decoded.userId) {
        return next(new Error("Authentication error: Invalid token"));
      }

      const user = await User.findById(decoded.userId).select("-password -otp");
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      next(new Error("Authentication error: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${socket.id} (User: ${user.name || user.email}, Role: ${user.role})`);

    // Join user-specific private room for direct notifications
    socket.join(`user_${user._id}`);

    // Join order tracking room with strict authorization
    socket.on("join_order", async (data, ack) => {
      try {
        const orderId = typeof data === "string" ? data : data?.orderId;
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
          if (typeof ack === "function") ack({ success: false, message: "Invalid order ID" });
          return;
        }

        const order = await Order.findById(orderId)
          .populate("customer", "name mobile location")
          .populate("deliveryPartner", "name mobile profilePic");

        if (!order) {
          if (typeof ack === "function") ack({ success: false, message: "Order not found" });
          return;
        }

        // Authorization Check:
        // Admin: allowed to track all orders
        // Customer: allowed only if order belongs to customer
        // Delivery: allowed only if order is assigned to delivery partner
        const isCustomer = user.role === "customer" && order.customer?._id?.toString() === user._id.toString();
        const isDelivery = user.role === "delivery" && order.deliveryPartner?._id?.toString() === user._id.toString();
        const isAdmin = user.role === "admin";

        if (!isAdmin && !isCustomer && !isDelivery) {
          console.warn(`⛔ Unauthorized tracking attempt by user ${user._id} for order ${orderId}`);
          if (typeof ack === "function") ack({ success: false, message: "Unauthorized to track this order" });
          return;
        }

        const roomName = `order_${orderId}`;
        socket.join(roomName);
        console.log(`📡 Socket ${socket.id} (${user.role}) joined ${roomName}`);

        const responsePayload = {
          success: true,
          orderId: order._id,
          status: order.status,
          currentLocation: order.currentLocation,
          customerLocation: order.deliveryAddress?.latitude ? {
            latitude: order.deliveryAddress.latitude,
            longitude: order.deliveryAddress.longitude
          } : order.customer?.location,
          deliveryPartner: order.deliveryPartner ? {
            _id: order.deliveryPartner._id,
            name: order.deliveryPartner.name,
            mobile: order.deliveryPartner.mobile,
            profilePic: order.deliveryPartner.profilePic
          } : null,
          timestamps: {
            assignedAt: order.assignedAt,
            acceptedAt: order.acceptedAt,
            pickedUpAt: order.pickedUpAt,
            arrivedAt: order.arrivedAt,
            deliveredAt: order.deliveredAt,
          }
        };

        if (typeof ack === "function") ack(responsePayload);
      } catch (err) {
        console.error("Error joining order tracking room:", err);
        if (typeof ack === "function") ack({ success: false, message: "Failed to join order room" });
      }
    });

    // Leave order room
    socket.on("leave_order", (data) => {
      const orderId = typeof data === "string" ? data : data?.orderId;
      if (orderId) {
        socket.leave(`order_${orderId}`);
        console.log(`🔌 Socket ${socket.id} left order_${orderId}`);
      }
    });

    // Real-time location push directly from delivery partner socket
    socket.on("delivery_location_update", async (data, ack) => {
      try {
        if (user.role !== "delivery") {
          if (typeof ack === "function") ack({ success: false, message: "Only delivery partners can update location" });
          return;
        }

        const { orderId, latitude, longitude, heading, speed, accuracy } = data || {};
        if (!orderId || !latitude || !longitude) {
          if (typeof ack === "function") ack({ success: false, message: "Missing location parameters" });
          return;
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        if (isNaN(lat) || isNaN(lng)) {
          if (typeof ack === "function") ack({ success: false, message: "Invalid coordinates" });
          return;
        }

        const locationUpdate = {
          latitude: lat,
          longitude: lng,
          heading: Number(heading) || 0,
          speed: Number(speed) || 0,
          accuracy: Number(accuracy) || 0,
          timestamp: new Date()
        };

        // Update in active order assigned to this delivery partner
        const updatedOrder = await Order.findOneAndUpdate(
          {
            _id: orderId,
            deliveryPartner: user._id,
            status: { $in: ["ACCEPTED", "OUT_FOR_DELIVERY", "ARRIVED"] }
          },
          { currentLocation: locationUpdate },
          { new: true }
        ).select("currentLocation status deliveryPartner customer deliveryAddress");

        if (!updatedOrder) {
          if (typeof ack === "function") ack({ success: false, message: "Order not found or not active" });
          return;
        }

        // Also update delivery user's live position in User record
        await User.findByIdAndUpdate(user._id, {
          "location.latitude": lat,
          "location.longitude": lng,
          lastActiveAt: new Date(),
          isOnline: true
        });

        // Broadcast to all authorized listeners in this order's room
        io.to(`order_${orderId}`).emit("delivery_location_updated", {
          orderId,
          currentLocation: locationUpdate,
          status: updatedOrder.status,
          updatedAt: locationUpdate.timestamp
        });

        if (typeof ack === "function") ack({ success: true, location: locationUpdate });
      } catch (err) {
        console.error("delivery_location_update socket error:", err);
        if (typeof ack === "function") ack({ success: false, message: "Failed to update location" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper to broadcast order events from controllers
const emitToOrder = (orderId, event, data) => {
  if (io && orderId) {
    io.to(`order_${orderId}`).emit(event, {
      orderId,
      ...data,
      timestamp: new Date()
    });
  }
};

const getIO = () => io;

module.exports = {
  initSocket,
  emitToOrder,
  getIO,
};
