"use strict";

const tripsEndpoint = `http://localhost:${process.env.PORT || "3000"}/api/trips`;
const options = {
  method: "GET",
  headers: { Accept: "application/json" },
};

const travel = async (_request, response) => {
  try {
    const apiResponse = await fetch(tripsEndpoint, options);
    let trips = apiResponse.ok ? await apiResponse.json() : null;
    let message;

    if (!Array.isArray(trips)) {
      message = "API lookup error";
      trips = [];
    } else if (trips.length === 0) {
      message = "No trips exist in our database!";
    }

    response.render("travel", {
      title: "Travel | Travlr Getaways",
      description: "Find your reef with experience profiles and field notes from Travlr Getaways.",
      trips,
      message,
      isTravel: true,
      layout: false,
    });
  } catch (error) {
    response.status(500).send(error.message);
  }
};

module.exports = { travel };
