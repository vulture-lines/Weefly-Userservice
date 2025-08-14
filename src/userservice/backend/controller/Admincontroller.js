// Importing required Libraries
require("dotenv").config();
const JWT = require("jsonwebtoken");

// Importing Admin Model as Admin Details
const adminDetails = require("../models/Admindb");

// Importing required utils (Cookie,Password-Encrypt & Decrypt and JWT)
const { encryptPassword, decryptPassword } = require("../utils/Password");
const { cookieencrypt, cookiedecrypt, getKey } = require("../utils/Cookie");
const Jwttokengenerator = require("../utils/Jwt");
const isProduction = process.env.NODE_ENV === "production";
// Admin Sign-In
exports.adminSignin = async (req, res) => {
  const { Emailaddress, Password } = req.body;
  try {
    const existinguser = await adminDetails.findOne(
      { Emailaddress: Emailaddress },
      { id: 1, Password: 1, Emailaddress: 1, Access: 1, Status: 1 }
    );
    if (!existinguser || existinguser.Status === "Inactive") {
      return res.status(401).send("User Doesn't Exisit!!");
    } else {
      const authenticatinguser = await decryptPassword(
        Password,
        existinguser.Password
      );
      if (!authenticatinguser) {
        res.status(401).send("Invalid Password");
      } else {
        const id = existinguser.Emailaddress;
        const Access = existinguser.Access;
        const token = await Jwttokengenerator.Admintokengenerator(id, Access);
        const key = await getKey();
        const encryptedtoken = cookieencrypt(token, key);
        res
          .status(200)
          .cookie("adminjwt", encryptedtoken, {
            maxAge: 60 * 60 * 1000,
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "None",
            domain: isProduction ? ".weefly.africa" : undefined,
          })
          .send("Sign Successful!!");
      }
    }
  } catch (error) {
    console.error("Error in Admin Sign In" + error);
    return res.status(500).send("Internal Server Error");
  }
};

// Admin Sign-up
exports.adminSignup = async (req, res) => {
  try {
    const payload = req.body.payload;
    const emailid = req.cookies.adminjwt;
    if (!emailid) {
      return res.status(401).send("Token Required");
    }
    const adminjwt = req.cookies.adminjwt;
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;

    const decryptedJwt = await cookiedecrypt(adminjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    const email = decodedPayload.id;
    const { Name, Emailaddress, Password, Access } = payload;
    properuserdata = Emailaddress.trim();
    const creatingadmin = await adminDetails.findOne(
      {
        Emailaddress: email,
      },
      { id: 1 }
    );
    const encryptedpass = await encryptPassword(Password);
    const existinguser = await adminDetails.findOne(
      {
        Emailaddress: properuserdata,
      },
      { id: 1, Usertype: 1 }
    );
    if (existinguser !== null) {
      return res.status(409).json({ message: "Admin Email already exists" });
    } else {
      const newuser = new adminDetails({
        Name,
        Emailaddress,
        Password: encryptedpass,
        Status: "Active",
        Access,
        Createdby: creatingadmin,
      });
      await newuser.save();
      res.status(201).send("Admin Created Successfully!!");
    }
  } catch (error) {
    console.error("Error in creating Sub Admins" + error);
    return res.status(500).send("Internal Server Error");
  }
};

// Get Admin Details
exports.getAdmins = async (req, res) => {
  try {
    const users = await adminDetails.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in fetching User Detail" + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Admin Details by ID for Profile
exports.getProfileDetails = async (req, res) => {
  try {
    const adminjwt = req.cookies.adminjwt;
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;
    const decryptedJwt = await cookiedecrypt(adminjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    const email = decodedPayload.id;
    const users = await adminDetails.findOne({ Emailaddress: email });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in fetching User Detail by ID" + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Admin Details
exports.updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.adminId;
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
    const adminToUpdate = await adminDetails.findOne({
      _id: adminId,
    });

    if (!adminToUpdate) {
      return res.status(404).send("Admin not found");
    }
    const { Name, Emailaddress, Password, Access } = payload;
    adminToUpdate.Name = Name || adminToUpdate.Name;
    adminToUpdate.Emailaddress = Emailaddress || adminToUpdate.Emailaddress;
    if (Password) {
      const encryptedpass = await encryptPassword(Password);
      adminToUpdate.Password = encryptedpass;
    }
    adminToUpdate.Access = Access || adminToUpdate.Access;
    adminToUpdate.Modifiedby = requestingAdmin._id;
    await adminToUpdate.save();
    res.status(200).send("Admin updated successfully");
  } catch (error) {
    console.error("Error in updating Admin Details" + error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send("Invalid token");
    }
    return res.status(500).send("Internal Server Error");
  }
};

// Delete Admin Details (Soft Deletion)
exports.updateAdminStatus = async (req, res) => {
  try {
    const id = req.params.adminId;
    if (!req.cookies.adminjwt) {
      return res.status(401).send("Authentication required");
    }
    const adminjwt = req.cookies.adminjwt;
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;
    const decryptedJwt = await cookiedecrypt(adminjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    const email = decodedPayload.id;
    const admin = await adminDetails.findById(id);
    if (!admin) {
      return res.status(404).send("User Not Found!");
    }
    const performingAdmin = await adminDetails.findOne({ Emailaddress: email });
    if (!performingAdmin) {
      return res.status(403).send("Permission denied");
    }
    admin.Status = "Inactive";
    admin.Deletedby = performingAdmin._id;
    await admin.save();
    return res.status(200).send("User status updated successfully");
  } catch (error) {
    console.error("Error in updating Admin Status to inactive" + error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send("Invalid token");
    }
    return res.status(500).send("Internal server error");
  }
};
