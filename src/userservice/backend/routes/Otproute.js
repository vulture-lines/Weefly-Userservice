// OTP Route
// Importing required libraries
const express = require("express");
const router = express.Router();

// Importing OTP Controller
const otpController = require("../controller/Otpcontroller");

router.post("/sendotp", otpController.sendOTP); // Send OTP Route
router.post("/validateotp", otpController.validateOTP); // Validate OTP Route

module.exports = router;
