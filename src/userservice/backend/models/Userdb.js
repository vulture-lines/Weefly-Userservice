// Userand Agent Model
const Userdb = require("mongoose");
const { Schema } = Userdb;

const userschema = new Schema({
  Name: { type: String, required: true },
  Mobilenumber: { type: String, required: true },
  Emailaddress: { type: String, required: true },
  Address: { type: String },
  Password: { type: String, required: true },
  Usertype: { type: String },
  Currentrole: { type: [String] },
  KYC: { type: Schema.Types.Mixed },
  OldKYC: { type: Schema.Types.Mixed },
  Approvalstatus: { type: String },
  Approvedby: { type: Userdb.Types.ObjectId, ref: "admin" },
  Approveddate: { type: String },
  Rejectedby: { type: Userdb.Types.ObjectId, ref: "admin" },
  Rejecteddate: { type: String },
  Createdby: { type: Userdb.Types.ObjectId, ref: "Userdetails" },
  Createdat: { type: String },
  Modifiedby: { type: Userdb.Types.ObjectId, ref: "admin" },
  Modifiedat: { type: String },
  Status: {
    required: true,
    type: String,
  },
  Deletedby: { type: Userdb.Types.ObjectId, ref: "admin" },
  Deletedat: { type: String },
  Reapproved: { type: String },
  Reapprovetoken: { type: String },
  Reapproveddate: { type: String },
  Flightdetails:{type:Schema.Types.Mixed}
 
});

// Format date to "YYYY-MM-DDTHH:mm"
function formatDateToLocalMinute(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Hook to set formatted timestamps before save
userschema.pre("save", function (next) {
  const now = formatDateToLocalMinute(new Date());
  if (!this.Createdat) this.Createdat = now;

  if (this.Approvedby) {
    this.Approveddate = now;
  }
  if (this.Rejectedby) {
    this.Rejecteddate = now;
  }
  if (this.Deletedbyt) {
    this.Deletedat = now;
  }
  if (this.Modifiedby) {
    this.Modifiedat = now;
  }
  if (this.Reapproved) {
    this.Reapproveddate = now;
  } 
  next();
});

//User Model
const userdetails = Userdb.model("userdetails", userschema);

module.exports = userdetails;
