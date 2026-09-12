"use strict";

const travel = (_request, response) => {
  response.render("travel", {
    title: "Travel | Travlr Getaways",
    description: "Explore three signature reef experiences with Travlr Getaways.",
    isTravel: true,
    // This view owns its document shell and includes header/footer partials.
    layout: false,
  });
};

module.exports = { travel };
