const router = require("express").Router();
const { handleWebhook } = require("../controllers/ageVerification.controller");

router.post("/", handleWebhook);

module.exports = router;
