const router = require("express").Router();
const { saveDOB, startVerification, getVerificationStatus } = require("../controllers/ageVerification.controller");

router.patch("/dob", saveDOB);
router.post("/start", startVerification);
router.get("/status", getVerificationStatus);

module.exports = router;
