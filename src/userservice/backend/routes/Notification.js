// Notification Routes
// Importing required libraries
const express=require("express");
const router=express.Router();

// Importing the Notification controller
const Notificationcontroller=require("../controller/Notificationcontroller");

router.get("/notification",Notificationcontroller.getNotification); //Route to get notification
router.put("/changestatus/:notificationId",Notificationcontroller.updateNotifiationStatus);
module.exports = router;