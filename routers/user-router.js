const express = require("express");
const { loginUser, registerUser } = require("../routes/user-routes");

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

module.exports = userRouter
