const express = require("express");
const router = express.Router();
const guestController = require("../controller/Guestcontroller");

// Public route - no authentication needed
router.post("/guestregister", guestController.registerGuest);
// router.get("/getguestdetails", entityController.getAll);

// // Get entity by ID
// router.get("/getguest/:id", entityController.getById);

// // Update entity by ID
// router.put("/updateguest/:id", entityController.updateById);

// // Delete (soft delete) entity by ID
// router.delete("/deleteguest/:id", entityController.deleteById);

module.exports = router;
