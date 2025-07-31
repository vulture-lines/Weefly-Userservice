
const cron = require("node-cron");
require("dotenv").config();
const userdetails=require("../models/Userdb");
const { sendPromotionalEmail } = require("./Emailservice");
const cronSchedule = process.env.CRON_SCHEDULE;
cron.schedule(cronSchedule, async () => {
  console.log("🕒 Fetching users and sending emails...");

  try {
    const users = await userdetails.find(
      {
        Usertype: "Guest",
        Currentrole: { $in: ["Guest"] },
      },
      { Emailaddress: 1 } // Project only Emailaddress field
    );
    
    const emails = users.map(user => user.Emailaddress);
    console.log(`Found ${emails.length} users.`);

    for (const email of emails) {
      await sendPromotionalEmail(email)
    }

  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
  }
});
