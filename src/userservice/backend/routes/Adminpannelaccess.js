// Pannel Access Routes
// Importing required libraries
const express=require("express");
const router=express.Router();

// Importing Admin Pannel Access Controller
const pannelController=require("../controller/Pannelcontroller")

// Defining routes for Admin Pannel Access
router.post("/pannelaccess",pannelController.checkPannelAccess);

module.exports=router