// controller/Guestcontroller.js
const userDetails = require("../models/Userdb");
const { encryptPassword } = require("../utils/Password");
const Notify = require("./Notificationcontroller");

exports.registerGuest = async (req, res) => {
  if (!req.body || !req.body.payload) {
    return res.status(400).json({ error: "Missing request body or payload" });
  }

  const { payload } = req.body;

  // Extract and format the name
  const nameParts = payload?.Name?.NamePartList?.NamePart || [];
  const Name = nameParts.join(" ");

  // Email
  const Emailaddress = payload?.Email?.trim();

  // Format mobile number: no spaces, strip "00" from international code
  const rawIntlCode = payload?.MobilePhone?.InternationalCode || "";
  const intlCode = rawIntlCode.startsWith("00")
    ? rawIntlCode.slice(2)
    : rawIntlCode;
  const phoneNumber = payload?.MobilePhone?.Number?.trim() || "";
  const mobileNumber =
    intlCode && phoneNumber ? `${intlCode}${phoneNumber}` : "N/A";

  const addressFields = [
    payload?.Address?.Company,
    payload?.Address?.Flat,
    payload?.Address?.BuildingName,
    payload?.Address?.BuildingNumber,
    payload?.Address?.Street,
    payload?.Address?.Locality,
    payload?.Address?.City,
    payload?.Address?.Province,
    payload?.Address?.Postcode,
    payload?.Address?.CountryCode,
  ];

  // Filter out empty/null/undefined values and join with commas
  const Address = addressFields.filter(Boolean).join(", ");

  if (!Name || !Emailaddress) {
    return res
      .status(400)
      .json({ message: "Name and Emailaddress are required" });
  }

  try {
    const email = Emailaddress.toLowerCase();

    const existingGuest = await userDetails.findOne({ Emailaddress: email });
    if (existingGuest) {
      return res
        .status(409)
        .json({ message: "This email already exists", userId:existingGuest.id ,role: existingGuest.Currentrole});
    }

    const guestUser = new userDetails({
      Name,
      Mobilenumber: mobileNumber,
      Emailaddress: email,
      Address: Address,
      Password: "Guest",
      Usertype: "Guest",
      Currentrole: ["Guest"],
      Status: "Active",
    });

    await guestUser.save();

    await Notify.addNotification(
      `New guest registered: ${Name}`,
      "GuestRegistration",
      "Adminpannel",
      guestUser._id
    );

    return res.status(201).json({guestId:guestUser.id});
  } catch (error) {
    console.error("Guest registration error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
// Soft-delete helper function
async function softDelete(entity, performedBy) {
  entity.Status = "Inactive";
  entity.Deletedby = performedBy || null;
  entity.Deletedat = new Date().toISOString();
  await entity.save();
}

// Get all entities (except inactive)
exports.getAll = async (req, res) => {
  try {
    const entities = await Model.find({ Status: { $ne: "Inactive" } }).sort({ _id: -1 });
    res.status(200).json(entities);
  } catch (error) {
    console.error("Error fetching all:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get entity by ID
exports.getById = async (req, res) => {
  try {
    const entity = await Model.findById(req.params.id);
    if (!entity || entity.Status === "Inactive") {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(entity);
  } catch (error) {
    console.error("Error fetching by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update entity by ID
exports.updateById = async (req, res) => {
  try {
    const entity = await Model.findById(req.params.id);
    if (!entity || entity.Status === "Inactive") {
      return res.status(404).json({ message: "Not found" });
    }
    const payload = req.body;

    // Example: update fields dynamically (add more as needed)
    for (const key of Object.keys(payload)) {
      if (key === "Password" && payload[key]) {
        entity.Password = await encryptPassword(payload[key]);
      } else {
        entity[key] = payload[key];
      }
    }

    entity.Modifiedat = new Date().toISOString();
    await entity.save();

    res.status(200).json({ message: "Updated successfully", entity });
  } catch (error) {
    console.error("Error updating:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Soft delete entity by ID
exports.deleteById = async (req, res) => {
  try {
    const entity = await Model.findById(req.params.id);
    if (!entity || entity.Status === "Inactive") {
      return res.status(404).json({ message: "Not found" });
    }

    // Assume we can get the performing user ID from middleware/auth (optional)
    const performedBy = req.user ? req.user._id : null;

    await softDelete(entity, performedBy);

    res.status(200).json({ message: "Deleted (status set to Inactive)" });
  } catch (error) {
    console.error("Error deleting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
*/
