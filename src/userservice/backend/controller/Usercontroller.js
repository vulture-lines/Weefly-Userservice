// Importing required libraries
require("dotenv").config();
const JWT = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Importing user and admin model as userDetails and adminDetails
const userDetails = require("../models/Userdb");
const adminDetails = require("../models/Admindb");
const Notify = require("./Notificationcontroller");

// Importing required utils (Cookie,Password-Encrypt & Decrypt,User JWT and Email Service)
const { encryptPassword, decryptPassword } = require("../utils/Password");
const { cookieencrypt, cookiedecrypt, getKey } = require("../utils/Cookie");
const Jwttokengenerator = require("../utils/Jwt");
const Emailservice = require("../services/Emailservice");
const imagecloud = require("../config/Cloudinary");
const mongoose = require("mongoose");
const { Otherdetail } = require("../models/Otherdetail");
const { sendOTP } = require("./Otpcontroller");

// User Signup
exports.userSignup = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Missing request body" });
  }
  const { payload } = req.body;
  const { Password } = payload;
  const email = payload.email || payload.Emailaddress;
  const properuserdata = email.trim();
  const existinguser = await userDetails.findOne(
    { Emailaddress: properuserdata },
    { id: 1, Usertype: 1, Currentrole: 1 }
  );
  try {
    if (Password !== "Googleauth") {
      if (!existinguser) {
        if (payload.finaldata) {
          const { email, name, phone, Password, finaldata } = payload;
          const properuserdata = email.trim();
          let encryptedpass;
          encryptedpass = await encryptPassword(Password);
          const existinguser = await userDetails.findOne(
            { Emailaddress: properuserdata },
            { id: 1, Usertype: 1 }
          );
          if (
            existinguser !== null &&
            (existinguser.Usertype === "Agent" ||
              existinguser.Usertype === "User")
          ) {
            return res.status(409).json({ message: "Email already exists" });
          }
          const newuser = new userDetails({
            Name: name,
            Mobilenumber: phone,
            Emailaddress: properuserdata,
            Password: encryptedpass,
            Usertype: "User",
            Currentrole: ["User"],
            Status: "Inactive",
            ContactAddress: finaldata.travellerDetails.ContactDetails.Address,
            BillingAddress: finaldata.travellerDetails.BillingDetails.Address,
          });

          await newuser.save();
          sendOTP(properuserdata);
          return res.status(200).json({ message: "User created successfully" });
        } else {
          const { Emailaddress, Name, Mobilenumber, Password } = payload;
          const properuserdata = Emailaddress.trim();
          let encryptedpass;
          encryptedpass = await encryptPassword(Password);
          const existinguser = await userDetails.findOne(
            { Emailaddress: properuserdata },
            { id: 1, Usertype: 1 }
          );

          if (
            existinguser !== null &&
            (existinguser.Usertype === "Agent" ||
              existinguser.Usertype === "User")
          ) {
            return res.status(409).json({ message: "Email already exists" });
          }
          const newuser = new userDetails({
            Name,
            Mobilenumber,
            Emailaddress: properuserdata,
            Password: encryptedpass,
            Usertype: "User",
            Currentrole: ["User"],
            Status: "Inactive",
          });

          await newuser.save();
          sendOTP(properuserdata);
          return res.status(200).json({ message: "User created successfully" });
        }
      } else if (existinguser.Currentrole.includes("Guest")) {
        if (payload.finaldata) {
          const { email, name, phone, Password, finaldata } = payload;
          console.log(finaldata);
          const properuserdata = email.trim();
          let encryptedpass;
          encryptedpass = await encryptPassword(Password);
          const existinguser = await userDetails.findOne(
            { Emailaddress: properuserdata },
            { id: 1, Usertype: 1 }
          );
          if (
            existinguser !== null &&
            (existinguser.Usertype === "Agent" ||
              existinguser.Usertype === "User")
          ) {
            return res.status(409).json({ message: "Email already exists" });
          }

          existinguser.Name = name;
          existinguser.Mobilenumber = phone;
          existinguser.Emailaddress = properuserdata;
          existinguser.Password = encryptedpass;
          existinguser.Usertype = "User";
          existinguser.Currentrole = ["User"];
          existinguser.Status = "Inactive";
          (existinguser.ContactAddress =
            finaldata.travellerDetails.ContactDetails.Address),
            (existinguser.BillingAddress =
              finaldata.travellerDetails.BillingDetails.Address),
            existinguser.markModified("ContactAddress");
          existinguser.markModified("BillingAddress");
          await existinguser.save();

          sendOTP(properuserdata);
          return res.status(200).json({ message: "User created successfully" });
        } else {
          const { Emailaddress, Name, Mobilenumber, Password } = payload;
          const properuserdata = Emailaddress.trim();
          let encryptedpass;
          encryptedpass = await encryptPassword(Password);
          const existinguser = await userDetails.findOne(
            { Emailaddress: properuserdata },
            { id: 1, Usertype: 1 }
          );

          if (
            existinguser !== null &&
            (existinguser.Usertype === "Agent" ||
              existinguser.Usertype === "User")
          ) {
            return res.status(409).json({ message: "Email already exists" });
          }
          existinguser.Name = Name;
          existinguser.Mobilenumber = Mobilenumber;
          existinguser.Emailaddress = properuserdata;
          existinguser.Password = encryptedpass;
          existinguser.Usertype = "User";
          existinguser.Currentrole = ["User"];
          existinguser.Status = "Inactive";

          await existinguser.save();
          sendOTP(properuserdata);
          return res.status(200).json({ message: "User created successfully" });
        }
      }
    } else {
      // Google Auth
      if (
        existinguser !== null &&
        (existinguser.Usertype === "Agent" || existinguser.Usertype === "User")
      ) {
        return res.status(409).json({ message: "Email already exists" });
      }
      if (!existinguser) {
        if (payload.finaldata) {
          const { Emailaddress, Name, Mobilenumber, Password, finaldata } =
            payload;
          const properuserdata = Emailaddress.trim();
          const existinguser = await userDetails.findOne(
            { Emailaddress: properuserdata },
            { id: 1, Usertype: 1 }
          );
          if (
            existinguser !== null &&
            (existinguser.Usertype === "Agent" ||
              existinguser.Usertype === "User")
          ) {
            return res.status(409).json({ message: "Email already exists" });
          }
          const newuser = new userDetails({
            Name,
            Mobilenumber,
            Emailaddress,
            Password,
            Usertype: "User",
            Currentrole: ["User"],
            Status: "Active",
            ContactAddress: finaldata.travellerDetails.ContactDetails.Address,
            BillingAddress: finaldata.travellerDetails.BillingDetails.Address,
          });

          await newuser.save();
          const id = newuser.Emailaddress;
          const userId = newuser.id;
          const token = await Jwttokengenerator.Usertokengenerator(id, userId);
          const key = await getKey();
          const encryptedtoken = cookieencrypt(token, key);
          return res
            .status(201)
            .cookie("userjwt", encryptedtoken, {
              maxAge: 60 * 60 * 1000,
              path: "/",
            })
            .send("Signup Successful!!");
        } else {
          const { Emailaddress, Name, Mobilenumber, Password } = payload;
          const properuserdata = Emailaddress.trim();
          const existinguser = await userDetails.findOne(
            { Emailaddress: properuserdata },
            { id: 1, Usertype: 1 }
          );

          if (
            existinguser !== null &&
            (existinguser.Usertype === "Agent" ||
              existinguser.Usertype === "User")
          ) {
            return res.status(409).json({ message: "Email already exists" });
          }
          const newuser = new userDetails({
            Name,
            Mobilenumber,
            Emailaddress: properuserdata,
            Password: Password,
            Usertype: "User",
            Currentrole: ["User"],
            Status: "Active",
          });

          await newuser.save();
          const id = newuser.Emailaddress;
          const userId = newuser.id;
          const token = await Jwttokengenerator.Usertokengenerator(id, userId);
          const key = await getKey();
          const encryptedtoken = cookieencrypt(token, key);
          return res
            .status(201)
            .cookie("userjwt", encryptedtoken, {
              maxAge: 60 * 60 * 1000,
              path: "/",
            })
            .send("Signup Successful!!");
        }
      } else if (existinguser.Currentrole.includes("Guest")) {
        if (payload.finaldata) {
          const { Emailaddress, Name, Mobilenumber, Password, finaldata } =
            payload;
          console.log(finaldata);
          const properuserdata = Emailaddress.trim();
          const existinguser = await userDetails.findOne(
            { Emailaddress: properuserdata },
            { id: 1, Usertype: 1 }
          );
          if (
            existinguser !== null &&
            (existinguser.Usertype === "Agent" ||
              existinguser.Usertype === "User")
          ) {
            return res.status(409).json({ message: "Email already exists" });
          }

          existinguser.Name = Name;
          existinguser.Mobilenumber = Mobilenumber;
          existinguser.Emailaddress = properuserdata;
          existinguser.Password = Password;
          existinguser.Usertype = "User";
          existinguser.Currentrole = ["User"];
          existinguser.Status = "Active";
          (existinguser.ContactAddress =
            finaldata.travellerDetails.ContactDetails.Address),
            (existinguser.BillingAddress =
              finaldata.travellerDetails.BillingDetails.Address),
            existinguser.markModified("ContactAddress");
          existinguser.markModified("BillingAddress");
          await existinguser.save();
          const id = existinguser.Emailaddress;
          const userId = existinguser.id;
          const token = await Jwttokengenerator.Usertokengenerator(id, userId);
          const key = await getKey();
          const encryptedtoken = cookieencrypt(token, key);
          return res
            .status(201)
            .cookie("userjwt", encryptedtoken, {
              maxAge: 60 * 60 * 1000,
              path: "/",
            })
            .send("Signup Successful!!");
        } else {
          const { Emailaddress, Name, Mobilenumber, Password } = payload;
          const properuserdata = Emailaddress.trim();
          const existinguser = await userDetails.findOne(
            { Emailaddress: properuserdata },
            { id: 1, Usertype: 1 }
          );

          if (
            existinguser !== null &&
            (existinguser.Usertype === "Agent" ||
              existinguser.Usertype === "User")
          ) {
            return res.status(409).json({ message: "Email already exists" });
          }
          existinguser.Name = Name;
          existinguser.Mobilenumber = Mobilenumber;
          existinguser.Emailaddress = properuserdata;
          existinguser.Password = Password;
          existinguser.Usertype = "User";
          existinguser.Currentrole = ["User"];
          existinguser.Status = "Active";

          await existinguser.save();
          const id = existinguser.Emailaddress;
          const userId = existinguser.id;
          const token = await Jwttokengenerator.Usertokengenerator(id, userId);
          const key = await getKey();
          const encryptedtoken = cookieencrypt(token, key);
          return res
            .status(201)
            .cookie("userjwt", encryptedtoken, {
              maxAge: 60 * 60 * 1000,
              path: "/",
            })
            .send("Signup Successful!!");
        }
      }
    }
  } catch (error) {
    console.error("Error in User Signup" + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify Email
exports.verifyUserEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const secretKey = getKey();
    const decryptedToken = cookiedecrypt(token, secretKey);
    const decoded = JWT.verify(decryptedToken, process.env.VERIFICATION_KEY);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    const user = await userDetails.findById(decoded.userId);
    if (!user) return res.status(400).send("User not found");
    if (user) {
      user.Status = "Active";
      await user.save();
      const id = user.Emailaddress;
      const userId = user.id;
      const token = await Jwttokengenerator.Usertokengenerator(id, userId);
      const key = await getKey();
      const encryptedtoken = cookieencrypt(token, key);
      const profileUrl = process.env.PROFILE_URL;
      const otherDetail = await Otherdetail.findOne(
        { sessionId: userId },
        { otherDetails: 1 }
      ).sort({ _id: -1 });
      if (otherDetail) {
        const seatpage = process.env.SEAT_MAP_URL;
        res
          .status(200)
          .cookie("userjwt", encryptedtoken, {
            maxAge: 60 * 60 * 1000,
            path: "/",
          })
          .redirect(seatpage);
      } else {
        res
          .status(200)
          .cookie("userjwt", encryptedtoken, {
            maxAge: 60 * 60 * 1000,
            path: "/",
          })
          .redirect(profileUrl);
      }
    }
  } catch (err) {
    console.log(err);

    res.status(400).send("Invalid or expired token");
  }
};

