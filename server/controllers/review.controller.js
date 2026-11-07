const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

// @desc    Get all reviews for a product
// @route   GET /api/customer/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate("customer", "name")
      .sort("-createdAt");

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Check if customer can review product
// @route   GET /api/customer/products/:id/can-review
// @access  Private/Customer
const checkReviewEligibility = async (req, res) => {
  try {
    const productId = req.params.id;
    const customerId = req.user._id;

    // 1. Check if user already reviewed
    const existingReview = await Review.findOne({ product: productId, customer: customerId });
    if (existingReview) {
      return res.status(200).json({ 
        success: true, 
        eligible: false, 
        reason: "already_reviewed",
        review: existingReview
      });
    }

    // 2. Check if user purchased product and it is delivered
    const hasPurchased = await Order.findOne({
      customer: customerId,
      "products.product": productId,
      status: "DELIVERED"
    });

    if (!hasPurchased) {
      return res.status(200).json({ 
        success: true, 
        eligible: false, 
        reason: "not_purchased_or_delivered"
      });
    }

    res.status(200).json({ success: true, eligible: true });
  } catch (error) {
    console.error("Error checking eligibility:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Add a review
// @route   POST /api/customer/products/:id/reviews
// @access  Private/Customer
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const customerId = req.user._id;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Please provide rating and comment" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ product: productId, customer: customerId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    }

    // Check if user has purchased and delivered
    const order = await Order.findOne({
      customer: customerId,
      "products.product": productId,
      status: "DELIVERED"
    });

    if (!order) {
      return res.status(403).json({ success: false, message: "You can only review products that have been delivered to you." });
    }

    const review = await Review.create({
      product: productId,
      customer: customerId,
      rating: Number(rating),
      comment,
      isVerifiedPurchase: true
    });

    // Update Product averageRating and reviewCount
    const allReviews = await Review.find({ product: productId });
    const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = sum / allReviews.length;

    product.averageRating = Number(avgRating.toFixed(1));
    product.reviewCount = allReviews.length;
    await product.save();

    res.status(201).json({ success: true, data: review, message: "Review added successfully!" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  getProductReviews,
  checkReviewEligibility,
  addReview
};
