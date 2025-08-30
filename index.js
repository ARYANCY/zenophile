const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const engine = require("ejs-mate");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.engine('ejs', engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Session & Flash ---
app.use(session({
  secret: process.env.SESSION_SECRET || "temporarySecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// --- MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Routes ---
const authRoutes = require("./routes/authRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const requireLogin = require("./middleware/authMiddleware");
const { title } = require("process");

// Public routes
app.use("/", authRoutes);

// Protected routes
app.use("/chatbot", requireLogin, chatbotRoutes);
app.use("/dashboard", requireLogin, dashboardRoutes);

// Root redirect
app.get("/", (req, res) => {
   res.render("index",{title:"Home",  user: req.session.userId});
});

// 404
app.use((req, res) => res.status(404).send("Page not found"));

// Start server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
