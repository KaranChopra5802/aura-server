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
      res.send(user);
    }
  } catch (error) {
    res.status(404).send(error);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password} = req.body;
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

module.exports = { registerUser, loginUser };
