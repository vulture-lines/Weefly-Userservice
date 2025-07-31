// Notification Model
const mongoose = require("mongoose");
const { Schema } = mongoose;
const notificationSchema = new Schema({
  Message: {
    type: String,
    required: true,
  },
  Type: {
    type: String,
  },
  Category: {
    type: String,
    required: true,
  },
  Referenceid:{
    type:mongoose.Types.ObjectId
  },
  Status:{
    type:String
  }
});
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
