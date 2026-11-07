const router = require("express").Router();
const { updateLocation, updateProfile, getMyOrders, getActiveOrders, getOrderById, getOrderLocation, cancelOrder, requestReplacement, getOrderReplacements, getMyReplacements, submitDeliveryRating } = require("../controllers/customer.controller");
const productController = require("../controllers/product.controller");
const reviewController = require("../controllers/review.controller");
const { protect } = require("../middlewares/auth.middlewares");

router
    .post("/location", protect("customer"), updateLocation)
    .get("/products", productController.getProducts)
    .get("/products/:id", productController.getProductById)
    .get("/products/:id/reviews", reviewController.getProductReviews)
    .get("/products/:id/can-review", protect("customer"), reviewController.checkReviewEligibility)
    .post("/products/:id/reviews", protect("customer"), reviewController.addReview)
    .put("/profile", protect("customer"), updateProfile)
    .get("/orders", protect("customer"), getMyOrders)
    .get("/orders/active", protect("customer"), getActiveOrders)
    .get("/orders/:id", protect("customer"), getOrderById)
    .get("/orders/:id/location", protect("customer"), getOrderLocation)
    .post("/orders/:id/cancel", protect("customer"), cancelOrder)
    .post("/orders/:id/replacement", protect("customer"), requestReplacement)
    .get("/orders/:id/replacements", protect("customer"), getOrderReplacements)
    .get("/replacements", protect("customer"), getMyReplacements)
    .post("/orders/:id/rating", protect("customer"), submitDeliveryRating);

const offerController = require("../controllers/offer.controller");
router
    .get("/offers/active", offerController.getActiveOffers)
    .post("/offers/validate", protect("customer"), offerController.validateOffer);

router.use("/address", require("./address.routes"));

module.exports = router;
