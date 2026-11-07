const router = require("express").Router();
const addressController = require("../controllers/address.controller");
const { protect } = require("../middlewares/auth.middlewares");

router.use(protect("customer")); // Require customer login for all address routes

router.route("/")
  .post(addressController.addAddress)
  .get(addressController.getMyAddresses);

router.route("/:id")
  .put(addressController.updateAddress)
  .delete(addressController.deleteAddress);

router.patch("/:id/default", addressController.setDefaultAddress);

module.exports = router;
