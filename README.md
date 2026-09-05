# Travlr Getaways

CS 465 Module One customer-facing web application by Bradley D. Saucier.

## What this submission demonstrates

Travlr Getaways is a seven-page static website delivered by a Node.js and Express server. The
project uses the directory structure introduced in the Module One Full Stack Guide, including
the generated Handlebars fallback views and an Express `public` directory for every customer
page, stylesheet, and image.

The browser receives the website through `http://localhost:3000`, not from a local `file://`
path. The static middleware is registered before the generated routers so `public/index.html`
responds at the root URL.

## Project structure

```text
app.js                 Express middleware and error handling
bin/www                HTTP server entry point
public/                Seven static pages and all client assets
public/css/style.css   Responsive presentation layer
public/images/         Course-supplied Travlr image assets
routes/                Generated-style Express routers
views/                 Handlebars fallback and error views
test/app.test.js       Automated HTTP and reference validation
```

## Module boundary

This baseline intentionally contains no database, API, authentication, Angular application, or
dynamic trip data. Those capabilities belong to later modules. The contact form demonstrates
the customer interface only and does not store or transmit information.