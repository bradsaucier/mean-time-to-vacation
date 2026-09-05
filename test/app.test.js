"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const request = require("supertest");

const app = require("../app");

const publicDirectory = path.join(__dirname, "..", "public");
const pages = [
  "index.html",
  "travel.html",
  "rooms.html",
  "meals.html",
  "news.html",
  "about.html",
  "contact.html",
];

test("GET / serves the static Travlr home page", async () => {
  const response = await request(app).get("/").expect(200);

  assert.match(response.headers["content-type"], /^text\/html/);
  assert.match(response.text, /Leave the schedule\. Keep the story\./);
  assert.equal(response.headers["x-powered-by"], undefined);
});

test("all seven customer pages are available through Express", async (context) => {
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
