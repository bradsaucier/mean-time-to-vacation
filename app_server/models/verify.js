"use strict";

const assert = require("node:assert/strict");

const db = require("./db");
const Trip = require("./travlr");

async function verifyTrips() {
  await db.connect();
  const trips = await Trip.find().sort({ start: 1 });

  assert.equal(trips.length, 3, "The trips collection must contain three records");

  for (const trip of trips) {
    assert.ok(trip.start instanceof Date, `${trip.code} must store start as a Date`);
    for (const field of ["code", "name", "length", "resort", "perPerson", "image", "description"]) {
      assert.equal(typeof trip[field], "string", `${trip.code}.${field} must be a string`);
      assert.ok(trip[field].trim(), `${trip.code}.${field} cannot be blank`);
    }
  }

  const json = trips.map((trip) => trip.toJSON({ versionKey: false }));
  console.log(JSON.stringify(json, null, 2));
  return json;
}

async function main() {
  try {
    await verifyTrips();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await db.close("verification complete");
  }
}

if (require.main === module) void main();

module.exports = { verifyTrips };
