const express = require("express");
const { loginUser, registerUser, verifyEmail, forgotPassword,resendEmail } = require("../routes/user-routes");

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/resend-email", resendEmail);

module.exports = userRouter
