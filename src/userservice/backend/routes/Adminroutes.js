// Admin Routes
// Importing required libraries
const express = require("express");
const router = express.Router();

// Importing adminController
const adminController = require("../controller/Admincontroller");

router.post("/subadmin", adminController.adminSignup); // Register API
router.post("/adminlogin", adminController.adminSignin); // Login API
router.get("/getadmins", adminController.getAdmins); // Get Admins
router.put("/updateadminstatus/:adminId", adminController.updateAdminStatus); // Update Admin Details
router.put("/updateadmin/:adminId", adminController.updateAdmin); // Update Admin Status (Active/Inactive)
router.get("/getadminprofile", adminController.getProfileDetails); // Get Admin Profile Details

module.exports = router;
