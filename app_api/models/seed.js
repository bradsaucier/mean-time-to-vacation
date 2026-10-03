"use strict";

const fs = require("node:fs");
const path = require("node:path");

const db = require("./db");
const Trip = require("./travlr");

const defaultSourcePath = path.join(__dirname, "..", "..", "data", "trips.json");

function readSeedData(sourcePath) {
  let records;

  try {
    records = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Malformed JSON in ${sourcePath}: ${error.message}`, { cause: error });
    }
    throw error;
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("Seed data must be a non-empty JSON array");
  }

  return records;
}

async function validateRecords(records) {
  const errors = [];
  const codes = new Map();
  const documents = [];

  for (const [index, record] of records.entries()) {
    try {
      const document = new Trip(record);
      await document.validate();

      const code = document.code;
      if (codes.has(code)) {
        errors.push(`record ${index + 1} (${code}): duplicates record ${codes.get(code)}`);
        continue;
      }

      codes.set(code, index + 1);
      documents.push(document.toObject({ versionKey: false }));
    } catch (error) {
      if (error.errors) {
        for (const fieldError of Object.values(error.errors)) {
          errors.push(`record ${index + 1} (${record.code || "no code"}): ${fieldError.message}`);
        }
      } else {
        errors.push(`record ${index + 1} (${record.code || "no code"}): ${error.message}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Seed validation failed:\n${errors.join("\n")}`);
  }

  return documents;
}

async function seedTrips({ sourcePath = defaultSourcePath } = {}) {
  // Validate first so bad seed data cannot clear the collection.
  const documents = await validateRecords(readSeedData(sourcePath));

  await db.connect();
  // Clear old data before building the unique code index.
  await Trip.deleteMany({});
  await Trip.syncIndexes();
  await Trip.insertMany(documents);

  const stored = await Trip.find().sort({ start: 1 }).lean();
  if (stored.length !== documents.length) {
    throw new Error(`Expected ${documents.length} trips after seeding but found ${stored.length}`);
  }

  for (const trip of stored) {
    console.log(`${trip.code}: ${trip.name} starts ${trip.start.toISOString()}`);
  }
  console.log(`Seeded ${stored.length} trips into ${db.dbName}.trips`);

  return stored;
}

async function main() {
  try {
    await seedTrips();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await db.close("seed complete");
  }
}

if (require.main === module) void main();

module.exports = { seedTrips, readSeedData, validateRecords };
