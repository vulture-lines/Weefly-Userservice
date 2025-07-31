// Agent Routes
// Importing required libraries
const express = require("express");
const router = express.Router();

// Importing agent controller
const agentController = require("../controller/Agentcontroller");

router.post("/agentregister", agentController.agentSignup); // Register API
router.post("/agentlogin", agentController.agentSignin); // Login API
router.get("/getagents", agentController.getAgents); // Get Agents
router.get("/getunverifiedagents", agentController.getUnverifiedAgents); // Get Agents
router.put("/updateagentstatus", agentController.updateAgentstatus); // Update Agent Status (Approved/Rejected)
router.put("/updateagent/:agentId", agentController.updateAgent); // Update Agent Details
router.put("/agentstatus/:agentId", agentController.agentStatus); // Update Agent Status (Active/Inactive)
router.get("/getagent/:reApproveToken", agentController.getAgentById); // Reapproval API
router.put("/updateagentkyc/:reApproveToken", agentController.agentUpdateKyc); // Update KYC Details API
router.get("/getagentprofile", agentController.getProfileDetails); // Get Agent Profile Details
router.get("/checkuserlogin",agentController.checkLoggedInUser);

// Agent to user switch
router.post("/senduserrequest",agentController.sendAgentRequestDetails); // API to send request to admin for User to Agent

module.exports = router;
