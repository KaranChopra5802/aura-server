const JWT = require("jsonwebtoken");

const secret = "karA||123098";

function createTokenforUser(user) {
  const payload = {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const token = JWT.sign(payload, secret);

  return token;
}
function validateToken(token) {
  const payload = JWT.verify(token, secret);

  return payload;
}

module.exports = {
  createTokenforUser,
  validateToken,
};
