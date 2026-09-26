"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const Trip = require("../app_server/models/travlr");

const trips = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "trips.json"), "utf8"));

test("Trip model targets the trips collection and validates every seed record", async () => {
  assert.equal(Trip.collection.collectionName, "trips");

  for (const record of trips) {
    const trip = new Trip(record);
    await trip.validate();
    assert.ok(trip.start instanceof Date);
  }
});

test("Trip schema rejects missing, malformed, and unknown values", async () => {
  const valid = trips[0];

  const rejectsField = async (changes, field) => {
    await assert.rejects(new Trip({ ...valid, ...changes }).validate(), (error) =>
      Boolean(error.errors?.[field]),
    );
  };

  await rejectsField({ code: undefined }, "code");
  await rejectsField({ name: "   " }, "name");
  await rejectsField({ start: "not-a-date" }, "start");
  await rejectsField({ perPerson: "12.5" }, "perPerson");
  await rejectsField({ level: "Expert" }, "level");
  await rejectsField({ image: "../secret.jpg" }, "image");

  assert.throws(() => new Trip({ ...valid, perperson: "1.00" }), /strict mode/);
});

test("Trip schema defines the required code and name indexes", () => {
  const indexes = Trip.schema.indexes();
  assert.ok(indexes.some(([fields, options]) => fields.code === 1 && options.unique === true));
  assert.ok(indexes.some(([fields]) => fields.name === 1));
});
