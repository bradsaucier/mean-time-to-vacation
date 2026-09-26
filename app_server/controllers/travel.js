"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Read once at startup. Travel stays file-backed until Module Five.
const tripsPath = path.join(__dirname, "..", "..", "data", "trips.json");
const trips = JSON.parse(fs.readFileSync(tripsPath, "utf8"));

const travel = (_request, response) => {
  response.render("travel", {
    title: "Travel | Travlr Getaways",
    description: "Find your reef with experience profiles and field notes from Travlr Getaways.",
    trips,
    isTravel: true,
    // travel.hbs has its own HTML shell.
    layout: false,
  });
};

module.exports = { travel };
