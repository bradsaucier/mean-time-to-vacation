"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const request = require("supertest");
const { spawnSync } = require("node:child_process");
const { escapeExpression } = require("hbs").handlebars;

const app = require("../app");
const Trip = require("../app_api/models/travlr");
const trips = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "trips.json"), "utf8"));
const DISPLAY_FIELDS = [
  "name",
  "image",
  "imageAlt",
  "eyebrow",
  "description",
  "bestFor",
  "level",
  "water",
  "fieldNote",
];
const COURSE_FIELDS = [
  "code",
  "name",
  "length",
  "start",
  "resort",
  "perPerson",
  "image",
  "description",
];

const publicDirectory = path.join(__dirname, "..", "public");
const pages = ["index.html", "rooms.html", "meals.html", "news.html", "about.html", "contact.html"];

function stubTripsFetch(context, records = trips, status = 200) {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json(records, { status, headers: { "Content-Type": "application/json" } }),
  );
}

test("GET / serves the static Travlr home page", async () => {
  const response = await request(app).get("/").expect(200);

  assert.match(response.headers["content-type"], /^text\/html/);
  assert.match(response.text, /Leave the schedule\. Keep the story\./);
  assert.equal(response.headers["x-powered-by"], undefined);
});

test("all static customer pages are available through Express", async (context) => {
  for (const page of pages) {
    await context.test(page, async () => {
      const response = await request(app)
        .get("/" + page)
        .expect(200);
      assert.match(response.headers["content-type"], /^text\/html/);
      assert.match(response.text, /Travlr Getaways/);
    });
  }
});

test("every local HTML link resolves to a supplied page", () => {
  const knownPages = new Set(pages);

  for (const page of pages) {
    const html = fs.readFileSync(path.join(publicDirectory, page), "utf8");
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);

    for (const link of links) {
      if (link.endsWith(".html")) {
        assert.ok(knownPages.has(link), page + " links to missing page " + link);
      }
    }
  }
});

