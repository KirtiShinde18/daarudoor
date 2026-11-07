const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const Offer = require("../models/Offer");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "test",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "test",
});

const calculateOrderTotal = async (items, offerCode) => {
  let subtotal = 0;
  const snapshotItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new Error(`Product not found: ${item.product}`);
    
    // Use the actual database price, NOT the frontend price
    const unitPrice = product.price; 
    subtotal += unitPrice * item.quantity;
    
    snapshotItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      category: product.category,
      volume: product.volume,
      price: unitPrice,
      quantity: item.quantity
    });
  }

  const deliveryFee = 4.99; // Replace with dynamic logic if needed
  let appliedOffer = null;
  let discount = 0;
  if (offerCode) {
    const now = new Date();
    const offer = await Offer.findOne({ 
        code: offerCode, 
        isActive: true,
        isDeleted: false,
        startDate: { $lte: now },
        endDate: { $gte: now }
    });
    
    if (offer && (!offer.minOrderValue || subtotal >= offer.minOrderValue)) {
      if (offer.discountType === 'PERCENTAGE') {
        discount = (subtotal * offer.discountValue) / 100;
        if (offer.maxDiscount && discount > offer.maxDiscount) {
          discount = offer.maxDiscount;
        }
      } else {
        discount = offer.discountValue;
      }

      appliedOffer = {
        offerId: offer._id,
        offerName: offer.title,
        offerCode: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount: discount,
        minOrderValue: offer.minOrderValue,
        appliedAt: new Date(),
      };
    }
  }

  const totalAmount = subtotal + deliveryFee - discount;

  return { subtotal, deliveryFee, discount, totalAmount, snapshotItems, appliedOffer };
};

exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, offerCode } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    
    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }

    const { subtotal, deliveryFee, discount, totalAmount, snapshotItems, appliedOffer } = await calculateOrderTotal(items, offerCode);

    const finalDeliveryAddress = typeof deliveryAddress === "object" ? { ...deliveryAddress } : { formattedAddress: deliveryAddress };
    if (!finalDeliveryAddress.latitude || !finalDeliveryAddress.longitude) {
      if (req.user?.location?.latitude && req.user?.location?.longitude) {
        finalDeliveryAddress.latitude = req.user.location.latitude;
        finalDeliveryAddress.longitude = req.user.location.longitude;
      }
    }

    if (paymentMethod === "COD") {
      const order = await Order.create({
        customer: req.user._id,
        deliveryAddress: finalDeliveryAddress,
        products: snapshotItems,
        subtotal,
        deliveryFee,
        discount,
        totalAmount,
        appliedOffer,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: "PENDING",
      });

      // Create Admin Notification
      try {
        await Notification.create({
          employee: req.user._id,
          action: "placed a new order",
          type: "order",
          title: `New Order #${order._id.toString().slice(-6)}`,
          status: "Pending",
          link: `/admin/orders/${order._id}`,
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      return res.status(201).json({ success: true, orderId: order._id, message: "Order placed successfully (COD)" });
    } else if (paymentMethod === "Razorpay") {
      // Create Razorpay Order
      const amountInPaise = Math.round(totalAmount * 100);
      
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const razorpayOrder = await razorpay.orders.create(options);
      
      if (!razorpayOrder) {
        return res.status(500).json({ success: false, message: "Razorpay order creation failed" });
      }

      // Create Pending Order in DB
      const order = await Order.create({
        customer: req.user._id,
        deliveryAddress: finalDeliveryAddress,
        products: snapshotItems,
        subtotal,
        deliveryFee,
        discount,
        totalAmount,
        appliedOffer,
        paymentMethod: "Razorpay",
        paymentStatus: "PENDING",
        status: "PENDING",
        razorpayOrderId: razorpayOrder.id,
      });

      return res.status(201).json({
        success: true,
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID || "test",
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ success: false, message: "Order already paid" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "test")
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      order.paymentStatus = "PAID";
      order.status = "CONFIRMED";
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      await order.save();

      // Create Admin Notification
      try {
        await Notification.create({
          employee: order.customer, // Storing customer reference
          action: "placed a new order",
          type: "order",
          title: `New Order #${order._id.toString().slice(-6)}`,
          status: "Pending",
          link: `/admin/orders/${order._id}`,
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ success: false, message: "Failed to verify payment", error: error.message });
  }
};
