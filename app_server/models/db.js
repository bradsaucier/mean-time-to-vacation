"use strict";

const mongoose = require("mongoose");

const host = process.env.DB_HOST || "127.0.0.1";
const dbName = process.env.DB_NAME || "travlr";
const dbURI = `mongodb://${host}/${dbName}`;
const configuredTimeout = Number.parseInt(process.env.DB_TIMEOUT_MS || "5000", 10);
const serverSelectionTimeoutMS =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 5000;

const { connection } = mongoose;

connection.on("connected", () => console.log(`Mongoose connected to ${dbURI}`));
connection.on("reconnected", () => console.log(`Mongoose reconnected to ${dbURI}`));
connection.on("disconnected", () => console.log("Mongoose disconnected"));
connection.on("error", (error) => console.error("Mongoose connection error:", error.message));

const connect = async () => {
  if (connection.readyState === 1) return mongoose;
  if (connection.readyState === 2) return connection.asPromise();
  return mongoose.connect(dbURI, { serverSelectionTimeoutMS });
};

let closing;

const close = (reason = "explicit close") => {
  if (connection.readyState === 0) return Promise.resolve();

  if (!closing) {
    closing = connection
      .close()
      .then(() => console.log(`Mongoose disconnected through ${reason}`))
      .finally(() => {
        closing = undefined;
      });
  }

  return closing;
};

let handlersRegistered = false;
let shutdownStarted = false;

const registerShutdownHandlers = (beforeClose = async () => {}) => {
  if (handlersRegistered) return;
  handlersRegistered = true;

  const shutdown = async (signal, reason) => {
    if (shutdownStarted) return;
    shutdownStarted = true;

    try {
      await beforeClose();
      await close(reason);
      process.exitCode = 0;
    } catch (error) {
      console.error(`Shutdown after ${signal} failed:`, error);
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT", "app termination"));
  process.once("SIGTERM", () => void shutdown("SIGTERM", "app shutdown"));
};

require("./travlr");

module.exports = { mongoose, dbURI, dbName, connect, close, registerShutdownHandlers };
