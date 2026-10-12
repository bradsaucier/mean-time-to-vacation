"use strict";

const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    hash: String,
    salt: String,
  },
  { collection: "users" },
);

// Method to set the password on this record.
userSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto.pbkdf2Sync(password, this.salt, 210000, 64, "sha512").toString("hex");
};

// Method to compare entered password against stored hash.
userSchema.methods.validPassword = function (password) {
  if (!this.salt || !this.hash) return false;
  const hash = crypto.pbkdf2Sync(password, this.salt, 210000, 64, "sha512");
  const stored = Buffer.from(this.hash, "hex");
  return stored.length === hash.length && crypto.timingSafeEqual(stored, hash);
};

// Method to generate a JSON Web Token for the current record.
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, name: this.name },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

const User = mongoose.models.users || mongoose.model("users", userSchema);
module.exports = User;
