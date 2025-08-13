// Importing required libraries
const crypto = require("crypto");

// Importing User model and OTP Model as userdetails and otpdetails
const userdetails = require("../models/Userdb");
const otpDetails = require("../models/Otpdb");

// Importing required utils
const emailService = require("../services/Emailservice");
const { cookieencrypt, getKey } = require("../utils/Cookie");
const Jwttokengenerator = require("../utils/Jwt");

// Function to generate a 6-digit OTP
// const generateOTP = () => {
//   return crypto.randomInt(100000, 999999).toString();
// };

// Function to generate a 4-digit OTP
const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString();
};

// Function to handle OTP request
exports.sendOTP = async (email) => {
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
        VerificationOTP: otp,
        VerificationOTPExpiry: otpExpiry,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Send Email OTP
    await emailService.sendEmailOTP(email, otp);
  } catch (error) {
    console.error("Error in sendOTP" + error);
  }
};

// Function to verify OTP
exports.validateOTP = async (req, res) => {
  const { email, inputOtp } = req.body;
  let Otp = parseInt(inputOtp, 10); 

  if (isNaN(Otp)) {
    throw new Error("OTP Must be integer");
  }

  try {
    if (!email || !inputOtp) {
      return res.status(422).send("Email and OTP are required");
    }

    const user = await userdetails.findOne({ Emailaddress: email });
    const userId = user._id;
    const otpDetail = await otpDetails.findOne({ User: userId });
    if (
      !user ||
      !otpDetail.VerificationOTP ||
      !otpDetail.VerificationOTPExpiry
    ) {
      return res.status(401).send("Invalid or expired OTP");
    }

    if (Date.now() > Number(otpDetail.VerificationOTPExpiry)) {
      return res.status(410).send("OTP has expired");
    }

    if (otpDetail.VerificationOTP !== Otp) {
      return res.status(401).send("Incorrect OTP");
    }
    (user.Status = "Active"), await user.save();
    const id = user.Emailaddress;

    const token = await Jwttokengenerator.Usertokengenerator(id, userId);
    const key = await getKey();
    const encryptedtoken = cookieencrypt(token, key);
    res
      .status(200)
      .cookie("userjwt", encryptedtoken, {
        maxAge: 60 * 60 * 1000,
        path: "/",
      })
      .send("Signup Successful!!");
  } catch (error) {
    console.error("Error in validateOTP" + error);
    return res.status(500).send("Internal server error");
  }
};

exports.reSendOTP = async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  const otpExpiry = Date.now() + 5 * 60 * 1000;

  try {
    const user = await userdetails.findOne({ Emailaddress: email }, { _id: 1 });

    if (!user) {
      return res.status(401).send("Not a registered user");
    }

    // Update if exists, insert if not (upsert)
    await otpDetails.findOneAndUpdate(
      { User: user._id },
      {
        User: user._id,
        VerificationOTP: otp,
        VerificationOTPExpiry: otpExpiry,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await emailService.sendEmail(email, otp); // Send OTP via email
    return res.status(200).send("Otp Sent Sucessfully!!");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
};
