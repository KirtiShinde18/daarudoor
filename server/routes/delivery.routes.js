const router = require("express").Router();
const deliveryController = require("../controllers/delivery.controller");

// Dashboard
router.get("/dashboard-stats", deliveryController.getDashboardStats);

// Orders
router
    .get("/orders", deliveryController.getAssignedOrders)
    .get("/orders/:id", deliveryController.getOrderDetails)
    .put("/orders/:id/status", deliveryController.updateOrderStatus)
    .put("/orders/:id/location", deliveryController.updateOrderLocation);

// Profile
router
    .get("/profile", deliveryController.getProfile)
    .put("/profile", deliveryController.updateProfile);

module.exports = router;
