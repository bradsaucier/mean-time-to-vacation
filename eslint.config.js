"use strict";

const eslint = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: ["coverage/", "node_modules/"],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      eqeqeq: "error",
      "no-console": "off",
    },
  },
];
