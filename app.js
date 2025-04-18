const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const protectedRouter = require("./routers/protected-router");
const userRouter = require("./routers/user-router");
const { json, urlencoded } = require("express");
const connect = mongoose.connect;
const admin = require('firebase-admin');

// const serviceAccount = require('./services/serviceAccountKey.json');


const {
  checkForAuthenticationToken,
} = require("./middlewares/authentication-middleware");

const { loggingMiddleware } = require("./middlewares/logging-middleware");
const { initializeSocket, getServer } = require("./services/chat-service");

const app = express();

initializeSocket(app);
app.use(json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(urlencoded({ extended: false }));

const PORT = process.env.PORT || 8000;

connect(process.env.MONGO_URL || "mongodb://localhost:27017/aura").then(() => {
  console.log("Mongo Connected!!");
})

const serviceAccountKey = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  databaseURL: 'https://aura-social.firebaseio.com',
});

app.get("/", (req, res) => {
  res.status(200).send("Working")
})

app.use(
  "/api/",
  loggingMiddleware(),
  checkForAuthenticationToken(),
  protectedRouter
);
app.use("/user/", loggingMiddleware(), userRouter);

const server = getServer();

server.listen(PORT, () => {
  console.log(`Aura server started at PORT : ${PORT}`);
});

// module.exports = server
