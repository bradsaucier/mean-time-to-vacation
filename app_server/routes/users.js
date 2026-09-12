"use strict";

const express = require("express");

const router = express.Router();

router.get("/", (_request, response) => {
  response.status(501).json({ message: "User services are reserved for a later module." });
});

module.exports = router;
