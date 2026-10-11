"use strict";

const express = require("express");
const tripsController = require("../controllers/trips");

const router = express.Router();

router.route("/trips").get(tripsController.tripsList).post(tripsController.tripsAddTrip);
router
  .route("/trips/:tripCode")
  .get(tripsController.tripsFindByCode)
  .put(tripsController.tripsUpdateTrip)
  .delete(tripsController.tripsDeleteTrip);

router.use((_request, response) => {
  response.status(404).json({ message: "API route not found." });
});

module.exports = router;
