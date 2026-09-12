"use strict";

const express = require("express");
const mainController = require("../controllers/main");

const router = express.Router();

router.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "travlr-getaways" });
});

router.get("/", mainController.index);

module.exports = router;
