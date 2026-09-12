"use strict";

// Static middleware serves the customer homepage before this fallback route.
const index = (_request, response) => {
  response.render("index", { title: "Travlr Getaways" });
};

module.exports = { index };
