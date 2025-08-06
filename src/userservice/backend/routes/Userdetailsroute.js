// User API Routes
// Importing required libraries
const express = require("express");
const router = express.Router();

// Importing User Controller
const userController = require("../controller/Usercontroller");

router.post("/userregister", userController.userSignup); //User Register API
router.post("/userlogin",userController.userSignin ); //User Login API
router.get("/getusersdetails",userController.getUsers); // Get User Details API for Booking
router.get("/getusers",userController.getUserDetail); // Get User Details API
router.put("/updateuser/:userId", userController.updateUser); //Update Admin Status
router.put("/userstatus/:userId", userController.userStatus); //Update Admin Status
router.get("/getuserprofile",userController.getUserProfileDetails);  // Get User Details API for Profile
router.get("/getuser/:userId",userController.findUserById);
// User to Agent Switching
router.post("/sendrequest",userController.sendRequestDetails); // API to send request to admin for User to Agent
router.get("/getuseragent/:email", userController.getUserAgentByEmail);
router.get("/getusertoagent/:highlightId", userController.getUserById);
router.post("/usertoagentregister",userController.userToAgentRegister );
router.post("/sendrequestouser/:userId",userController.userToAgentDetails);
router.get("/getuser/:reApproveToken", userController.getUserByToken); // Reapproval API
router.put("/updateuserkyc/:reApproveToken", userController.userToAgentUpdate); // Update KYC Details API
router.put("/updateusertoagentstatus", userController.updateuserToAgentstatus); 
router.post("/createtoken/:emailid",userController.createToken);
module.exports = router;