const jwt = require("jsonwebtoken");

const INTER_SERVICE_SECRET = process.env.INTER_SERVICE_SECRET;

module.exports = function checkServiceToken(req, res, next) {
  const token = req.headers["x-service-token"];

  if (!token) {
    return res.status(401).json({
      error: "Accès refusé : token inter-service manquant"
    });
  }

  try {
    const decoded = jwt.verify(token, INTER_SERVICE_SECRET, {
      issuer: "gateway",
      audience: "internal-service"
    });
    req.serviceToken = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: "Token inter-service invalide ou expiré",
      detail: err.message
    });
  }
};