const router = require("express").Router();
const adminController = require("../controllers/admin.controller");

// Dashboard
router.get("/dashboard-stats", adminController.getDashboardStats);

// Profile
router.get("/profile", adminController.getAdminProfile);

// Notifications
router
    .get("/notifications", adminController.getNotifications)
    .put("/notifications/read-all", adminController.markAllNotificationsRead)
    .put("/notifications/:id/read", adminController.markNotificationRead);

// Products
const productController = require("../controllers/product.controller");
router
    .post("/products", productController.createProduct)
    .get("/products", productController.getProducts)
    .get("/products/:id", productController.getProductById)
    .put("/products/:id", productController.updateProduct)
    .delete("/products/:id", productController.deleteProduct);
// Orders
router
    .get("/orders", adminController.getAllOrders)
    .get("/orders/:id", adminController.getOrderById)
    .put("/orders/:id", adminController.updateOrderStatus)
    .put("/orders/:id/assign", adminController.assignDeliveryBoy)
    .put("/orders/:id/unassign", adminController.unassignDeliveryBoy)
    .post("/orders/:id/notes", adminController.addOrderNote)
    .get("/orders/:id/tracking", adminController.getOrderTracking);

// Replacements
router
    .get("/replacements", adminController.getAllReplacements)
    .put("/replacements/:id/status", adminController.updateReplacementStatus);

// Delivery Boys / Staff
router
    .post("/delivery-boys", adminController.createDeliveryBoy)
    .get("/delivery-boys", adminController.getDeliveryBoys)
    .get("/delivery-boys/deleted", adminController.getDeletedDeliveryBoys)
    .get("/delivery-boys/:id", adminController.getDeliveryBoyDetails)
    .get("/delivery-boys/:id/performance", adminController.getDeliveryBoyPerformance)
    .get("/delivery-boys/:id/orders", adminController.getDeliveryBoyOrders)
    .put("/delivery-boys/:id/restore", adminController.restoreDeliveryBoy)
    .delete("/delivery-boys/:id/permanent", adminController.permanentlyDeleteDeliveryBoy)
    .put("/delivery-boys/:id", adminController.updateDeliveryBoy)
    .delete("/delivery-boys/:id", adminController.deleteDeliveryBoy);

// Delivery Reports
router.get("/delivery-reports", adminController.getDeliveryStaffReports);

const offerController = require("../controllers/offer.controller");
router
    .post("/offers", offerController.createOffer)
    .get("/offers", offerController.getAdminOffers)
    .get("/offers/trash", offerController.getDeletedOffers)
    .put("/offers/:id", offerController.updateOffer)
    .patch("/offers/:id/soft-delete", offerController.softDeleteOffer)
    .patch("/offers/:id/restore", offerController.restoreOffer)
    .delete("/offers/:id/permanent", offerController.permanentDeleteOffer);

module.exports = router;
