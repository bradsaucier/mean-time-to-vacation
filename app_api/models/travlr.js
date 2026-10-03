"use strict";

const mongoose = require("mongoose");

const requiredText = (label, maximum) => ({
  type: String,
  required: [true, `${label} is required`],
  trim: true,
  maxlength: [maximum, `${label} cannot exceed ${maximum} characters`],
});

const tripSchema = new mongoose.Schema(
  {
    code: {
      ...requiredText("Trip code", 12),
      uppercase: true,
      match: [/^[A-Z]{4}\d{6}$/, "Trip code must contain four letters and six digits"],
      unique: true,
    },
    name: { ...requiredText("Trip name", 80), index: true },
    length: requiredText("Trip length", 40),
    start: { type: Date, required: [true, "Start date is required"] },
    resort: requiredText("Resort", 120),
    perPerson: {
      ...requiredText("Per-person price", 10),
      match: [/^\d{1,5}\.\d{2}$/, "Per-person price must use dollars and two decimals"],
    },
    image: {
      ...requiredText("Image filename", 100),
      match: [/^[\w-]+\.(?:jpe?g|png|webp)$/i, "Image must be a local image filename"],
    },
    description: requiredText("Description", 600),
    imageAlt: requiredText("Image alternative text", 160),
    eyebrow: requiredText("Eyebrow", 60),
    bestFor: requiredText("Best-for summary", 120),
    level: {
      ...requiredText("Experience level", 40),
      enum: {
        values: ["Introductory", "Intermediate", "Experienced"],
        message: "Level must be Introductory, Intermediate, or Experienced",
      },
    },
    water: requiredText("Water profile", 60),
    fieldNote: requiredText("Field note", 300),
  },
  { collection: "trips", strict: "throw" },
);

const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema, "trips");

module.exports = Trip;
