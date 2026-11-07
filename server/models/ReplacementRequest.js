const mongoose = require("mongoose");

const replacementRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    originalItemName: String,
    originalItemImage: String,
    quantity: {
      type: Number,
      default: 1,
    },
    reason: {
      type: String,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ["Requested", "Approved", "Rejected", "Replacement Completed"],
      default: "Requested",
    },
    replacementProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReplacementRequest", replacementRequestSchema);
