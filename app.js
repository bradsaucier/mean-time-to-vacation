"use strict";

const path = require("node:path");
// Load .env before any module reads process.env (db.js reads DB_* at require time).
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const createError = require("http-errors");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const hbs = require("hbs");
const passport = require("passport");

// Register the database model and listeners. bin/www opens the connection.
require("./app_api/models/db");
// Wire in our authentication strategy.
require("./app_api/config/passport");

const indexRouter = require("./app_server/routes/index");
const usersRouter = require("./app_server/routes/users");
const travelRouter = require("./app_server/routes/travel");
const apiRouter = require("./app_api/routes/index");

const app = express();

app.disable("x-powered-by");
app.set("views", path.join(__dirname, "app_server", "views"));
app.set("view engine", "hbs");
app.set("view options", { layout: "layouts/layout" });
hbs.registerPartials(path.join(__dirname, "app_server", "views", "partials"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/api", (request, response, next) => {
  const origin = process.env.ADMIN_ORIGIN || "http://localhost:4200";
  response.vary("Origin");
  if (request.get("Origin") === origin) {
    response.set("Access-Control-Allow-Origin", origin);
    response.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
});

// Static middleware comes before the routers so public/index.html owns GET /.
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/travel", travelRouter);
app.use("/api", apiRouter);

app.use((_request, _response, next) => {
  next(createError(404));
});

app.use((error, request, response, next) => {
  void next;
  response.locals.message = error.message;
  response.locals.title = "Request status | Travlr Getaways";
  response.locals.status = error.status || 500;
  response.locals.error = request.app.get("env") === "development" ? error : {};
  response.status(error.status || 500);

  if (request.path.startsWith("/api/")) {
    return response.json({
      message: error.status === 400 ? "Invalid JSON request." : "Request failed.",
    });
  }

  if (request.accepts("html")) {
    response.render("error");
    return;
  }

  response.json({ error: error.message });
});

module.exports = app;
