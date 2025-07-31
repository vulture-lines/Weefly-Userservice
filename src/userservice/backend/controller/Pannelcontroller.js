// Importing required libraries
const JWT = require("jsonwebtoken");

// Importing required utils
const { cookiedecrypt, getKey } = require("../utils/Cookie");

// Function to check Admin Pannel Access
exports.checkPannelAccess = async (req, res) => {
  const adminjwt = req.cookies.adminjwt;
  if (!adminjwt) {
    return res.status(401).json({ msg: "Admin not logged in" });
  }
  let Access;
  try {
    const secretKey = getKey();
    const jwtKey = process.env.JWT_KEY;
    const decryptedJwt = await cookiedecrypt(adminjwt, secretKey);
    const decodedPayload = JWT.verify(decryptedJwt, jwtKey);
    Access = decodedPayload.Access;
    return res.status(200).json(Access);
  } catch (error) {
    console.error("Error in Pannel Access" + error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
