"use strict";
const fs = require("node:fs");
const path = require("node:path");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace-with-a-long-random-string")
  throw Error("Set JWT_SECRET in .env first.");
const payload = { _id: "module7-qa", name: "Mock Admin", email: "mock@example.test" };
const environment = {
  name: "Travlr Module Seven Local QA",
  values: [
    {
      key: "baseUrl",
      value: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}/api`,
      enabled: true,
    },
    {
      key: "expiredToken",
      value: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: -1 }),
      enabled: true,
    },
    {
      key: "wrongSecretToken",
      value: jwt.sign(payload, "intentionally-wrong-qa-secret", { expiresIn: "1h" }),
      enabled: true,
    },
  ],
  _postman_variable_scope: "environment",
};
fs.writeFileSync(
  path.join(__dirname, "../postman/module7.local.postman_environment.json"),
  JSON.stringify(environment, null, 2) + "\n",
);
console.log("Local QA environment created. Do not commit or submit this generated file.");
