"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const request = require("supertest");

const app = require("../src/app");

test("GET / reports the Module One baseline", async () => {
  const response = await request(app).get("/").expect(200);

  assert.deepEqual(response.body, {
    name: "Travlr Getaways",
    module: 1,
    status: "boarding",
  });
  assert.equal(response.headers["x-powered-by"], undefined);
});

test("GET /health reports a healthy process", async () => {
  const response = await request(app).get("/health").expect(200);

  assert.deepEqual(response.body, { status: "ok" });
});

test("unknown routes return a JSON 404", async () => {
  const response = await request(app).get("/lost-luggage").expect(404);

  assert.deepEqual(response.body, { error: "Route not found" });
});
