const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    deliveryAddress: {
      fullName: String,
      mobile: String,
      houseNo: String,
      building: String,
      area: String,
      landmark: String,
      city: String,
      state: String,
      pincode: String,
      addressType: String,
      latitude: Number,
      longitude: Number
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        image: String,
        category: String,
        volume: String,
        price: Number,
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    appliedOffer: {
      offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
      offerName: String,
      offerCode: String,
      discountType: String,
      discountValue: Number,
      discountAmount: Number,
      minOrderValue: Number,
      appliedAt: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Razorpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "ACCEPTED", "OUT_FOR_DELIVERY", "ARRIVED", "DELIVERED", "FAILED", "CANCELLED", "RETURNED"],
      default: "PENDING",
    },
    deliveryAgeVerification: {
      status: {
        type: String,
        enum: ["NOT_REQUIRED", "PENDING", "VERIFIED", "FAILED"],
        default: "PENDING",
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      failureReason: String,
    },
    deliveryRating: {
      score: { type: Number, min: 1, max: 5 },
      review: String,
      isDismissed: { type: Boolean, default: false },
      createdAt: Date
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      heading: Number,
      speed: Number,
      accuracy: Number,
      timestamp: Date
    },
    assignedAt: {
      type: Date
    },
    acceptedAt: {
      type: Date
    },
    confirmedAt: {
      type: Date
    },
    readyForPickupAt: {
      type: Date
    },
    pickedUpAt: {
      type: Date
    },
    arrivedAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    failureReason: {
      type: String
    },
    cancelReason: {
      type: String
    },
    internalNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        addedByName: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    assignmentHistory: [
      {
        deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        deliveryPartnerName: String,
        assignedAt: { type: Date, default: Date.now },
        unassignedAt: Date,
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        action: { type: String, enum: ["ASSIGNED", "REASSIGNED", "UNASSIGNED"], default: "ASSIGNED" }
      }
    ],
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        changerRole: String,
        changerName: String,
        note: String
      }
    ],
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ deliveryPartner: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ assignedAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
