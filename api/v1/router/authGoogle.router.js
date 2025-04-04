const express = require("express");
const router = express.Router();
const passport = require("../../../config/passport");
const authController = require("../controller/loginGoogle.controller");
const { connectors } = require("googleapis/build/src/apis/connectors");

// login with google 
router.get('/login/google',  passport.authenticate('google', {scope: ['profile', 'email']}))

router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    authController.callback
  );
router.get('/google/profile', authController.profile)

  
module.exports = router;