const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI("AIzaSyAnzVy6o5uUQ5ZK7xyoaWiw_yK5xelOH0w"); // Thay YOUR_API_KEY = API key của bạn

module.exports = genAI;
