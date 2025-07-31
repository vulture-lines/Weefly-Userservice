// Importing required libraries
const crypto = require("crypto");

// Importing User model and OTP Model as userdetails and otpdetails
const userdetails = require("../models/Userdb");
const otpDetails = require("../models/Otpdb");

// Importing required utils
const emailService = require("../services/Emailservice");

// Function to generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Function to handle OTP request
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userdetails.findOne({ Emailaddress: email }, { _id: 1 });
    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    if (!user) {
      return res.status(401).send("Not a registered user");
    }
    await otpDetails.findOneAndUpdate(
      { User: user._id },
      {
        User: user._id,
        PasswordresetOTP: otp,
        PasswordresetOTPExpiry: otpExpiry,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Send Email OTP
    await emailService.sendEmailOTP(email, otp);
    return res.status(200).send("Otp Sent Sucessfully!!");
  } catch (error) {
    console.error("Error in sendOTP" + error);
    return res.status(500).send("Internal server error");
  }
};

// Function to verify OTP
exports.validateOTP = async (req, res) => {
  const { email, inputOtp } = req.body;
  try {
    if (!email || !inputOtp) {
      return res.status(422).send("Email and OTP are required");
    }

    const user = await userdetails.findOne({ Emailaddress: email });
    const userId = user._id;
    const otpDetail = await otpDetails.findOne({ User: userId });
    if (
      !user ||
      !otpDetail.PasswordresetOTP ||
      !otpDetail.PasswordresetOTPExpiry
    ) {
      return res.status(401).send("Invalid or expired OTP");
    }

    if (Date.now() > Number(otpDetail.PasswordresetOTPExpiry)) {
      return res.status(410).send("OTP has expired");
    }

    if (otpDetail.PasswordresetOTP !== inputOtp) {
      return res.status(401).send("Incorrect OTP");
    }

    return res.status(200).send("OTP verified successfully");
  } catch (error) {
    console.error("Error in validateOTP" + error);
    return res.status(500).send("Internal server error");
  }
};
