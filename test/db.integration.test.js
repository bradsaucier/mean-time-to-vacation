"use strict";

const assert = require("node:assert/strict");
const { after, test } = require("node:test");

// Never let integration tests reseed the assignment database.
process.env.DB_NAME = "travlr_test";

const db = require("../app_api/models/db");
const { seedTrips } = require("../app_api/models/seed");
const { verifyTrips } = require("../app_api/models/verify");
const Trip = require("../app_api/models/travlr");
const sampleTrips = require("../data/trips.json");

const skipReason =
  process.env.MONGODB_INTEGRATION === "1"
    ? false
    : "set MONGODB_INTEGRATION=1 to run against local MongoDB";

test(
  "seeding twice leaves three trips with Date starts and indexes",
  { skip: skipReason, timeout: 30000 },
  async () => {
    await seedTrips();
    await seedTrips();

    const trips = await Trip.find().sort({ start: 1 }).lean();
    assert.equal(trips.length, 3);
    for (const trip of trips) assert.ok(trip.start instanceof Date);

    const roundTrip = JSON.parse(JSON.stringify(trips));
    for (const trip of roundTrip) assert.ok(Number.isFinite(Date.parse(trip.start)));

    const indexes = await Trip.listIndexes();
    assert.ok(indexes.some((index) => index.key.code === 1 && index.unique === true));
    assert.ok(indexes.some((index) => index.key.name === 1));

    const json = await verifyTrips();
    assert.equal(json.length, 3);
  },
);

test(
  "seed repairs a collection that contains duplicate trip codes",
  { skip: skipReason, timeout: 30000 },
  async () => {
    await db.connect();
    await Trip.init();
    await Trip.collection.drop();
    const duplicateTrips = [...sampleTrips, ...sampleTrips].map((trip) => ({ ...trip }));
    await Trip.collection.insertMany(duplicateTrips);

    await seedTrips();
    assert.equal(await Trip.countDocuments(), 3);
  },
);

after(async () => {
  await db.close("integration test complete");
});
