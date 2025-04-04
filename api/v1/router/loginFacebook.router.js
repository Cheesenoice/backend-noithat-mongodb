const express = require("express");
const router = express.Router();
const passport = require("../../../config/passport");
const authController = require("../controller/loginFacebook.controller");

// login with facebook
router.get("/login/facebook", passport.authenticate("facebook", { profileFields:["id", "displayName", "email", "picture"] }));

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  authController.callback
);

router.get("/auth/facebook/profile", authController.profile);

module.exports = router;