test("every local image and stylesheet reference is served", async (context) => {
  const assetReferences = new Set();

  for (const page of pages) {
    const html = fs.readFileSync(path.join(publicDirectory, page), "utf8");
    const references = [...html.matchAll(/(?:href|src)="((?:css|images)\/[^"#?]+)"/g)];
    references.forEach((match) => assetReferences.add(match[1]));
  }

  for (const asset of [...assetReferences].sort()) {
    await context.test(asset, async () => {
      const response = await request(app)
        .get("/" + asset)
        .expect(200);
      assert.ok(response.headers["content-type"]);
    });
  }
});

test("the health endpoint reports a healthy Express process", async () => {
  const response = await request(app).get("/health").expect(200);

  assert.deepEqual(response.body, { status: "ok", service: "travlr-getaways" });
});

test("unknown browser routes return a rendered 404 page", async () => {
  const response = await request(app).get("/lost-luggage").set("Accept", "text/html").expect(404);

  assert.match(response.text, /Not Found/);
});

function assertDocument(html) {
  for (const element of ["html", "head", "body"]) {
    assert.equal((html.match(new RegExp("<" + element + "(?:\\s|>)", "g")) || []).length, 1);
    assert.equal((html.match(new RegExp("</" + element + ">", "g")) || []).length, 1);
  }
  assert.match(html, /^<!doctype html>/i);
  assert.doesNotMatch(html, /\{\{/);
}

test("/travel and /travel/ render the full page", async (context) => {
  stubTripsFetch(context);
  for (const url of ["/travel", "/travel/"]) {
    const response = await request(app).get(url).expect(200).expect("Content-Type", /html/);
    assertDocument(response.text);
    assert.match(response.text, /<title>Travel \| Travlr Getaways<\/title>/);
    for (const trip of trips) {
      assert.ok(response.text.includes(escapeExpression(trip.name)));
    }
    assert.equal((response.text.match(/class="site-header"/g) || []).length, 1);
    assert.equal((response.text.match(/class="site-footer"/g) || []).length, 1);
    assert.equal((response.text.match(/aria-current="page"/g) || []).length, 1);
    assert.match(response.text, /href="\/travel"\s+aria-current="page"/);
  }
});

test("renders one card per trip with every display field", async (context) => {
  stubTripsFetch(context);
  const response = await request(app).get("/travel").expect(200);
  const cards = [...response.text.matchAll(/<li class="listing-card">([\s\S]*?)<\/li>/g)];
  assert.equal(cards.length, trips.length);
  assert.ok(trips.length > 0);
  for (const [index, trip] of trips.entries()) {
    assert.ok(trip.description.trim(), "Description must not be blank");
    for (const field of DISPLAY_FIELDS) {
      const value = trip[field];
      assert.equal(typeof value, "string", field + " must contain text");
      assert.ok(value.trim(), field + " cannot be blank");
      assert.ok(cards[index][1].includes(escapeExpression(value)), field + " missing from card");
    }
  }
});

test("trips.json has four valid records", () => {
  assert.equal(trips.length, 4);
  const codes = new Set();

  for (const trip of trips) {
    for (const field of COURSE_FIELDS) {
      assert.equal(typeof trip[field], "string", field + " must contain text");
      assert.ok(trip[field].trim(), field + " cannot be blank");
    }
    assert.match(trip.code, /^[A-Z]{4}\d{6}$/);
    assert.ok(!codes.has(trip.code), "Trip codes must be unique");
    codes.add(trip.code);
    assert.ok(Number.isFinite(Date.parse(trip.start)), "Start must be an ISO date");
    assert.ok(trip.start.endsWith("Z"), "Start must identify UTC");
    assert.ok(trip.description.trim(), "Description must not be blank");
  }
});

test("travel controller passes the API collection to the HBS view", async (context) => {
  stubTripsFetch(context);
  let rendered = false;
  await require("../app_server/controllers/travel").travel(
    {},
    {
      render(view, locals) {
        rendered = true;
        assert.equal(view, "travel");
        assert.deepEqual(locals.trips, trips);
        assert.equal(locals.layout, false);
      },
    },
  );
  assert.equal(rendered, true);
});

function renderTrips(records) {
  return new Promise((resolve, reject) => {
    app.render("travel", { trips: records, layout: false }, (error, html) => {
      if (error) reject(error);
      else resolve(html);
    });
  });
}

test("the template renders arbitrary trip collections without hard-coded cards", async () => {
  const fixture = {
    ...trips[0],
    name: "Test Lagoon",
    description: "Test Lagoon proves the view follows its input.",
    fieldNote: "Fixture content supplied only by this test.",
  };
  const html = await renderTrips([fixture]);
  assert.equal((html.match(/class="listing-card"/g) || []).length, 1);
  assert.ok(html.includes(fixture.description));
  assert.ok(html.includes(fixture.fieldNote));
  for (const trip of trips) assert.ok(!html.includes(escapeExpression(trip.name)));

  const extended = await renderTrips([...trips, fixture]);
  assert.equal((extended.match(/class="listing-card"/g) || []).length, trips.length + 1);
  assert.ok(extended.includes(fixture.description));
});

test("empty trip data renders a useful message instead of leftover static cards", async () => {
  const html = await renderTrips([]);
  assertDocument(html);
  assert.match(html, /No trips are currently available/);
  assert.doesNotMatch(html, /class="listing-card"/);
});

test("trip text and image attributes use escaped HBS interpolation", async () => {
  const hostile = '<script>alert("trip")</script> & reef';
  const fixture = Object.fromEntries(DISPLAY_FIELDS.map((key) => [key, hostile]));
  const html = await renderTrips([fixture]);
  assert.ok(html.includes(escapeExpression(hostile)));
  assert.ok(html.includes('alt="' + escapeExpression(hostile) + '"'));
  assert.ok(html.includes('src="/images/' + escapeExpression(hostile) + '"'));
  assert.doesNotMatch(html, /<script>/);
});

test("the HBS loop replaces static trip names and descriptions", () => {
  const template = fs.readFileSync(
    path.join(__dirname, "..", "app_server", "views", "travel.hbs"),
    "utf8",
  );
  assert.ok(template.includes("{{#each trips}}"));
  assert.ok(template.includes("{{/each}}"));
  for (const trip of trips) {
    assert.ok(!template.includes(trip.name));
    assert.ok(!template.includes(trip.description));
  }
});

test("Travel works when started from another directory", () => {
  const applicationPath = path.join(__dirname, "..", "app.js");
  const supertestPath = require.resolve("supertest");
  const child = spawnSync(
    process.execPath,
    [
      "-e",
      `
    const trips = ${JSON.stringify(trips)};
    global.fetch = async () => Response.json(trips);
    const app = require(${JSON.stringify(applicationPath)});
    const request = require(${JSON.stringify(supertestPath)});
    request(app).get('/travel').expect(200).then(response => {
      process.stdout.write(response.text);
    }).catch(error => { console.error(error); process.exitCode = 1; });
  `,
    ],
    { cwd: path.dirname(path.dirname(__dirname)), encoding: "utf8", timeout: 15000 },
  );
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
  for (const trip of trips) assert.ok(child.stdout.includes(escapeExpression(trip.description)));
});

test("escapes metadata and respects isTravel", async () => {
  const html = await new Promise((resolve, reject) => {
    app.render(
      "travel",
      {
        title: "<script>test</script>",
        description: "A & B",
        isTravel: false,
        layout: false,
      },
      (error, output) => (error ? reject(error) : resolve(output)),
    );
  });
  assertDocument(html);
  assert.match(html, /<title>&lt;script&gt;test&lt;\/script&gt;<\/title>/);
  assert.match(html, /content="A &amp; B"/);
  assert.doesNotMatch(html, /aria-current="page"/);
});

test("Travel page links and assets resolve", async (context) => {
  stubTripsFetch(context);
  context.mock.method(Trip, "findOne", ({ code }) => ({
    exec: async () => trips.find((trip) => trip.code === code) || null,
  }));
  for (const url of ["/travel", "/travel/"]) {
    const response = await request(app).get(url).expect(200);
    const references = new Set(
      [...response.text.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]),
    );
    for (const reference of references) {
      if (reference.startsWith("#")) {
        assert.ok(response.text.includes('id="' + reference.slice(1) + '"'));
        continue;
      }
      assert.ok(reference.startsWith("/"), reference + " must be root-relative");
      const resolved = new URL(reference, "http://localhost" + url);
      await request(app).get(resolved.pathname).expect(200);
    }
  }
});

test("all static customer pages link to the rendered Travel route", () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(publicDirectory, page), "utf8");
    assert.match(html, /href="\/travel"/);
    assert.doesNotMatch(html, /href="travel\.html"/);
  }
});