// User Sign In
exports.userSignin = async (req, res) => {
  const { Emailaddress, Password } = req.body;
  try {
    if (Emailaddress && Password) {
      const existinguser = await userDetails.findOne(
        { Emailaddress: Emailaddress },
        { id: 1, Password: 1, Emailaddress: 1, Currentrole: 1, Status: 1 }
      );
      if (
        !existinguser ||
        existinguser.Status === "Inactive" ||
        existinguser.Currentrole.includes("Guest")
      ) {
        res.status(400).send("User doesn't exist");
      } else {
        if (
          Password === "Googleauth" &&
          existinguser.Currentrole.includes("User") &&
          existinguser.Status === "Active"
        ) {
          const id = existinguser.Emailaddress;
          const userId = existinguser.id;
          const token = await Jwttokengenerator.Usertokengenerator(id, userId);
          const key = await getKey();
          const encryptedtoken = cookieencrypt(token, key);
          return res
            .status(200)
            .cookie("userjwt", encryptedtoken, {
              maxAge: 60 * 60 * 1000,
              path: "/",
            })
            .send("Sign Successful!!");
        }
        const authenticatinguser = await decryptPassword(
          Password,
          existinguser.Password
        );
        if (!authenticatinguser) {
          res.status(401).send("Invalid Password");
        } else if (
          existinguser.Currentrole.includes("User") &&
          existinguser.Status === "Active"
        ) {
          const id = existinguser.Emailaddress;
          const userId = existinguser.id;
          const token = await Jwttokengenerator.Usertokengenerator(id, userId);
          const key = await getKey();
          const encryptedtoken = cookieencrypt(token, key);
          res
            .status(200)
            .cookie("userjwt", encryptedtoken, {
              maxAge: 60 * 60 * 1000,
              path: "/",
            })
            .send("Sign Successful!!");
        } else {
          return res.status(401).send("Unauthorized");
        }
      }
    } else {
      const existinguser = await userDetails.findOne(
        { Emailaddress: Emailaddress },
        { id: 1, Emailaddress: 1, Currentrole: 1, Status: 1 }
      );
      if (!existinguser) {
        res.status(400).send("User doesn't exist");
      }
      // Google Setup
      else {
        if (
          existinguser.Currentrole.includes("User") &&
          existinguser.Status === "Active"
        ) {
          const id = existinguser.Emailaddress;
          const token = await Jwttokengenerator.Usertokengenerator(id);
          const key = await getKey();
          const encryptedtoken = cookieencrypt(token, key);
          res
            .status(200)
            .cookie("userjwt", encryptedtoken, {
              maxAge: 60 * 60 * 1000,
              path: "/",
            })
            .send("Sign Successful!!");
        } else {
          return res.status(401).send("Unauthorized");
        }
      }
    }
  } catch (error) {
    console.error("Error in User sign in" + error);
    return res.status(500).send("Internal Server Error");
  }
};

