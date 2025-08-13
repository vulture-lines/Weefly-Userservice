// Importing required libraries
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const express = require("express");

// Importing routes
const userRoute = require("./routes/Userdetailsroute.js");
const otpRoute = require("./routes/Otproute.js");
const agentRoute = require("./routes/Agentroute.js");
const adminRoute = require("./routes/Adminroutes.js");
const pannelAccessRoutes = require("./routes/Adminpannelaccess.js");
const notificationRoute = require("./routes/Notification.js");
const guestRoute = require("./routes/Guestroute");
const getUserDetailRoute = require("./routes/Ticketbooking.js");

// Importing database connection
const connectDb = require("./config/Db.js");

dotenv.config();
const app = express();
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
if (process.env.CRON === "yes") {
  require("./services/Promotion.js");
  console.log("Running cron Job");
}

const kycdocumentdirectory = path.join(__dirname, "kycdocuments");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://dev.weefly.africa",
  "https://weefly.africa",
  "http://localhost:3001",
  "http://localhost:3000",
];

// Middleware to reject requests with unauthorized origin
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  if (req.path.startsWith("/userapi/verifyuseremail")) {
    console.log("Works");
    
    return next();
  }

  if (allowedOrigins.includes(origin)) {
    next(); // origin is allowed
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// Apply CORS only for allowed origins
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header('Access-Control-Allow-Credentials',true);
  res.header("Access-Control-Allow-Origin", allowedOrigins);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

// API Routes
app.use(cookieParser());
app.use("/userapi", userRoute);
app.use("/userapi", otpRoute);
app.use("/userapi", agentRoute);
app.use("/userapi", adminRoute);
app.use("/userapi", pannelAccessRoutes);
app.use("/userapi", notificationRoute);
app.use("/userapi", guestRoute);
app.use("/userapi", getUserDetailRoute);
app.use("/kycdocuments", express.static(kycdocumentdirectory));

connectDb();
const PORT = process.env.PORT;

app.listen(PORT, () =>
  console.log(`User Service Server running on port ${PORT}`)
);
