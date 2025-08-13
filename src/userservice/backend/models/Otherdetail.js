const mongoose = require("mongoose");

const otherdetailSchema = new mongoose.Schema({
  otherDetails: mongoose.Schema.Types.Mixed,
  sessionId: { type: mongoose.Types.ObjectId, ref: "userdetails" },
  createdAt: { type: Date, default: Date.now, expires: '24h' }
});

const Otherdetail = mongoose.model("Otherdetail", otherdetailSchema);

module.exports={Otherdetail}
