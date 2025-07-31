// Importing required libraries
require("dotenv").config();
const JWT = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

// Importing Agent and Admin Module as Agentdetails and AdminDetails
const agentDetails = require("../models/Userdb");
const adminDetails = require("../models/Admindb");

// Importing required utils (Cookie,Password-Encrypt & Decrypt,AgentJWT,Email Service)
const { encryptPassword, decryptPassword } = require("../utils/Password");
const { cookieencrypt, cookiedecrypt, getKey } = require("../utils/Cookie");
const Jwttokengenerator = require("../utils/Jwt");
const Emailservice = require("../services/Emailservice");

// Importing cloudinary configuration
const imagecloud = require("../config/Cloudinary");

// Importing Notification Controller for sending notifications
const Notify = require("./Notificationcontroller");

exports.agentSignup = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Missing request body" });
  }
  const { payload } = req.body;
  const {
    Emailaddress,
    Name,
    Mobilenumber,
    Address,
    Password,
    Nationalid,
    Passportsizephoto,
    License,
  } = payload;

  // KYC Document Functionality
  if (Nationalid && Passportsizephoto && License) {
    try {
      // Function to extract MIME type from base64 string
      function getMimeType(base64String) {
        if (!base64String) return null;
        const match = base64String.match(/^data:(.+);base64,/);
        return match ? match[1] : null;
      }

      // Check MIME types
      const nationalIdType = getMimeType(Nationalid);
      const passportPhotoType = getMimeType(Passportsizephoto);
      const licenseType = getMimeType(License);

      // Allowed MIME types (example: images and PDFs)
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      ];
      // Check if MIME types are allowed
      if (
        !allowedTypes.includes(nationalIdType) ||
        !allowedTypes.includes(passportPhotoType) ||
        !allowedTypes.includes(licenseType)
      ) {
        return res.status(422).send("Invalid File type");
      }

      const properuserdata = Emailaddress.trim();
      const encryptedpass = await encryptPassword(Password);

      const existinguser = await agentDetails.findOne(
        { Emailaddress: properuserdata },
        { id: 1, Usertype: 1 }
      );

      if (existinguser !== null && existinguser.Usertype === "Agent") {
        return res.status(409).json({ message: "Agent Email already exists" });
      }
      if (Address === "") {
        return res.status(422).json({ message: "Address is required" });
      }
      const newuser = new agentDetails({
        Name,
        Mobilenumber,
        Address,
        Emailaddress: properuserdata,
        Password: encryptedpass,
        Usertype: "Agent",
        Currentrole: ["Agent"],
        KYC: "Not Provided",
        Status: "Active",
        Approvalstatus: "Pending",
      });

      await newuser.save();

      const userId = newuser._id.toString();

      // Storage setup for storing files in local
      const baseFolder = path.join(__dirname, "../kycdocuments/Agent");
      const userFolder = path.join(baseFolder, userId);

      if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder);
      if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder);

      const saveBase64File = (base64String, filePath) => {
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        const data = matches ? matches[2] : base64String;
        const buffer = Buffer.from(data, "base64");
        fs.writeFileSync(filePath, buffer);
      };

      const kycDocs = {};
      const docs = { Nationalid, Passportsizephoto, License };

      // Functionality to store the KYC Documents
      for (const [key, base64File] of Object.entries(docs)) {
        if (base64File) {
          const matches = base64File.match(/^data:(.+);base64,/);
          const mimeType = matches ? matches[1] : "application/octet-stream";

          const ext = mime.extension(mimeType) || "bin";

          const fileName = `${key}.${ext}`;
          const filePath = path.join(userFolder, fileName);

          // Save local
          saveBase64File(base64File, filePath);

          // Creating local file URL
          const localUrl = `${req.protocol}://${req.get(
            "host"
          )}/kycdocuments/Agent/${userId}/${fileName}`;
          const base64DataOnly = base64File.replace(/^data:.+;base64,/, "");
          const uniquePublicId = Date.now().toString();

          // Cloudinary storage setup
          const resourceType = mimeType.startsWith("image/") ? "image" : "raw";
          let publicId = uniquePublicId;
          if (resourceType === "raw") {
            const ext = mime.extension(mimeType) || "bin"; // get extension from mime
            publicId = `${uniquePublicId}.${ext}`;
          }
          const uploadResult = await imagecloud.uploader.upload(
            `data:${mimeType};base64,${base64DataOnly}`,
            {
              folder: `weefly/agents/${userId}`,
              public_id: publicId,
              overwrite: true,
              resource_type: resourceType,
            }
          );

          kycDocs[key] = {
            localUrl,
            cloudinaryUrl: uploadResult.secure_url,
            cloudinaryimageid: publicId,
          };
        }
      }
      // Storing the KYC documents in the database
      if (Object.keys(kycDocs).length > 0) {
        newuser.KYC = kycDocs;
        await newuser.save();
      }
      Emailservice.agentDocumentRecievedEmail(
        newuser.Emailaddress,
        newuser.Name
      );
      await Notify.addNotification(
        `New agent ${newuser.Name} registered with KYC Documents`, //Message
        "Verificationmodule", //Type
        "Adminpannel", //Category
        "" //Reference ID
      );
      return res.status(201).send("Agent Registered Successfully!!");
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  } else {
    try {
      const properuserdata = Emailaddress.trim();
      const existinguser = await agentDetails.findOne(
        { Emailaddress: properuserdata },
        { id: 1, Usertype: 1 }
      );

      if (existinguser !== null && existinguser.Usertype === "Agent") {
        return res.status(409).json({ message: "Agent Email already exists" });
      }
      const newuser = new agentDetails({
        Name,
        Mobilenumber,
        Emailaddress: properuserdata,
        Password: Password,
        Usertype: "Agent",
        Currentrole: ["Agent"],
        KYC: "Not Provided",
        Status: "Active",
        Approvalstatus: "Pending",
      });

      await newuser.save();
      await Notify.addNotification(
        `New agent ${newuser.Name} registered`, //Message
        "Verificationmodule", //Type
        "Adminpannel", //Category
        "" //Reference ID
      );
      return res
        .status(201)
        .json({ message: "Agent Registered Successfully!!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }
};

// Agent Sign In
exports.agentSignin = async (req, res) => {
  const { Emailaddress, Password } = req.body;
  if (Password) {
    try {
      const existinguser = await agentDetails.findOne(
        { Emailaddress: Emailaddress },
        {
          id: 1,
          Password: 1,
          Emailaddress: 1,
          Approvalstatus: 1,
          Currentrole: 1,
          Status: 1,
        }
      );
      if (!existinguser) {
        res.status(400).send("User doesn't exist");
      } else if (
        existinguser.Approvalstatus === "Approved" &&
        existinguser.Currentrole.includes("Agent") &&
        existinguser.Status === "Active"
      ) {
        const authenticatinguser = await decryptPassword(
          Password,
          existinguser.Password
        );
        if (!authenticatinguser) {
          res.status(401).send("Invalid Password");
        } else {
          const id = existinguser.Emailaddress;
          const token = await Jwttokengenerator.Agenttokengenerator(id);
          const key = await getKey();
          const encryptedtoken = cookieencrypt(token, key);
          res
            .status(200)
            .cookie("agentjwt", encryptedtoken, {
              maxAge: 60 * 60 * 1000,
              path: "/",
            })
            .send("Sign Successful!!");
        }
      } else {
        return res.status(401).send("Unauthorized");
      }
    } catch (error) {
      console.error("Error in Agent Sign in" + error);
      return res.status(500).send("Internal Server Error");
    }
  }
  // Google User Setup
  else {
    try {
      const existinguser = await agentDetails.findOne(
        { Emailaddress: Emailaddress },
        {
          id: 1,
          Emailaddress: 1,
          Approvalstatus: 1,
          Currentrole: 1,
          Status: 1,
        }
      );
      if (!existinguser) {
        res.status(400).send("User doesn't exist");
      } else if (
        existinguser.Approvalstatus === "Approved" &&
        existinguser.Currentrole.includes("Agent") &&
        existinguser.Status === "Active"
      ) {
        const id = existinguser.Emailaddress;
        const token = await Jwttokengenerator.Agenttokengenerator(id);
        const key = await getKey();
        const encryptedtoken = cookieencrypt(token, key);
        res
          .status(200)
          .cookie("agentjwt", encryptedtoken, {
            maxAge: 60 * 60 * 1000,
            path: "/",
          })
          .send("Sign Successful!!");
      } else {
        return res.status(401).send("Unauthorized");
      }
    } catch (error) {
      console.error("Error in Google Agent Sign in" + error);
      return res.status(500).send("Internal Server Error");
    }
  }
};

// Get Agents
exports.getAgents = async (req, res) => {
  try {
    const users = await agentDetails
      .find({
        Approvalstatus: "Approved",
        Status: "Active",
        Currentrole: { $in: ["Agent"] },
      })
      .sort({ _id: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in fetching User Detail: " + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Agent  Status for Approval/ReApproval
exports.updateAgentstatus = async (req, res) => {
  const { agentId, status } = req.body;
  const adminjwt = req.cookies.adminjwt;
  let user;

  try {
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;
    const decryptedJwt = await cookiedecrypt(adminjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    email = decodedPayload.id;
    user = await adminDetails.findOne({ Emailaddress: email }, { _id: 1 });
  } catch (error) {
    console.error("Encryption/Decryption error: " + error);
    return res.status(401).json({ message: "Unauthorized access" });
  }

  if (!agentId || !status) {
    return res.status(400).json({ message: "agentId and status are required" });
  }

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const agent = await agentDetails.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    if (status === "Rejected") {
      if (agent.Approvedby || agent.Approveddate) {
        agent.Approvedby = undefined;
        agent.Approveddate = undefined;
      }
      agent.Approvalstatus = status;
      agent.Rejectedby = user;
      agent.Reapprovetoken = uuidv4();
      await agent.save();

      const resubmissionLink = `${process.env.RESUBMISSION_BASE_URL}/#/resubmitkyc/${agent.Reapprovetoken}`;

      // To Send Email
      Emailservice.agentRejectedEmail(
        agent.Emailaddress,
        agent.Name,
        "Due to improper KYC Details",
        resubmissionLink
      );
    } else if (status === "Approved") {
      if (agent.Rejectedby || agent.Rejecteddate) {
        agent.Rejectedby = undefined;
        agent.Rejecteddate = undefined;
      }
      agent.Approvalstatus = status;
      agent.Approvedby = user;
      await agent.save();

      // To Send Email
      Emailservice.agentApprovedEmail(agent.Emailaddress, agent.Name);
    }

    res.status(200).json({ message: "Status updated successfully", agent });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Agent Details
exports.updateAgent = async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const payload = req.body.payload;
    const adminjwt = req.cookies.adminjwt;
    if (!adminjwt) {
      return res.status(401).send("Authentication token required");
    }

    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;

    const decryptedJwt = await cookiedecrypt(adminjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    const requestingAdminEmail = decodedPayload.id;

    const requestingAdmin = await adminDetails.findOne({
      Emailaddress: requestingAdminEmail,
    });

    if (!requestingAdmin) {
      return res.status(403).send("Unauthorized - Admin not found");
    }

    const agentToUpdate = await agentDetails.findOne({
      _id: agentId,
    });

    if (!agentToUpdate) {
      return res.status(404).send("Admin not found");
    }
    const { Name, Emailaddress, Password, Address, Mobilenumber } = payload;
    agentToUpdate.Name = Name || agentToUpdate.Name;
    agentToUpdate.Emailaddress = Emailaddress || agentToUpdate.Emailaddress;
    agentToUpdate.Mobilenumber = Mobilenumber || agentToUpdate.Mobilenumber;
    if (Password) {
      const encryptedpass = await encryptPassword(Password);
      agentToUpdate.Password = encryptedpass;
    }

    agentToUpdate.Address = Address || agentToUpdate.Address;
    agentToUpdate.Modifiedby = requestingAdmin._id;

    await agentToUpdate.save();
    res.status(200).send("Agent updated successfully");
  } catch (error) {
    console.error("Error in updating Agent" + error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send("Invalid token");
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Agent Details (Soft Deletion)
exports.agentStatus = async (req, res) => {
  try {
    const id = req.params.agentId;

    if (!req.cookies.adminjwt) {
      return res.status(401).send("Authentication required");
    }

    const adminjwt = req.cookies.adminjwt;
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;

    const decryptedJwt = await cookiedecrypt(adminjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    const email = decodedPayload.id;

    const agent = await agentDetails.findById(id);
    if (!agent) {
      return res.status(404).send("User Not Found!");
    }

    const performingAdmin = await adminDetails.findOne({ Emailaddress: email });
    if (!performingAdmin) {
      return res.status(403).send("Permission denied");
    }

    agent.Status = "Inactive";
    agent.Deletedby = performingAdmin._id;
    await agent.save();

    return res.status(200).send("User status updated successfully");
  } catch (error) {
    console.error("Error in Deleting Agent" + error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send("Invalid token");
    }
    return res.status(500).send("Internal server error");
  }
};

// Data retrival For Reapproval form
exports.getAgentById = async (req, res) => {
  const reApproveToken = req.params.reApproveToken;
  try {
    const response = await agentDetails.findOne({
      Reapprovetoken: reApproveToken,
    });
    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

exports.agentUpdateKyc = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Missing request body" });
  }

  const reApproveToken = req.params.reApproveToken;
  const { payload } = req.body;
  const { Nationalid, Passportsizephoto, License } = payload;
  if (Nationalid && Passportsizephoto && License) {
    // Helper to clear Cloudinary folder
    const clearCloudinaryFolder = async (folderPath) => {
      try {
        let nextCursor = null;
        do {
          const result = await imagecloud.api.resources({
            type: "upload",
            prefix: folderPath,
            max_results: 100,
            next_cursor: nextCursor || undefined,
          });

          const publicIds = result.resources.map((res) => res.public_id);

          if (publicIds.length > 0) {
            await imagecloud.api.delete_resources(publicIds);
          }

          nextCursor = result.next_cursor;
        } while (nextCursor);
      } catch (err) {
        console.error(`Failed to clear folder ${folderPath}:`, err.message);
      }
    };

    try {
      // Extract MIME type
      function getMimeType(base64String) {
        const match = base64String?.match(/^data:(.+);base64,/);
        return match ? match[1] : null;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      const nationalIdType = getMimeType(Nationalid);
      const passportPhotoType = getMimeType(Passportsizephoto);
      const licenseType = getMimeType(License);

      if (
        !allowedTypes.includes(nationalIdType) ||
        !allowedTypes.includes(passportPhotoType) ||
        !allowedTypes.includes(licenseType)
      ) {
        return res.status(422).send("Invalid File type");
      }

      const existinguser = await agentDetails.findOne({
        Reapprovetoken: reApproveToken,
      });
      if (!existinguser) return res.status(404).send("User not found");

      const userId = existinguser._id.toString();
      const baseFolder = path.join(__dirname, "../kycdocuments/Agent");
      const userFolder = path.join(baseFolder, userId);
      const oldFolderName = `oldKYC${userId}`;
      const oldFolderPath = path.join(baseFolder, oldFolderName);

      // Rename local folder if exists
      if (fs.existsSync(userFolder)) {
        if (fs.existsSync(oldFolderPath)) {
          fs.rmSync(oldFolderPath, { recursive: true, force: true });
        }
        fs.renameSync(userFolder, oldFolderPath);
      }

      // Step 1: Download old Cloudinary files before clearing
      const oldKYC = existinguser.KYC || {};
      const oldKYCDetails = {};
      const oldFilesToReupload = [];

      for (const [key, value] of Object.entries(oldKYC)) {
        if (value.cloudinaryimageid && value.cloudinaryUrl) {
          try {
            const response = await axios.get(value.cloudinaryUrl, {
              responseType: "arraybuffer",
            });
            const mimeType = response.headers["content-type"];
            const base64Data = Buffer.from(response.data).toString("base64");

            oldFilesToReupload.push({
              key,
              fileName: value.cloudinaryimageid,
              mimeType,
              base64Data,
              localUrl: value.localUrl,
            });
          } catch (err) {
            console.warn(
              `Failed to download ${value.cloudinaryimageid}:`,
              err.message
            );
          }
        }
      }

      // Step 2: Clear old Cloudinary folder
      await clearCloudinaryFolder(`weefly/agents/${oldFolderName}`);

      // Step 3: Re-upload old files
      for (const file of oldFilesToReupload) {
        const ext = path.extname(file.fileName).toLowerCase();
        const resourceType = [".pdf", ".doc", ".docx"].includes(ext)
          ? "raw"
          : "image";

        const newUpload = await imagecloud.uploader.upload(
          `data:${file.mimeType};base64,${file.base64Data}`,
          {
            folder: `weefly/agents/${oldFolderName}`,
            public_id: file.fileName,
            overwrite: true,
            resource_type: resourceType,
          }
        );

        oldKYCDetails[file.key] = {
          localUrl: file.localUrl.replace(userId, oldFolderName),
          cloudinaryUrl: newUpload.secure_url,
          cloudinaryimageid: file.fileName,
        };
      }

      // Step 4: Save new KYC files locally and to Cloudinary
      if (!fs.existsSync(userFolder))
        fs.mkdirSync(userFolder, { recursive: true });

      const saveBase64File = (base64String, filePath) => {
        const data = base64String.replace(/^data:(.+);base64,/, "");
        const buffer = Buffer.from(data, "base64");
        fs.writeFileSync(filePath, buffer);
      };

      await clearCloudinaryFolder(`weefly/agents/${userId}`); // Clear new KYC folder

      const kycDocs = {};
      const docs = { Nationalid, Passportsizephoto, License };

      for (const [key, base64File] of Object.entries(docs)) {
        if (base64File) {
          const mimeType = getMimeType(base64File);
          const ext = mime.extension(mimeType) || "bin";
          const fileName = `${key}.${ext}`;
          const filePath = path.join(userFolder, fileName);
          const localUrl = `${req.protocol}://${req.get(
            "host"
          )}/kycdocuments/Agent/${userId}/${fileName}`;

          saveBase64File(base64File, filePath);

          const base64DataOnly = base64File.replace(/^data:.+;base64,/, "");
          const timestamp = Date.now().toString();
          const publicId = `${timestamp}.${ext}`;

          const uploadResult = await imagecloud.uploader.upload(
            `data:${mimeType};base64,${base64DataOnly}`,
            {
              folder: `weefly/agents/${userId}`,
              public_id: publicId,
              overwrite: true,
              resource_type: "auto",
            }
          );

          kycDocs[key] = {
            localUrl,
            cloudinaryUrl: uploadResult.secure_url,
            cloudinaryimageid: publicId,
          };
        }
      }

      // Step 5: Save in DB
      if (Object.keys(kycDocs).length > 0) {
        existinguser.KYC = kycDocs;
        if (Object.keys(oldKYCDetails).length > 0) {
          existinguser.OldKYC = oldKYCDetails;
        }
        existinguser.Reapproved = "Yes";
        existinguser.Approvalstatus = "Pending";
        await existinguser.save();
      }
      if (!existinguser.Address || existinguser.Mobilenumber === "0") {
        if (payload.Address && payload.Phonenumber !=="0") {
          existinguser.Address = payload.Address;
          existinguser.Mobilenumber=payload.Phonenumber;
          await existinguser.save();
        } else {
          return res.status(422).json({ message: "Address && Phonenumber required !!" });
        }
      }
      Emailservice.agentNewDocumentRecievedEmail(
        existinguser.Emailaddress,
        existinguser.Name
      );

      await Notify.addNotification(
        `Agent ${existinguser.Name} Re-registered with Updated KYC Documents`, //Message
        "Verificationmodule", //Type
        "Adminpannel", //Category
        existinguser.id //Reference ID
      );
      return res.status(200).send("New KYC Collected!!");
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// Get Agent Details by ID for Profile
exports.getProfileDetails = async (req, res) => {
  try {
    const agentjwt = req.cookies.agentjwt;
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;
    const decryptedJwt = await cookiedecrypt(agentjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    const email = decodedPayload.id;
    const users = await agentDetails.findOne({ Emailaddress: email });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error in getting Agent Profile Details", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getUnverifiedAgents = async (req, res) => {
  try {
    const response = await agentDetails
      .find({ Usertype: "Agent" })
      .sort({ _id: -1 });
    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.checkLoggedInUser = async (req, res) => {
  const userjwt = req.cookies.userjwt;
  if (!userjwt) {
    return res.status(401).send("Unauthorized");
  }
  try {
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;
    const decryptedJwt = await cookiedecrypt(userjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    const email = decodedPayload.id;

    const user = await agentDetails.findOne({
      Emailaddress: email,
      Approvalstatus: "Approved",
      Status: "Active",
      Currentrole: { $in: ["Agent"] },
    });

    if (user) {
      const id = user.Emailaddress;
      const token = await Jwttokengenerator.Agenttokengenerator(id);
      const key = await getKey();
      const encryptedtoken = cookieencrypt(token, key);
      return res
        .status(200)
        .cookie("agentjwt", encryptedtoken, {
          maxAge: 60 * 60 * 1000,
          path: "/",
        })
        .send("Sign Successful!!");
    } else {
      return res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error("Error in fetching User Detail: " + error);
    return res.status(500).send("Internal Server Error");
  }
};

// User to agent request
exports.sendAgentRequestDetails = async (req, res) => {
  try {
    if (req.cookies.agentjwt) {
      const userjwt = req.cookies.agentjwt;
      const secretKey = getKey();
      const jwtKey = process.env.JWT_KEY;
      const decryptedJwt = await cookiedecrypt(userjwt, secretKey);
      const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
      const email = decodedPayload.id;
      const users = await agentDetails.findOne({ Emailaddress: email });
      const userId = users._id;
      const agentDetailUrl = `${process.env.ADMIN_PANEL_URL}`;
      await Notify.addNotification(
        `Agent ${users.Name} has requested to Become a user`, //Message
        "Usercrmmodule", //Type
        "Adminpannel", //Category
        userId
      );
      // To send Email
      Emailservice.agentToUserRequest(email, users.Name, agentDetailUrl);
      return res.status(200).send("Request sent successfully");
    } else {
      const { email } = req.query;
      const users = await agentDetails.findOne({ Emailaddress: email });
      const userId = users._id;
      const agentDetailUrl = `${process.env.ADMIN_PANEL_URL}`;
      await Notify.addNotification(
        `Agent ${users.Name} has requested to Become an user`, //Message
        "Usercrmmodule", //Type
        "Adminpannel", //Category
        userId
      );
      // To send Email
      Emailservice.agentToUserRequest(email, users.Name, agentDetailUrl);
      return res.status(200).send("Request sent successfully");
    }
  } catch (error) {
    console.error("Error in User to Agent Request" + error);
    return res.status(500).send("Internal server error");
  }
};