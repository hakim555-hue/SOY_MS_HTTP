const cluster = require('cluster');

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('disconnect', (worker) => {
    console.error(`Worker ${worker.id} disconnected`);
    cluster.fork();
  });

} else {

  const domain = require('domain');

  const debug = require("debug")("index");
  const express = require("express");
  const fileUpload = require("express-fileupload");
  const pg = require("pg");
  const cors = require("cors");

  const pool = new pg.Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    ssl: false
  });

  const ConfServ = require("./config/ConfServ");
  const i18n = require("i18n-2");
  const ControllerLibrary = require("./controller/ControllerLibrary");
  const access = require("./middlewares/accessControl");
  const checkServiceToken = require("./middlewares/checkServiceToken"); // Zero Trust

  const swaggerUI = require("swagger-ui-express");
  const openApiDocumentation = require("./doc/API/openApiDocumentation");

  var app = express();

  // Domain
  app.use((req, res, next) => {
    const d = domain.create();
    d.on('error', (er) => {
      console.error(`error ${er.stack}`);
      try {
        console.error("Killing process in 30s")
        const killtimer = setTimeout(() => {
          process.exit(1);
        }, 30000);
        killtimer.unref();
        server.close();
        cluster.worker.disconnect();
        res.statusCode = 500;
        res.end('Oops, there was a problem!');
      } catch (er2) {
        console.error(`Error sending 500! ${er2.stack}`);
      }
    });
    d.add(req);
    d.add(res);
    d.run(() => { next() });
  })

  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(openApiDocumentation));

  app.use("/css", express.static(__dirname + "/static/css"));
  app.use("/img", express.static(__dirname + "/static/img"));
  app.use("/js", express.static(__dirname + "/static/js"));
  app.use("/files", express.static(__dirname + "/static/files"));

  app.all("*", (req, res, next) => {
    debug("origin " + req.get('origin'))
    next()
  })

  app.all("*", function (req, rep, next) {
    debug(req.method + " " + req.url);
    next();
  });

  app.use(
    cors({
      origin: process.env.REACT_APP_FRONT_URL.slice(0, -1),
      methods: ["POST", "PUT", "GET", "DELETE", "OPTIONS", "HEAD"],
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(fileUpload());

  i18n.expressBind(app, {
    locales: ["en", "fr"],
    defaultLocale: "en",
    directory: "./locale",
    extension: ".json"
  });

  app.use(function (req, res, next) {
    req.i18n.setLocale(req.headers["content-language"]);
    next();
  });

  debug("Booting MS-OTHER part");

  app.use(checkServiceToken);

  app.use(require("./routes/errors"));

  app.use(require("./routes/userRoutes"));

  app.use(require("./routes/email"));

  app.use(require("./routes/exercises"));

  app.use(require("./routes/admin"));

  app.get("/lib/getPlagePythonLib", function (req, res) {
    ControllerLibrary.getPlageLibPy(req, res);
  });

  app.use(require("./routes/help"));

  app.use(require("./routes/plageSession"));

  app.use(require("./routes/profile"));

  app.use(require("./routes/sequence"));

  app.use(require("./routes/skills"));

  app.use(require('./routes/lang'))

  app.use(require('./routes/feedback'))

  app.use(require('./routes/thanks'))

  app.get("/noCookies", function (req, res) {
    res.render("common/noCookies.ejs");
  });

  app.listen(process.env.MS_PORT || 5001, function () {
    console.log("ICWS 2024 App listening on port " + (process.env.MS_PORT || 5001));
  });
}