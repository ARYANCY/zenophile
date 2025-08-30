const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const moment = require("moment");
const engine = require("ejs-mate");
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// --- View Engine ---
app.engine('ejs', engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Session Setup ---
app.use(session({
  secret: process.env.SESSION_SECRET || "temporarySecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// --- Temporary UserId for testing ---
app.use((req, res, next) => {
  // Replace with an actual user ObjectId from your database
  req.session.userId = "64f7b2c8c2f5b5a1d8e7a123"; 
  next();
});


// --- Routers ---
const chatbotRoutes = require("./routes/chatbotRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use("/chatbot", chatbotRoutes);
app.use("/dashboard", dashboardRoutes);

// --- Root Route ---
app.get("/", (req, res) => {
  res.redirect("/chatbot"); 
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
