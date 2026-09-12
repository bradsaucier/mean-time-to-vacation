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

function assertDocument(html) {
  for (const element of ["html", "head", "body"]) {
    assert.equal((html.match(new RegExp("<" + element + "(?:\\s|>)", "g")) || []).length, 1);
    assert.equal((html.match(new RegExp("</" + element + ">", "g")) || []).length, 1);
  }
  assert.match(html, /^<!doctype html>/i);
  assert.doesNotMatch(html, /\{\{/);
}

test("both Travel URLs render one complete document with partials and controller metadata", async () => {
  for (const url of ["/travel", "/travel/"]) {
    const response = await request(app).get(url).expect(200).expect("Content-Type", /html/);
    assertDocument(response.text);
    assert.match(response.text, /<title>Travel \| Travlr Getaways<\/title>/);
    for (const reef of ["Gale Reef", "Dawson's Reef", "Claire's Reef"]) {
      assert.ok(response.text.includes(reef));
    }
    assert.equal((response.text.match(/class="site-header"/g) || []).length, 1);
    assert.equal((response.text.match(/class="site-footer"/g) || []).length, 1);
    assert.equal((response.text.match(/aria-current="page"/g) || []).length, 1);
    assert.match(response.text, /href="\/travel"\s+aria-current="page"/);
  }
});

test("Travel view interpolates and escapes supplied data and honors its navigation flag", async () => {
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

test("every local link and asset in rendered Travel resolves at either URL", async () => {
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

test("error views retain their document layout and status in production", async () => {
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
