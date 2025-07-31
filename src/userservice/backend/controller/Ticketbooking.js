const mongoose = require("mongoose");
require("dotenv").config();
const userdetails = require("../models/Userdb");
const {
  ticketConfirmEmail,
  sendPromotionalEmail,
} = require("../services/Emailservice");

// Get user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userdetails.findById(id, {
      Name: 1,
      Emailaddress: 1,
      Mobilenumber: 1,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserBooking = async (req, res) => {
  const { id } = req.params;
  let newFlight = req.body;

  try {
    const user = await userdetails.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure Flightdetails is initialized
    if (!Array.isArray(user.Flightdetails)) {
      user.Flightdetails = [];
    }

    // 🔄 Convert paymentid to ObjectId if it exists
    if (newFlight.details.paymentid) {
      newFlight.details.paymentid = new mongoose.Types.ObjectId(
        newFlight.details.paymentid
      );
    }

    // Append the new flight
    user.Flightdetails.push(newFlight);
    user.markModified("Flightdetails");
    await user.save();
    const email = user.Emailaddress;
    const Name = user.Name;
    const latestTicket = user.Flightdetails[user.Flightdetails.length - 1];
    const ticketId =
      latestTicket.details.TravelfusionBookingDetail.BookingCheckResponse
        .additionalInfo.SupplierReference[0];
    const ticketUrl = `${process.env.SUCCESS_URL}/${ticketId}`;
    await ticketConfirmEmail(email, Name, ticketId, ticketUrl);
    if (user.Currentrole.includes("Guest")) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      sendPromotionalEmail(email);
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error("Error updating user booking:", err);
    res.status(500).json({ message: "Server error" });
  }
};
