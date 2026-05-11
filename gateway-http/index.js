const express = require("express");
const app = express();
const cors = require('cors');
const httpProxy = require('http-proxy');
const jwt = require("jsonwebtoken");

const INTER_SERVICE_SECRET = process.env.INTER_SERVICE_SECRET;

app.use(
  cors({
    origin: process.env.REACT_APP_FRONT_URL.slice(0, -1),
    methods: ["POST", "PUT", "GET", "DELETE", "OPTIONS", "HEAD"],
    credentials: true
  })
);

var apiProxy = httpProxy.createProxyServer();

function addServiceToken(req) {
  if (!INTER_SERVICE_SECRET) {
    console.error("INTER_SERVICE_SECRET manquant !");
    return;
  }
  const token = jwt.sign(
    { iss: "gateway", aud: "internal-service" },
    INTER_SERVICE_SECRET,
    { expiresIn: "30s" }
  );
  req.headers["x-service-token"] = token;
  console.log("Token généré :", token);
}

app.use("/api/exercise-production", function (req, res) {
  addServiceToken(req);
  apiProxy.web(req, res, {
    target: 'http://ms-exercise:' + process.env.PORT + "/api/exercise-production"
  }, (err) => {});
});

app.use("/api/student-statement", function (req, res) {
  addServiceToken(req);
  apiProxy.web(req, res, {
    target: 'http://ms-exercise:' + process.env.PORT + "/api/student-statement"
  }, (err) => {});
});

app.use("/", function (req, res) {
  addServiceToken(req);
  apiProxy.web(req, res, {
    target: 'http://ms-other:' + process.env.PORT
  }, (err) => {});
});

app.listen(8080, () => {
  console.log('ICWS 2024 App listening on port 8080');
});