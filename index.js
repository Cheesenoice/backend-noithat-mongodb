const bodyParser = require('body-parser');
const promBundle = require("express-prom-bundle");
const express = require("express");
const cors = require('cors')
const cookieParser = require('cookie-parser')
const session = require('express-session');
const passport = require('./config/passport')
const database = require('./config/connect')
const router = require("./api/v1/router/index.router")
const middleware =  require("./middleware/serverError.middleware")
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

database.connect();

const metricsMiddleware = promBundle({ includeMethod: true });
app.use(metricsMiddleware);

// Cấu hình session
app.use(
    session({
      secret:"String",
      resave: false,
      saveUninitialized: true,
    })
  );

// Khởi tạo Passport
app.use(passport.initialize());
app.use(passport.session());

// Cấu hình các middleware cơ bản
app.use(cookieParser())  // Xử lý cookie
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));     


app.use(bodyParser.json());  // Xử lý JSON request
app.use(bodyParser.urlencoded({ extended: true }));  // Xử lý form data


middleware(app);
router(app)

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});