"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const request = require("supertest");
const jwt = require("jsonwebtoken");
process.env.JWT_SECRET = "module-seven-automated-test-secret";
const app = require("../app");
const User = require("../app_api/models/user");
const Trip = require("../app_api/models/travlr");
test("password hashing uses unique salts, validates passwords, and JWT excludes password material", () => {
  const a = new User({ name: "Test Admin", email: "admin@example.test" }),
    b = new User({ name: "Other", email: "other@example.test" });
  a.setPassword("MockPassw0rd!");
  b.setPassword("MockPassw0rd!");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.ok(a.validPassword("MockPassw0rd!"));
  assert.equal(a.validPassword("wrong"), false);
  const claims = jwt.verify(a.generateJWT(), process.env.JWT_SECRET);
  assert.equal(claims.exp - claims.iat, 3600);
  assert.equal(claims.email, "admin@example.test");
  assert.equal(claims.hash, undefined);
  assert.equal(claims.salt, undefined);
});
test("registration, duplicate handling, login success and bad credentials", async (ctx) => {
  let saved;
  ctx.mock.method(User.prototype, "save", async function () {
    if (saved) {
      const e = new Error("duplicate");
      e.code = 11000;
      throw e;
    }
    saved = this;
    return this;
  });
  ctx.mock.method(User, "findOne", ({ email }) => ({
    exec: async () => (saved?.email === email ? saved : null),
  }));
  const body = { name: "Test Admin", email: "Admin@Example.test", password: "MockPassw0rd!" };
  const registered = await request(app).post("/api/register").send(body).expect(200);
  assert.ok(registered.body.token);
  await request(app).post("/api/register").send(body).expect(409);
  const logged = await request(app)
    .post("/api/login")
    .send({ email: "admin@example.test", password: body.password })
    .expect(200);
  assert.equal(jwt.verify(logged.body.token, process.env.JWT_SECRET).name, body.name);
  await request(app)
    .post("/api/login")
    .send({ email: "admin@example.test", password: "wrong" })
    .expect(401);
  await request(app)
    .post("/api/login")
    .send({ email: "unknown@example.test", password: "wrong" })
    .expect(401);
});
test("authentication rejects missing, blank and non-string credentials", async () => {
  for (const path of ["/api/register", "/api/login"])
    for (const body of [
      undefined,
      {},
      { name: [], email: {}, password: 42 },
      { name: " ", email: " ", password: " " },
    ]) {
      const req = request(app).post(path);
      if (body) req.send(body);
      await req.expect(400);
    }
});
test("every administrative method rejects absent, malformed, tampered, expired and unsigned JWTs before database access", async (ctx) => {
  let writes = 0;
  for (const method of ["create", "findOneAndUpdate", "findOneAndDelete"])
    ctx.mock.method(Trip, method, () => {
      writes++;
      throw Error("Write reached");
    });
  const valid = jwt.sign({ _id: "test" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const parts = valid.split(".");
  parts[2] = (parts[2][0] === "a" ? "b" : "a") + parts[2].slice(1);
  const headers = [
    null,
    "Basic abc",
    "Bearer",
    "Bearer abc extra",
    "Bearer not.a.jwt",
    "Bearer " + parts.join("."),
    "Bearer " + jwt.sign({ _id: "test" }, process.env.JWT_SECRET, { expiresIn: -1 }),
    "Bearer " + jwt.sign({ _id: "test" }, "wrong-secret"),
    "Bearer " + jwt.sign({ _id: "test" }, process.env.JWT_SECRET, { algorithm: "HS384" }),
    "Bearer " + jwt.sign({ _id: "test" }, process.env.JWT_SECRET, { algorithm: "HS512" }),
    "Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJfaWQiOiIxIn0.",
  ];
  for (const method of ["post", "put", "delete"])
    for (const header of headers) {
      const r = request(app)
        [method](method === "post" ? "/api/trips" : "/api/trips/TEST000001")
        .send({});
      if (header) r.set("Authorization", header);
      await r.expect(401);
    }
  assert.equal(writes, 0);
});
test("public reads and Authorization CORS preflight remain available", async (ctx) => {
  ctx.mock.method(Trip, "find", () => ({ sort: () => ({ exec: async () => [] }) }));
  await request(app).get("/api/trips").set("Authorization", "Bearer invalid").expect(200);
  const res = await request(app)
    .options("/api/trips")
    .set("Origin", process.env.ADMIN_ORIGIN || "http://localhost:4200")
    .set("Access-Control-Request-Method", "PUT")
    .set("Access-Control-Request-Headers", "authorization,content-type")
    .expect(204);
  assert.match(res.headers["access-control-allow-headers"], /Authorization/);
});

test("a valid token lets POST, PUT and DELETE reach the trip controller", async (ctx) => {
  const trip = require("../data/trips.json")[0];
  const calls = [];
  ctx.mock.method(Trip, "create", async (input) => {
    calls.push("create");
    return input;
  });
  ctx.mock.method(Trip, "findOneAndUpdate", () => ({
    exec: async () => {
      calls.push("update");
      return trip;
    },
  }));
  ctx.mock.method(Trip, "findOneAndDelete", () => ({
    exec: async () => {
      calls.push("delete");
      return trip;
    },
  }));
  const header = "Bearer " + jwt.sign({ _id: "test" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  await request(app).post("/api/trips").set("Authorization", header).send(trip).expect(201);
  await request(app)
    .put("/api/trips/" + trip.code)
    .set("Authorization", header)
    .send(trip)
    .expect(200);
  await request(app)
    .delete("/api/trips/" + trip.code)
    .set("Authorization", header)
    .expect(204);
  assert.deepEqual(calls, ["create", "update", "delete"]);
});
