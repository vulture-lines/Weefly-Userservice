// Importing required libraries
const mongoose = require("mongoose");
const JWT = require("jsonwebtoken");

// Importing Notification model as Notification Details
const Notificationdetails = require("../models/Notificationdb");
const userDetails = require("../models/Userdb");

// Importing required utils (Cookie,Password-Encrypt & Decrypt,User JWT and Email Service)
const { cookiedecrypt, getKey } = require("../utils/Cookie");
// Get all notifications
exports.getNotification = async (req, res) => {
  try {
    const { Category } = req.query;
    const userjwt = req.cookies.userjwt;
    const filter = {};
    if (!req.cookies.userjwt && !req.query && req.cookies.userjwt===undefined) {
      res.sendStatus(422);
    }
    if (userjwt) {
      if (Category === "Userpannel") {
        const secretKey = getKey();
        const jwtKey = process.env.JWT_KEY;
        const decryptedJwt = await cookiedecrypt(userjwt, secretKey);
        const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
        email = decodedPayload.id;
        const user = await userDetails.findOne(
          { Emailaddress: email },
          { id: 1 }
        );
        filter.Category = Category;
        filter.Status = "unread";
        filter.Referenceid = user;
      }
    } else if (Category) {
      filter.Category = Category;
      filter.Status = "unread";
    }

    const notifications = await Notificationdetails.find(filter).sort({
      _id: -1,
    });
    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error in Getting Notifications" + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create a new notification
exports.addNotification = async (
  Message,
  Type = "",
  Category,
  Referenceid = ""
) => {
  try {
    if (!Category) {
      throw new Error("Category is required for notification.");
    }
    const notificationData = {};
    if (Message) notificationData.Message = Message;
    if (Type) notificationData.Type = Type;
    notificationData.Category = Category;
    if (Referenceid && mongoose.Types.ObjectId.isValid(Referenceid)) {
      notificationData.Referenceid = Referenceid;
    } else if (Referenceid) {
      return console.warn(
        `Referenceid "${Referenceid}" is not a valid ObjectId and was skipped.`
      );
    }
    notificationData.Status = "unread";
    const notification = new Notificationdetails(notificationData);
    await notification.save();
  } catch (error) {
    return console.error("Error in storing Notification", error);
  }
};

exports.updateNotifiationStatus = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    if (notificationId) {
      const notification = await Notificationdetails.findById(notificationId);
      notification.Status = "read";
      await notification.save();
      return res.status(200).send("Status Changed");
    } else {
      res.sendStatus(422);
    }
  } catch (error) {
    console.error(error);

    return res.status(500).send("Internal Server Error");
  }
};
