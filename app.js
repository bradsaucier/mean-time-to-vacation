"use strict";

const createError = require("http-errors");
const express = require("express");
const path = require("node:path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

app.disable("x-powered-by");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static middleware comes before the routers so public/index.html owns GET /.
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.use((_request, _response, next) => {
  next(createError(404));
});

app.use((error, request, response, next) => {
  void next;
  response.locals.message = error.message;
  response.locals.error = request.app.get("env") === "development" ? error : {};
  response.status(error.status || 500);

  if (request.accepts("html")) {
    response.render("error");
    return;
  }

  response.json({ error: error.message });
});

module.exports = app;
