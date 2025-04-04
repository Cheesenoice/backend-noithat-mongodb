const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
require('dotenv').config();

passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.BACKEND_URL, 
        scope: ['profile', 'email']
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
      }
    )
  );
  passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: process.env.CALLBACK_URL,
          profileFields: ["id", "displayName", "email", "picture"],
        },
      (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
      }
    )
  );


passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });


module.exports = passport

// passporrt hỗ trợ rất mạnh về các loại đăng nhập bằng google facebook và trên nhiều loại khác nhau 
// + là thằng chung gian hỗ trợ giao tiếp giữa api và google 
// session giúp khi lưu 1 accesstoken thì nó sẽ lưu lại giúp quá trình khi request sẽ trở nhên nhanh hơn 