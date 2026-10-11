"use strict";

const Trip = require("../models/travlr");
const tripCodePattern = /^[A-Za-z]{4}\d{6}$/;

const tripsList = async (_request, response) => {
  try {
    const trips = await Trip.find({}).sort({ start: 1 }).exec();
    return response.status(200).json(trips);
  } catch (error) {
    console.error("Trip list failed:", error.message);
    return response.status(500).json({ message: "Unable to retrieve trips." });
  }
};

const tripsFindByCode = async (request, response) => {
  if (!tripCodePattern.test(request.params.tripCode)) {
    return response.status(400).json({ message: "Trip code must be four letters and six digits." });
  }

  try {
    const trip = await Trip.findOne({ code: request.params.tripCode.toUpperCase() }).exec();

    if (!trip) {
      return response
        .status(404)
        .json({ message: `Trip ${request.params.tripCode} was not found.` });
    }

    return response.status(200).json(trip);
  } catch (error) {
    console.error("Trip lookup failed:", error.message);
    return response.status(500).json({ message: "Unable to retrieve trip." });
  }
};

const fields = [
  "code",
  "name",
  "length",
  "start",
  "resort",
  "perPerson",
  "image",
  "description",
  "imageAlt",
  "eyebrow",
  "bestFor",
  "level",
  "water",
  "fieldNote",
];

function tripInput(body, code) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("A JSON trip object is required."), { status: 400 });
  }
  if (code && body.code !== undefined && String(body.code).trim().toUpperCase() !== code) {
    throw Object.assign(new Error("Trip code cannot be changed."), { status: 400 });
  }
  const input = Object.fromEntries(
    fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]),
  );
  if (code) input.code = code;
  for (const [field, value] of Object.entries(input)) {
    if (typeof value !== "string") {
      throw Object.assign(new Error(`${field} must be text.`), { status: 400 });
    }
    input[field] = value.trim();
  }
  if (/^\d{1,5}(\.\d{1,2})?$/.test(input.perPerson || "")) {
    input.perPerson = Number(input.perPerson).toFixed(2);
  }
  if (input.start) {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input.start);
    const utcDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(input.start);
    const date = new Date(dateOnly ? `${input.start}T12:00:00.000Z` : input.start);
    if (
      (!dateOnly && !utcDate) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== input.start.slice(0, 10)
    ) {
      throw Object.assign(new Error("Start date is invalid."), { status: 400 });
    }
    input.start = date.toISOString();
  }
  return input;
}

function sendTripError(response, error) {
  if (error.code === 11000)
    return response.status(409).json({
      message: "That trip code already exists.",
      errors: { code: "Choose a unique trip code." },
    });
  if (error.name === "ValidationError") {
    return response.status(400).json({
      message: "Check the trip fields.",
      errors: Object.fromEntries(
        Object.entries(error.errors).map(([field, detail]) => [field, detail.message]),
      ),
    });
  }
  if (error.status === 400) return response.status(400).json({ message: error.message });
  return response.status(500).json({ message: "Unable to save the trip. Try again." });
}

const tripsAddTrip = async (request, response) => {
  try {
    const trip = await Trip.create(tripInput(request.body));
    return response.location(`/api/trips/${trip.code}`).status(201).json(trip);
  } catch (error) {
    return sendTripError(response, error);
  }
};

const tripsUpdateTrip = async (request, response) => {
  if (!tripCodePattern.test(request.params.tripCode))
    return response.status(400).json({ message: "Trip code must be four letters and six digits." });
  try {
    const code = request.params.tripCode.toUpperCase();
    const input = tripInput(request.body, code);
    // PUT replaces the editable trip fields, so validate the complete document.
    await new Trip(input).validate();
    const trip = await Trip.findOneAndUpdate(
      { code },
      { $set: input },
      { returnDocument: "after", runValidators: true },
    ).exec();
    if (!trip) return response.status(404).json({ message: `Trip ${code} was not found.` });
    return response.json(trip);
  } catch (error) {
    return sendTripError(response, error);
  }
};

const tripsDeleteTrip = async (request, response) => {
  if (!tripCodePattern.test(request.params.tripCode))
    return response.status(400).json({ message: "Trip code must be four letters and six digits." });
  try {
    const trip = await Trip.findOneAndDelete({
      code: request.params.tripCode.toUpperCase(),
    }).exec();
    if (!trip) return response.status(404).json({ message: "Trip was not found." });
    return response.status(204).end();
  } catch {
    return response.status(500).json({ message: "Unable to delete the trip. Try again." });
  }
};

module.exports = { tripsList, tripsFindByCode, tripsAddTrip, tripsUpdateTrip, tripsDeleteTrip };
