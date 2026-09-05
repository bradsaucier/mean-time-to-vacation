"use strict";

const express = require("express");

const router = express.Router();

router.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "travlr-getaways" });
});

router.get("/", (_request, response) => {
  response.render("index", { title: "Travlr Getaways" });
});

module.exports = router;
