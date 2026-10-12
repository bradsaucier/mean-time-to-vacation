"use strict";

const passport = require("passport");
const User = require("../models/user");

const isFilledText = (value) => typeof value === "string" && value.trim() !== "";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (![name, email, password].every(isFilledText) || !emailPattern.test(email.trim())) {
    return res.status(400).json({ message: "All fields required" });
  }
  try {
    const user = new User({ name, email });
    user.setPassword(password);
    await user.save();
    return res.status(200).json({ token: user.generateJWT() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Check the registration fields." });
    }
    console.error("Registration failed:", error.message);
    return res.status(500).json({ message: "Registration failed." });
  }
};

const login = (req, res, next) => {
  const { email, password } = req.body ?? {};
  if (![email, password].every(isFilledText)) {
    return res.status(400).json({ message: "All fields required" });
  }
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Login failed:", err.message);
      return res.status(500).json({ message: "Login failed." });
    }
    if (!user) {
      return res.status(401).json(info || { message: "Incorrect email or password." });
    }
    return res.status(200).json({ token: user.generateJWT() });
  })(req, res, next);
};

module.exports = { register, login };
