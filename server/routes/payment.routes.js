const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth.middlewares");

router.post("/create-order", protect("customer"), createOrder);
router.post("/verify", protect("customer"), verifyPayment);

module.exports = router;
