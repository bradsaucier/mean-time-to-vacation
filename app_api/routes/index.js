"use strict";

const express = require("express");
const jwt = require("jsonwebtoken");
const authController = require("../controllers/authentication");
const tripsController = require("../controllers/trips");

const router = express.Router();

// Reject invalid tokens before a trip write reaches its controller.
function authenticateJWT(req, res, next) {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header required." });
  }
  const [scheme, token, extra] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token || extra !== undefined) {
    return res.status(401).json({ message: "Authorization header must be: Bearer <token>." });
  }
  try {
    // Accept only the algorithm used to sign login tokens.
    req.auth = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError" ? "Token expired." : "Token validation error.";
    return res.status(401).json({ message });
  }
}

router.route("/register").post(authController.register);
router.route("/login").post(authController.login);

router
  .route("/trips")
  .get(tripsController.tripsList)
  .post(authenticateJWT, tripsController.tripsAddTrip);
router
  .route("/trips/:tripCode")
  .get(tripsController.tripsFindByCode)
  .put(authenticateJWT, tripsController.tripsUpdateTrip)
  .delete(authenticateJWT, tripsController.tripsDeleteTrip);

router.use((_request, response) => {
  response.status(404).json({ message: "API route not found." });
});

module.exports = router;
module.exports.authenticateJWT = authenticateJWT;