test("GET /api/trips returns the trip collection", async (context) => {
  context.mock.method(Trip, "find", () => ({
    sort() {
      return this;
    },
    exec: async () => trips,
  }));

  const response = await request(app).get("/api/trips").expect(200).expect("Content-Type", /json/);
  assert.deepEqual(response.body, trips);
});

test("GET /api/trips/:tripCode returns one trip or a JSON 404", async (context) => {
  context.mock.method(Trip, "findOne", ({ code }) => ({
    exec: async () => trips.find((trip) => trip.code === code) || null,
  }));

  const found = await request(app)
    .get("/api/trips/" + trips[0].code)
    .expect(200)
    .expect("Content-Type", /json/);
  assert.equal(found.body.code, trips[0].code);

  const missing = await request(app)
    .get("/api/trips/ZZZZ999999")
    .expect(404)
    .expect("Content-Type", /json/);
  assert.deepEqual(missing.body, { message: "Trip ZZZZ999999 was not found." });
});

test("GET /api/trips/:tripCode rejects malformed trip codes", async () => {
  const response = await request(app)
    .get("/api/trips/abc")
    .expect(400)
    .expect("Content-Type", /json/);
  assert.deepEqual(response.body, { message: "Trip code must be four letters and six digits." });
});

test("unknown API routes return JSON", async () => {
  const response = await request(app)
    .get("/api/trip")
    .set("Accept", "*/*")
    .expect(404)
    .expect("Content-Type", /json/);
  assert.deepEqual(response.body, { message: "API route not found." });
});

test("main router delegates to its controller and uses the relocated layout", async () => {
  const express = require("express");
  const fallback = express();
  fallback.set("views", app.get("views"));
  fallback.set("view engine", "hbs");
  fallback.set("view options", app.get("view options"));
  fallback.use("/", require("../app_server/routes/index"));
  const response = await request(fallback).get("/").expect(200);
  assertDocument(response.text);
  assert.match(response.text, /Express fallback view/);
  assert.match(response.text, /href="\/css\/style.css"/);
});

test("error handling returns the expected HTML and JSON responses", async () => {
  const previous = app.get("env");
  app.set("env", "production");
  try {
    const response = await request(app).get("/lost-luggage").set("Accept", "text/html").expect(404);
    assertDocument(response.text);
    assert.match(response.text, /Status code: 404/);
    assert.match(response.text, /href="\/css\/style.css"/);
  } finally {
    app.set("env", previous);
  }
  await request(app).get("/travel/travel").expect(404);
  await request(app).get("/users").expect(501);
  const response = await request(app).get("/missing").set("Accept", "application/json").expect(404);
  assert.deepEqual(response.body, { error: "Not Found" });
});