// Get User Details for booking
exports.getUsers = async (req, res) => {
  const jwt = req.cookies.userjwt;
  let email = "";
  try {
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;
    const decryptedJwt = await cookiedecrypt(jwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    email = decodedPayload.id;
  } catch (error) {
    return console.error("Encryption/Decryption error" + error);
  }
  try {
    const users = await userDetails.findOne(
      { Emailaddress: email },
      { Name: 1, Mobilenumber: 1, Emailaddress: 1 }
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in fetching User Detail for booking" + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get User Details
exports.getUserDetail = async (req, res) => {
  try {
    const users = await userDetails
      .find({ Usertype: "User" })
      .sort({ _id: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in fetching User Detail" + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update User Details
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
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
    const userToUpdate = await userDetails.findOne({
      _id: userId,
    });

    if (!userToUpdate) {
      return res.status(404).send("Admin not found");
    }
    const { Name, Emailaddress, Password, Mobilenumber } = payload;
    userToUpdate.Name = Name || userToUpdate.Name;
    userToUpdate.Emailaddress = Emailaddress || userToUpdate.Emailaddress;

    if (Password) {
      const encryptedpass = await encryptPassword(Password);
      userToUpdate.Password = encryptedpass;
    }
    userToUpdate.Mobilenumber = Mobilenumber || userToUpdate.Mobilenumber;
    // userToUpdate.Address = Address || userToUpdate.Address;
    userToUpdate.Modifiedby = requestingAdmin._id;

    await userToUpdate.save();
    res.status(200).send("User updated successfully");
  } catch (error) {
    console.error("Error in updating user" + error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send("Invalid token");
    }
    return res.status(500).send("Internal Server Error");
  }
};

//To delete User (Soft Deletion)
exports.userStatus = async (req, res) => {
  try {
    const id = req.params.userId;

    if (!req.cookies.adminjwt) {
      return res.status(401).send("Authentication required");
    }

    const adminjwt = req.cookies.adminjwt;
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;

    const decryptedJwt = await cookiedecrypt(adminjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    const email = decodedPayload.id;

    const user = await userDetails.findById(id);
    if (!user) {
      return res.status(404).send("User Not Found!");
    }

    const performingAdmin = await adminDetails.findOne({ Emailaddress: email });
    if (!performingAdmin) {
      return res.status(403).send("Permission denied");
    }

    user.Status = "Inactive";
    user.Deletedby = performingAdmin._id;
    await user.save();

    return res.status(200).send("User status updated successfully");
  } catch (error) {
    console.error("Error in Deleting users" + error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send("Invalid token");
    }
    return res.status(500).send("Internal server error");
  }
};

// User to agent request
exports.sendRequestDetails = async (req, res) => {
  try {
    if (req.cookies.userjwt) {
      const userjwt = req.cookies.userjwt;
      const secretKey = getKey();
      const jwtKey = process.env.JWT_KEY;
      const decryptedJwt = await cookiedecrypt(userjwt, secretKey);
      const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
      const email = decodedPayload.id;
      const users = await userDetails.findOne({ Emailaddress: email });
      const userId = users._id;
      const userDetailUrl = `${process.env.ADMIN_PANEL_URL}`;
      await Notify.addNotification(
        `User ${users.Name} has requested to Become an agent`, //Message
        "Agentcrmmodule", //Type
        "Adminpannel", //Category
        userId
      );
      // To send Email
      Emailservice.userToAgentRequest(email, users.Name, userDetailUrl);
      return res.status(200).send("Request sent successfully");
    } else {
      const { email } = req.query;
      const users = await userDetails.findOne({ Emailaddress: email });
      const userId = users._id;
      const userDetailUrl = `${process.env.ADMIN_PANEL_URL}`;
      await Notify.addNotification(
        `User ${users.Name} has requested to Become an agent`, //Message
        "Agentcrmmodule", //Type
        "Adminpannel", //Category
        userId
      );
      // To send Email
      Emailservice.userToAgentRequest(email, users.Name, userDetailUrl);
      return res.status(200).send("Request sent successfully");
    }
  } catch (error) {
    console.error("Error in User to Agent Request" + error);
    return res.status(500).send("Internal server error");
  }
};

// Get User Details by ID for Profile
exports.getUserProfileDetails = async (req, res) => {
  try {
    if (req.cookies.userjwt) {
      const userjwt = req.cookies.userjwt;
      const secretKey = getKey();
      const jwtKey = process.env.JWT_KEY;
      const decryptedJwt = await cookiedecrypt(userjwt, secretKey);
      const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
      const email = decodedPayload.id;
      const users = await userDetails.findOne({ Emailaddress: email });
      const otherDetail = await Otherdetail.findOne(
        { sessionId: users.id },
        { otherDetails: 1 }
      ).sort({ _id: -1 });
      if (otherDetail) {
        return res
          .status(200)
          .json({ userdetail: users, otherDetails: otherDetail });
      }
      res.status(200).json(users);
    } else {
      const { email } = req.query;
      const users = await userDetails.findOne({ Emailaddress: email });
      res.status(200).json(users);
    }
  } catch (error) {
    console.error("Error in Getting User Profile Details" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get User By ID
exports.getUserById = async (req, res) => {
  try {
    let userid = req.params.highlightId;
    const user = await userDetails.findById(userid);
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in Getting User Details by ID" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.userToAgentDetails = async (req, res) => {
  try {
    const userid = req.params.userId;
    console.log(userid);
    const { status, Rejectedreason } = req.body;
    const user = await userDetails.findById(userid);
    if (status === "Rejected") {
      if (user?.Approvedby || user?.Approveddate) {
        user.Approvedby = undefined;
        user.Approveddate = undefined;
      }
      user.Approvalstatus = status;
      user.Rejectedby = user;
      user.Reapprovetoken = uuidv4();
      await user.save();

      const resubmissionLink = `${process.env.RESUBMISSION_USER_BASE_URL}/submitdetails/${user.Reapprovetoken}`;

      // To Send Email
      Emailservice.userRejectedEmail(
        user.Emailaddress,
        user.Name,
        Rejectedreason,
        resubmissionLink
      );
      await Notify.addNotification(
        "Your user-to-agent request couldn't be approved. Please resubmit it using the link sent to your registered email address",
        "Email",
        "Userpannel",
        userid
      );
      return res.sendStatus(200);
    }
  } catch (error) {
    console.error("Error in User To Agent Details" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserAgentByEmail = async (req, res) => {
  const agentEmail = req.params.email;
  try {
    const response = await userDetails.findOne({
      Emailaddress: agentEmail,
    });
    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

exports.userToAgentRegister = async (req, res) => {
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

      // Allowed MIME types
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

      const userToAgent = await userDetails.findOne(
        { Emailaddress: properuserdata },
        { id: 1, Usertype: 1 }
      );

      if (userToAgent.Usertype === "Agent") {
        return res.status(409).json({ message: "Agent Email already exists" });
      }
      if (Address === "") {
        return res.status(422).json({ message: "Address is required" });
      }
      userToAgent.Name = Name || userToAgent.Name;
      userToAgent.Emailaddress = Emailaddress || userToAgent.Emailaddress;

      if (Password) {
        const encryptedpass = await encryptPassword(Password);
        userToAgent.Password = encryptedpass;
      }
      userToAgent.Mobilenumber = Mobilenumber || userToAgent.Mobilenumber;
      userToAgent.Address = Address || userToAgent.Address;
      userToAgent.Currentrole = ["User", "Agent"];
      await userToAgent.save();

      const userId = userToAgent._id.toString();

      // Storage setup for storing files in local or Server
      const baseFolder = path.join(__dirname, "../kycdocuments/Useragent");
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

      // Functionality to store the KYC Documents in Cloudinary and Server
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
          )}/kycdocuments/Useragent/${userId}/${fileName}`;
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
              folder: `weefly/useragent/${userId}`,
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

      // Storing the KYC documents in the database as URL
      if (Object.keys(kycDocs).length > 0) {
        userToAgent.Approvedby = requestingAdmin._id;
        userToAgent.Approvalstatus = "Approved";
        userToAgent.KYC = kycDocs;
        await userToAgent.save();
      }

      // // To send Email
      Emailservice.agentApprovedEmail(
        userToAgent.Emailaddress,
        userToAgent.Name
      );
      await Notify.addNotification(
        "Welcome to our Weefly family! Your KYC documents have been verified successfully and you can now access our agent panel !!",
        "Agentpannel",
        "Userpannel",
        userToAgent.id
      );

      return res.status(201).send("User to Agent Registered Successfully!!");
    } catch (error) {
      console.error("Error in Agent Registration" + error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    return res.status(422).json({ message: "Files required" });
  }
};

// Data retrival For Reapproval form
exports.getUserByToken = async (req, res) => {
  const reApproveToken = req.params.reApproveToken;
  try {
    const response = await userDetails.findOne({
      Reapprovetoken: reApproveToken,
    });
    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

exports.userToAgentUpdate = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Missing request body" });
  }

  const reApproveToken = req.params.reApproveToken;
  const { payload } = req.body;
  const { Nationalid, Passportsizephoto, License, Address } = payload;

  if (!Nationalid || !Passportsizephoto || !License) {
    return res.status(422).json({ message: "All KYC files are required" });
  }

  const getMimeType = (base64String) => {
    const match = base64String?.match(/^data:(.+);base64,/);
    return match ? match[1] : null;
  };

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
    (!allowedTypes.includes(licenseType) && Address)
  ) {
    return res.status(422).send("Invalid File type");
  }

  try {
    const existinguser = await userDetails.findOne({
      Reapprovetoken: reApproveToken,
    });

    if (!existinguser) return res.status(404).send("User not found");

    const userId = existinguser._id.toString();
    const baseFolder = path.join(__dirname, "../kycdocuments/Useragent");
    const userFolder = path.join(baseFolder, userId);

    const saveBase64File = (base64String, filePath) => {
      const data = base64String.replace(/^data:(.+);base64,/, "");
      const buffer = Buffer.from(data, "base64");
      fs.writeFileSync(filePath, buffer);
    };

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
        return res.status(500).json({ message: "Internal Server Error" });
      }
    };

    // ------------------- KYC UPDATE BRANCH -------------------
    if (existinguser.KYC) {
      const oldFolderName = `oldKYC${userId}`;
      const oldFolderPath = path.join(baseFolder, oldFolderName);

      // Backup local folder
      if (fs.existsSync(userFolder)) {
        if (fs.existsSync(oldFolderPath)) {
          fs.rmSync(oldFolderPath, { recursive: true, force: true });
        }
        fs.renameSync(userFolder, oldFolderPath);
      }

      // Backup old KYC files from Cloudinary
      const oldKYC = existinguser.KYC || {};
      const oldFilesToReupload = [];

      for (const [key, value] of Object.entries(oldKYC)) {
        if (value.cloudinaryimageid && value.cloudinaryUrl) {
          try {
            const response = await axios.get(value.cloudinaryUrl, {
              responseType: "arraybuffer",
            });

            oldFilesToReupload.push({
              key,
              fileName: value.cloudinaryimageid,
              mimeType: response.headers["content-type"],
              base64Data: Buffer.from(response.data).toString("base64"),
              localUrl: value.localUrl,
            });
          } catch (err) {
            console.warn(`Download failed: ${value.cloudinaryimageid}`);
          }
        }
      }

      await clearCloudinaryFolder(`weefly/useragent/${oldFolderName}`);

      const oldKYCDetails = {};

      for (const file of oldFilesToReupload) {
        const ext = path.extname(file.fileName).toLowerCase();
        const resourceType = [".pdf", ".doc", ".docx"].includes(ext)
          ? "raw"
          : "image";

        const newUpload = await imagecloud.uploader.upload(
          `data:${file.mimeType};base64,${file.base64Data}`,
          {
            folder: `weefly/useragent/${oldFolderName}`,
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

      await clearCloudinaryFolder(`weefly/useragent/${userId}`);
      if (!fs.existsSync(userFolder))
        fs.mkdirSync(userFolder, { recursive: true });

      const kycDocs = {};
      const docs = { Nationalid, Passportsizephoto, License };

      for (const [key, base64File] of Object.entries(docs)) {
        const mimeType = getMimeType(base64File);
        const ext = mime.extension(mimeType) || "bin";
        const fileName = `${key}.${ext}`;
        const filePath = path.join(userFolder, fileName);

        saveBase64File(base64File, filePath);

        const localUrl = `${req.protocol}://${req.get(
          "host"
        )}/kycdocuments/Useragent/${userId}/${fileName}`;
        const publicId = `${Date.now().toString()}.${ext}`;

        const uploadResult = await imagecloud.uploader.upload(
          `data:${mimeType};base64,${base64File.replace(
            /^data:.+;base64,/,
            ""
          )}`,
          {
            folder: `weefly/useragent/${userId}`,
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

      existinguser.KYC = kycDocs;
      existinguser.OldKYC = oldKYCDetails;
      existinguser.Reapproved = "Yes";
      existinguser.Approvalstatus = "Pending";
      await existinguser.save();

      Emailservice.agentNewDocumentRecievedEmail(
        existinguser.Emailaddress,
        existinguser.Name
      );
      await Notify.addNotification(
        `User Agent ${existinguser.Name} Re-registered with Updated KYC Documents`,
        "agentcrmmodule",
        "Adminpannel",
        existinguser.id
      );

      await Notify.addNotification(
        "We have received your updated KYC documents and they are currently under review. Once the verification process is complete, our team will get back to you shortly.",
        "Email",
        "Userpannel",
        existinguser.id
      );

      return res.status(200).send("KYC Updated Successfully!!");

      // ------------------- FRESH KYC REGISTRATION BRANCH ------------------- //
    } else {
      if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder);
      if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder);

      const kycDocs = {};
      const docs = { Nationalid, Passportsizephoto, License };

      for (const [key, base64File] of Object.entries(docs)) {
        const mimeType = getMimeType(base64File);
        const ext = mime.extension(mimeType) || "bin";
        const fileName = `${key}.${ext}`;
        const filePath = path.join(userFolder, fileName);

        saveBase64File(base64File, filePath);

        const localUrl = `${req.protocol}://${req.get(
          "host"
        )}/kycdocuments/Useragent/${userId}/${fileName}`;
        const publicId = `${Date.now().toString()}.${ext}`;

        const uploadResult = await imagecloud.uploader.upload(
          `data:${mimeType};base64,${base64File.replace(
            /^data:.+;base64,/,
            ""
          )}`,
          {
            folder: `weefly/useragent/${userId}`,
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

      existinguser.KYC = kycDocs;
      existinguser.Approvalstatus = "Pending";
      existinguser.Reapproved = "Yes";
      existinguser.Address = Address;
      await existinguser.save();
      Emailservice.agentNewDocumentRecievedEmail(
        existinguser.Emailaddress,
        existinguser.Name
      );
      await Notify.addNotification(
        `User Agent ${existinguser.Name} Registered with KYC Documents and his details`,
        "Agentcrmmodule",
        "Adminpannel",
        existinguser.id
      );
      await Notify.addNotification(
        "We have received your updated KYC documents and they are currently under review. Once the verification process is complete, our team will get back to you shortly.",
        "Email",
        "Userpannel",
        existinguser.id
      );
      return res.status(201).send("KYC Registered Successfully!");
    }
  } catch (error) {
    console.error("KYC processing error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Agent  Status for Approval/ReApproval
exports.updateuserToAgentstatus = async (req, res) => {
  const { userId, status } = req.body;
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

  if (!userId || !status) {
    return res.status(400).json({ message: "userId and status are required" });
  }

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const userdetail = await userDetails.findById(userId);
    if (!userdetail) {
      return res.status(404).json({ message: "User not found" });
    }

    if (status === "Approved") {
      if (userdetail.Rejectedby || userdetail.Rejecteddate) {
        userdetail.Rejectedby = undefined;
        userdetail.Rejecteddate = undefined;
      }
      userdetail.Approvalstatus = status;
      userdetail.Approvedby = user;
      userdetail.Currentrole = ["User", "Agent"];
      await userdetail.save();

      // To Send Email
      Emailservice.agentApprovedEmail(userdetail.Emailaddress, userdetail.Name);
      await Notify.addNotification(
        "Welcome to our Weefly family! Your KYC documents have been verified successfully and you can now access our agent panel !!",
        "Agentpannel",
        "Userpannel",
        userdetail.id
      );
    }

    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createToken = async (req, res) => {
  const Emailaddress = req.params.emailid;
  try {
    const existinguser = await userDetails.findOne(
      { Emailaddress: Emailaddress },
      { id: 1, Password: 1, Emailaddress: 1, Currentrole: 1, Status: 1 }
    );
    if (!existinguser) {
      res.status(400).send("User doesn't exist");
    } else {
      const id = existinguser.Emailaddress;
      const token = await Jwttokengenerator.Usertokengenerator(id);
      const key = await getKey();
      const encryptedtoken = cookieencrypt(token, key);
      res
        .status(200)
        .cookie("userjwt", encryptedtoken, {
          maxAge: 60 * 60 * 1000,
          path: "/",
        })
        .send("Sign Successful!!");
    }
  } catch (error) {
    console.error("Error in User sign in" + error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.findUserById = async (req, res) => {
  const id = req.params.userId;
  try {
    const user = await userDetails.findById(id);
    if (user) {
      return res.status(200).json({ userdetail: user });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.profileUpdate = async (req, res) => {
  const { payload } = req.body;
  const userjwt = req.cookies.userjwt;
  if (!payload) {
    return res.status(422).json({ message: "Invalid request" });
  }
  function formatDateToLocalMinute(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  try {
    const { Emailaddress, Name, Phonenumber, Contactdetails, photoUrl } =
      payload;
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;
    const decryptedJwt = await cookiedecrypt(userjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    id = decodedPayload.userId;
    const user = await userDetails.findById(id);
    let updated;
    if (Emailaddress) {
      user.Emailaddress = Emailaddress;
      updated = true;
    }
    if (Name) {
      user.Name = Name;
      updated = true;
    }
    if (Phonenumber) {
      user.Phonenumber = Phonenumber;
      updated = true;
    }
    if (Contactdetails) {
      user.ContactAddress = Contactdetails;
      await user.markModified("ContactAddress");
      updated = true;
    }
    if (photoUrl) {
      user.Profileimage = photoUrl;
      updated = true;
    }
    if (photoUrl && Name) {
      const timestamp = Date.now();
      const safeName = Name.replace(/\s+/g, "_");

      // Match base64 string with allowed image types only
      const base64Pattern = /^data:image\/(jpeg|png|jpg|gif|webp);base64,/i;
      const match = photoUrl.match(base64Pattern);

      if (!match) {
        return res.status(422).json({
          message:
            "Only valid image formats (jpeg, png, jpg, gif, webp) are allowed",
        });
      }

      const imageType = match[1].toLowerCase(); // "jpeg", "png", etc.
      const filename = `${timestamp}_${safeName}.${imageType}`;
      const folderPath = path.join(__dirname, "../userprofileimage");
      const filePath = path.join(folderPath, filename);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const base64Data = photoUrl.replace(base64Pattern, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Save image locally
      fs.writeFileSync(filePath, imageBuffer);

      // Upload to Cloudinary
      const uploadResponse = await imagecloud.uploader.upload(photoUrl, {
        folder: "userprofileimage",
        public_id: `${timestamp}_${safeName}`,
        overwrite: true,
        resource_type: "image",
      });

      // Save Cloudinary URL
      user.Profileimage = uploadResponse.secure_url;
      updated = true;
    }

    if (updated) {
      const now = formatDateToLocalMinute(new Date());
      user.Profileupdatedon = now;
      await user.save();
      return res.status(200).send("User updated");
    }
  } catch (error) {
    console.log(error);
  }
};
