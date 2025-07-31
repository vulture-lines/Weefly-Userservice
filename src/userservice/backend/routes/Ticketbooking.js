const express = require('express');
const router = express.Router();
const userController = require('../controller/Ticketbooking');

router.get('/get-user/:id', userController.getUserById);
router.post("/update-user/:id",userController.updateUserBooking)
module.exports = router;
