// controller/Guestcontroller.js
const userDetails = require("../models/Userdb");
const Notify = require("./Notificationcontroller");

exports.registerGuest = async (req, res) => {
  if (!req.body || !req.body.payload) {
    return res.status(400).json({ error: "Missing request body or payload" });
  }

  const { payload } = req.body;
  const { BillingDetails } = req.body;
  const jwt = req.cookies.userjwt;

  // Extract and format the name
  const Title = payload?.Name?.Title;
  const nameParts = payload?.Name?.NamePartList?.NamePart || [];
  const Name = Title ? `${Title}. ${nameParts.join(" ")}` : nameParts.join(" ");

  // Email
  const Emailaddress = payload?.Email?.trim();

  // Format mobile number: no spaces, strip "00" from international code
  const rawIntlCode = payload?.MobilePhone?.InternationalCode || "";
  const intlCode = rawIntlCode.startsWith("00")
    ? rawIntlCode.slice(2)
    : rawIntlCode;
  const phoneNumber = payload?.MobilePhone?.Number?.trim() || "";
  const mobileNumber =
    intlCode && phoneNumber ? `${intlCode}-${phoneNumber}` : "N/A";

  // Filter out empty/null/undefined values and join with commas
  const ContactAddress = payload.Address;
  let BillingAddress;
  if (BillingDetails) {
    BillingAddress = BillingDetails.Address;
  }

  if (!Name || !Emailaddress) {
    return res
      .status(400)
      .json({ message: "Name and Emailaddress are required" });
  }

  try {
    const email = Emailaddress.toLowerCase();

    const existingGuest = await userDetails.findOne({ Emailaddress: email });
    if (existingGuest) {
      if (jwt) {
        let updated = false;

        // Update Contact Address if not present
        if (!existingGuest.ContactAddress) {
          existingGuest.ContactAddress = ContactAddress;
          existingGuest.markModified("ContactAddress");
          updated = true;
        }

        // Update Billing Address if not present
        if (!existingGuest.BillingAddress) {
          existingGuest.BillingAddress = BillingAddress;
          existingGuest.markModified("BillingAddress");
          updated = true;
        }

        // Update Billing Address if it's provided and different
        if (
          BillingAddress &&
          JSON.stringify(existingGuest.BillingAddress) !==
            JSON.stringify(BillingAddress)
        ) {
          existingGuest.BillingAddress = BillingAddress;
          existingGuest.markModified("BillingAddress");
          updated = true;
        }
        // Update Name if it's provided and different
        if (Name !== existingGuest.Name) {
          existingGuest.Name = Name;
          updated = true;
        }

        // Update Mobile Number if it's "Googleauth" OR differs from payload
        if (
          existingGuest.Mobilenumber === "Googleauth" ||
          (mobileNumber !== "N/A" &&
            existingGuest.Mobilenumber !== mobileNumber)
        ) {
          existingGuest.Mobilenumber = mobileNumber;
          updated = true;
        }

        if (updated) {
          await existingGuest.save();
        }

        return res
          .status(200)
          .json({ message: "Fetched!!", userId: existingGuest.id });
      } else {
        return res.status(409).json({
          message: "This email already exists",
          userId: existingGuest.id,
          role: existingGuest.Currentrole,
        });
      }
    }

    const guestUserData = {
      Name,
      Mobilenumber: mobileNumber,
      Emailaddress: email,
      ContactAddress: ContactAddress,
      Password: "Guest",
      Usertype: "Guest",
      Currentrole: ["Guest"],
      Status: "Active",
    };

    if (BillingAddress) {
      guestUserData.BillingAddress = BillingAddress;
    }

    const guestUser = new userDetails(guestUserData);
    await guestUser.save();
    await Notify.addNotification(
      `New guest registered: ${Name}`,
      "GuestRegistration",
      "Adminpannel",
      guestUser._id
    );

    return res.status(201).json({ userId: guestUser.id });
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
