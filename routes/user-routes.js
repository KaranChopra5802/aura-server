const nodemailer = require("nodemailer");

const { User } = require("../models/user-model");
const { createHmac, randomBytes } = require("crypto");
const { createTokenforUser } = require("../services/authentication-service");

const registerUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      res.status(409).send("Email already exists");
    } else {
      const user = await User.create(req.body);

      const random = sendEmailVerification(email);
      await User.updateOne({ email }, { $set: { OTP: random } });
      res.send(user);
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (user.OTP == otp) {
      await User.updateOne({ email }, { isEmailVerified: true });
      res.status(200).send(user);
    } else {
      res.status(403).send("Invalid OTP");
    }
  } catch (e) {
    res.status(404).send(e);
  }
};

const resendEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).send("An error occurred");
    } else {
      const random = sendEmailVerification(email);
      await User.updateOne({ email }, { $set: { OTP: random } });
      res.send(user);
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      if (user.isEmailVerified == true) {
        const tempPass = sendForgotPassword(email);

        const salt = user.salt;
        const hashedPassword = createHmac("sha256", salt)
          .update(tempPass)
          .digest("hex");
        await User.updateOne({ email }, { password: hashedPassword });
        res.status(200).send(user);
      } else {
        res.status(403).send("Invalid email");
      }
    } else {
      console.log("0000")
      res.status(404).send("No user found");
    }
  } catch (e) {
    console.log("1111")
    res.status(500).send(e);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      console.log(user);

      const salt = user.salt;
      const hashedPassword = createHmac("sha256", salt)
        .update(password)
        .digest("hex");
      if (hashedPassword == user.password) {
        const token = createTokenforUser(user);

        return res.cookie("token", token).send({ token });
      } else {
        res.status(403).send("Invalid username or password");
      }
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};
const sendEmailVerification = (email) => {
  var random = Math.random() * 1000000;
  random = random.toFixed(0);

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.OTP_VERIFICATION_MAIL,
      pass: process.env.OTP_VERIFICATION_PASS,
    },
  });

  var mailOptions = {
    from: process.env.OTP_VERIFICATION_MAIL,
    to: email,
    subject: "Your OTP for email Verification",
    text: "Your OTP is " + random + " !",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  return random;
};

const sendForgotPassword = (email) => {
  var random = Math.random() * 1000000;
  random = random.toFixed(0);

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.OTP_VERIFICATION_MAIL,
      pass: process.env.OTP_VERIFICATION_PASS,
    },
  });

  var mailOptions = {
    from: process.env.OTP_VERIFICATION_MAIL,
    to: email,
    subject: "Your temporary password for Aura Social",
    text:
      "Your temporary password is " +
      random +
      ". Please change it as soon as possible.",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  return random;
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resendEmail,
};
