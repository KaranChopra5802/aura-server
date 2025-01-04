const { validateToken } = require("../services/authentication-service");

const secret = "karA||123098";

function checkForAuthenticationToken() {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    console.log(token)

    if (!token)
      return res.status(401).send({ error: "Authentication Required" });

    try {
      const payload = validateToken(token);
      console.log(payload);
      return next();
    } catch (error) {
      res.status(403).send({ error: "Invalid token" });
    }
  };
}

module.exports = {checkForAuthenticationToken}
