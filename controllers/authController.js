const User = require("../models/User");

// Helper: normalize email
const normalizeEmail = (email) => email.trim().toLowerCase();

// Registration page
exports.getRegister = (req, res) => {
  if (req.session.userId) return res.redirect("/chatbot");
  res.render("auth/register");
};

// Handle registration
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      req.flash("error", "All fields are required");
      return res.redirect("/register");
    }

    if (password.trim() !== confirmPassword.trim()) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/register");
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      req.flash("error", "Email is already registered. Try logging in.");
      return res.redirect("/login");
    }

    // Create new user (schema will hash password automatically)
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim()
    });

    await user.save();

    req.session.userId = user._id;
    req.flash("success", `Registration successful! Welcome, ${user.name}`);
    res.redirect("/chatbot");

  } catch (err) {
    console.error("Registration error:", err);
    req.flash("error", "Server error. Please try again.");
    res.redirect("/register");
  }
};

// Login page
exports.getLogin = (req, res) => {
  if (req.session.userId) return res.redirect("/chatbot");
  res.render("auth/login");
};

// Handle login
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/login");
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }

    const isMatch = await user.comparePassword(password.trim());
    if (!isMatch) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }

    req.session.userId = user._id;
    req.flash("success", `Welcome back, ${user.name}`);
    res.redirect("/chatbot");

  } catch (err) {
    console.error("Login error:", err);
    req.flash("error", "Server error. Please try again.");
    res.redirect("/login");
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error("Logout error:", err);
    res.redirect("/");
  });
};
