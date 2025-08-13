// Importing required libraries
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// Creating a transporter object
const transPorter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAILUSER,
    pass: process.env.EMAILPASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Function to send email for OTP
const sendEmailOTP = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAILUSER, // Sender's email
    to: email, // Recipient's email
    subject: "WeeFly OTP Verfication",
    text: `Dear User, your One-Time Password (OTP) is ${otp}. This code is valid for 5 minutes. Please do not share it with anyone.`,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending OTP email:", error);
        reject(error);
      } else {
        console.log("OTP Email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

// Function to send KYC Document recieved Email
const agentDocumentRecievedEmail = (email, Name) => {
  const mailOptions = {
    from: process.env.EMAILUSER, // Sender's email
    to: email, // Recipient's email
    subject: "Welcome to WeeFly",
    html: `
      <p>Dear ${Name},</p>
      <p>Welcome to the WeeFly family!</p>
      <p>We have received your KYC documents and they are currently under review. Once the verification process is complete, our team will get back to you shortly.</p>
      <p>If you have any queries, please feel free to contact us at <a href="mailto:WeeFlytestmail@gmail.com">WeeFlytestmail@gmail.com</a>.</p>
      <p>Best regards,<br>The WeeFly Team</p>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending Document Recieved email:", error);
        reject(error);
      } else {
        console.log("Document received Email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

// Function to send Updated KYC Document recieved Email
const agentNewDocumentRecievedEmail = (email, Name) => {
  const mailOptions = {
    from: process.env.EMAILUSER, // Sender's email
    to: email, // Recipient's email
    subject: "Welcome to WeeFly",
    html: `
      <p>Dear ${Name},</p>
      <p>Welcome to the WeeFly family!</p>
      <p>We have received your updated KYC documents and they are currently under review. Once the verification process is complete, our team will get back to you shortly.</p>
      <p>If you have any queries, please feel free to contact us at <a href="mailto:WeeFlytestmail@gmail.com">WeeFlytestmail@gmail.com</a>.</p>
      <p>Best regards,<br>The WeeFly Team</p>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(
          "Error in sending Updated Document Recieved email:",
          error
        );
        reject(error);
      } else {
        console.log("Updated Document received Email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

// Function to send Approved Email
const agentApprovedEmail = (email, Name) => {
  const mailOptions = {
    from: process.env.EMAILUSER, // Sender's email
    to: email, // Recipient's email
    subject: "Welcome to WeeFly! Your Agent Account is Ready",
    html: `
      <p>Dear ${Name},</p>
      <p>Welcome to our WeeFly family! Your KYC documents have been verified successfully and you can now access our agent panel at <a href=${process.env.AGENT_PANEL_URL}> Agent Pannel </a> with the credentials you created.</p>
      <p>If you have any queries, please feel free to contact us at <a href="mailto:WeeFlytestmail@gmail.com">WeeFlytestmail@gmail.com</a>.</p>
      <p>Best regards,<br>The WeeFly Team</p>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in Approved sending email:", error);
        reject(error);
      } else {
        console.log("Approved Email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

// Function to send Rejected Email
const agentRejectedEmail = (email, Name, rejectionReason, resubmissionLink) => {
  const reason =
    rejectionReason ||
    "Your documents did not meet our verification requirements. Please check and resubmit.";

  const mailOptions = {
    from: process.env.EMAILUSER,
    to: email,
    subject: "WeeFly KYC Verification Update - Action Required",
    html: `
      <p>Dear ${Name},</p>
      <p>Thank you for submitting your KYC documents to WeeFly. After careful review, we couldn't approve your application for the following reason:</p>
      <p><strong>${reason}</strong></p>
      <p>Please correct these issues and resubmit your documents through our portal: <a href="${resubmissionLink}">Update KYC</a>. If you need any clarification, please contact us at <a href="mailto:WeeFlytestmail@gmail.com">WeeFlytestmail@gmail.com</a>.</p>
      <p>We appreciate your patience and look forward to welcoming you to our agent network.</p>
      <p>Best regards,<br>The WeeFly Team</p>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending rejection email:", error);
        reject(error);
      } else {
        console.log("Rejection email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

// Function to send  user to Agent Request Email
const userToAgentRequest = (email, Name, userDetailUrl) => {
  const mailOptions = {
    from: email,
    to: process.env.EMAILUSER,
    subject: "New Agent Request",
    html: `
      <p>User ${Name} has requested to become an agent click to view his details <a href=${userDetailUrl}>View user Details</a> </p>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending User to agent request email:", error);
        reject(error);
      } else {
        console.log("User to agent request email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

// Function to send  user to Agent Request Email
const agentToUserRequest = (email, Name, agentDetailUrl) => {
  const mailOptions = {
    from: email,
    to: process.env.EMAILUSER,
    subject: "New User Request",
    html: `
      <p>Agent ${Name} has requested to become a user click to view his details <a href=${agentDetailUrl}>View Agent Details</a> </p>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending agent to user request email:", error);
        reject(error);
      } else {
        console.log("Agent to user request email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

const userRejectedEmail = (email, Name, rejectionReason, resubmissionLink) => {
  const reason =
    rejectionReason ||
    "Your documents did not meet our verification requirements. Please check and resubmit.";

  const mailOptions = {
    from: process.env.EMAILUSER,
    to: email,
    subject: "WeeFly User to Agent request Update - Action Required",
    html: `
      <p>Dear ${Name},</p>
      <p>Thank you for requesting to become an agent, we couldn't approve your application for the following reason:</p>
      <p><strong>${reason}</strong></p>
      <p>Please correct these issues and resubmit your details through our portal: <a href="${resubmissionLink}">Update Details</a>. If you need any clarification, please contact us at <a href="mailto:WeeFlytestmail@gmail.com">WeeFlytestmail@gmail.com</a>.</p>
      <p>We appreciate your patience and look forward to welcoming you to our agent network.</p>
      <p>Best regards,<br>The WeeFly Team</p>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending rejection email:", error);
        reject(error);
      } else {
        console.log("Rejection email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

const ticketConfirmEmail = (email, Name, ticketId, ticketConfirmUrl) => {
  const mailOptions = {
    from: process.env.EMAILUSER,
    to: email,
    subject: "Your Ticket Has Been Confirmed",
    html: `
      <p>Dear ${Name},</p>
      <p>We’re happy to inform you that your ticket has been successfully confirmed.</p>
      <p><strong>Ticket ID: ${ticketId}</strong></p>
      <p>You can view or manage your ticket by visiting the following link: <a href="${ticketConfirmUrl}">View Ticket</a>.</p>
      <p>If you have any questions, feel free to contact our support team at <a href="mailto:WeeFlytestmail@gmail.com">WeeFlytestmail@gmail.com</a>.</p>
      <p>Thank you for choosing WeeFly. We look forward to assisting you!</p>
      <p>Best regards,<br>The WeeFly Team</p>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending confirmation email:", error);
        reject(error);
      } else {
        console.log("Confirmation email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

const sendPromotionalEmail = (email) => {
  const signupUrl = process.env.SIGNUP_URL;
  const mailOptions = {
    from: process.env.EMAILUSER,
    to: email,
    subject: "Thank You for Booking with Us!",
    messageId: `promo-${Date.now()}`,
    inReplyTo: undefined,
    references: undefined,
    html: `
        <h2>Thank You for Booking with Us!</h2>
        <p>Hi there,</p>
        <p>We noticed you recently made a booking through our website – thank you!</p>
        <p>Did you know that by creating a free account, you can unlock <strong>exclusive member-only offers, discounts, and early access</strong> to our promotions?</p>
        <p>
          ✅ Track all your bookings in one place<br>
          ✅ Get personalized travel recommendations<br>
          ✅ Enjoy faster checkout and special rewards <br>
          ✅ Manage your Booking !!
        </p>
        <p>
          <a href= "${signupUrl}" style="background-color:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
            Create Your Free Account Now
          </a>
        </p>
        <p>Don't miss out – our best deals go to members first!</p>
        <p>Best regards,<br>WeeFly-Team</p>
      `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending promotional email:", error);
        reject(error);
      } else {
        console.log("Promo email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

const userVerifyEmail = (Name, email, token) => {
  const verificationLink = `${process.env.VERIFY_EMAIL_URL}/${token}`;

  const mailOptions = {
    from: process.env.EMAILUSER,
    to: email,
    subject: "Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Dear <strong>${Name}</strong>,</p>

        <p>
          Thank you for registering with us! Please verify your email address by clicking the link below.
          Once verified, you'll be able to get started with our services.
        </p>

        <p style="text-align: center; margin: 20px 0;">
          <a href="${verificationLink}" style="
            background-color: #000;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            font-weight: bold;
            cursor:pointer;
          ">
            Verify Email
          </a>
        </p>
        <p>Best regards,<br><strong>The WeeFly Team</strong></p>
      </div>
    `,
  };

  return new Promise((resolve, reject) => {
    transPorter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending verification email:", error);
        reject(error);
      } else {
        console.log("Verification email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

module.exports = {
  sendEmailOTP,
  agentDocumentRecievedEmail,
  agentApprovedEmail,
  agentRejectedEmail,
  agentNewDocumentRecievedEmail,
  userToAgentRequest,
  agentToUserRequest,
  userRejectedEmail,
  ticketConfirmEmail,
  sendPromotionalEmail,
  userVerifyEmail,
};
