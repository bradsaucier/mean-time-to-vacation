"use strict";

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");

passport.use(
  // Use the email field as the login username.
  new LocalStrategy({ usernameField: "email" }, async (username, password, done) => {
    try {
      const user = await User.findOne({ email: String(username).trim().toLowerCase() }).exec();
      if (!user || !user.validPassword(password)) {
        return done(null, false, { message: "Incorrect email or password." });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }),
);
