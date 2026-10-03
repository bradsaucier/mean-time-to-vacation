"use strict";

const Trip = require("../models/travlr");
const tripCodePattern = /^[A-Za-z]{4}\d{6}$/;

const tripsList = async (_request, response) => {
  try {
    const trips = await Trip.find({}).sort({ start: 1 }).exec();
    return response.status(200).json(trips);
  } catch (error) {
    return response
      .status(500)
      .json({ message: "Unable to retrieve trips.", error: error.message });
  }
};

const tripsFindByCode = async (request, response) => {
  if (!tripCodePattern.test(request.params.tripCode)) {
    return response.status(400).json({ message: "Trip code must be four letters and six digits." });
  }

  try {
    const trip = await Trip.findOne({ code: request.params.tripCode }).exec();

    if (!trip) {
      return response
        .status(404)
        .json({ message: `Trip ${request.params.tripCode} was not found.` });
    }

    return response.status(200).json(trip);
  } catch (error) {
    return response.status(500).json({ message: "Unable to retrieve trip.", error: error.message });
  }
};

module.exports = { tripsList, tripsFindByCode };
