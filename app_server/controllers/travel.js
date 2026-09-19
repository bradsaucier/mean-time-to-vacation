"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Module Three's file-backed model is loaded once at startup, not on every request.
// Resolve from this module so launch-directory changes cannot break the data path.
const tripsPath = path.join(__dirname, "..", "..", "data", "trips.json");
const trips = JSON.parse(fs.readFileSync(tripsPath, "utf8"));

const travel = (_request, response) => {
  response.render("travel", {
    title: "Travel | Travlr Getaways",
    description: "Find your reef with experience profiles and field notes from Travlr Getaways.",
    trips,
    isTravel: true,
    // This view owns its document shell and includes header/footer partials.
    layout: false,
  });
};

module.exports = { travel };
