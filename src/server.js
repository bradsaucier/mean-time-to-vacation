"use strict";

const app = require("./app");

const port = Number.parseInt(process.env.PORT || "3000", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError("PORT must be an integer from 1 through 65535");
}

const server = app.listen(port, () => {
  console.log("Travlr Getaways is boarding on port " + port + ".");
});

function shutDown(signal) {
  console.log(signal + " received. Closing the gate.");
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutDown("SIGINT"));
process.on("SIGTERM", () => shutDown("SIGTERM"));
