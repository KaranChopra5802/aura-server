const fs = require("fs");

function loggingMiddleware() {
  return (req, res, next) => {
    const now = new Date(Date.now());

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const fileName = `${now.toISOString().split("T")[0]}.log`;

    const logDir = "/tmp";
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const logAdded = `${now.toLocaleString("en-US")} - IP ${ip} Method: ${
      req.method
    } Url: ${req.url} Query Parameters: ${JSON.stringify(
      req.query
    )} Status Code: ${res.statusCode} Status Message: ${
      res.statusMessage ?? "No status message"
    } User-Agent: ${userAgent} Body: ${JSON.stringify(
      req.body
    )} Headers: ${JSON.stringify(req.headers.authorization)}\n\n`;

    fs.appendFile(`/temp/${fileName}`, logAdded, (err) => {
      if (err) throw err;
    });

    next();
  };
}

module.exports = { loggingMiddleware };
