// Admin Model
const mongoose = require("mongoose");
const { Schema } = mongoose;
const adminSchema = new Schema({
  Name: {
    required: true,
    type: String,
  },
  Emailaddress: {
    required: true,
    type: String,
  },
  Password: {
    required: true,
    type: String,
  },
  Access: {
    required: true,
    type: [String],
  },
  Status:{
    required:true,
    type:String
  },
  Deletedby:{type: mongoose.Types.ObjectId, ref: "admin"},
  Deletedat:{type:String},
  Modifiedby: { type: mongoose.Types.ObjectId, ref: "admin" },
  Createdby: { type: mongoose.Types.ObjectId, ref: "admin" },
  Createdat: { type: String },
  Modifiedat: { type: String },

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
adminSchema.pre("save", function (next) {
  const now = formatDateToLocalMinute(new Date());
  if (!this.Createdat) this.Createdat = now;
  this.Modifiedat = now;
  if(this.Deletedby&& !this.Deletedat){
    this.Deletedat=now
  }
  next();
});

const adminDetails = mongoose.model("admin", adminSchema);
module.exports = adminDetails;
