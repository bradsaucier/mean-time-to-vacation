"use strict";

const express = require("express");
const travelController = require("../controllers/travel");

const router = express.Router();

router.get("/", travelController.travel);

module.exports = router;
