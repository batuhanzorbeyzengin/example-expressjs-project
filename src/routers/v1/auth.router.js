const express = require("express");
const router = express.Router();
const { register, login, logout } = require("../../services/auth");
const validate = require("../../middlewares/validation.middleware");
const {
  registerValidation,
  loginValidation,
} = require("../../validators/auth.validator");
const upload = require("../../middlewares/upload.middleware");
const authenticateToken = require("../../middlewares/auth.middleware");
const handleRequest = require("../../lib/requestHandler");

router.post(
  "/register",
  upload.array("avatars"),
  validate(registerValidation),
  handleRequest(async (req) => await register(req.body, req.files))
);

router.post(
  "/login",
  validate(loginValidation),
  handleRequest(async (req) => ({ token: await login(req.body) }))
);

router.post(
  "/logout",
  authenticateToken,
  handleRequest(async (req) => {
    await logout(req.user.id, req.user.sessionId);
    return { message: "Successfully logged out." };
  })
);

router.get("/check-token", authenticateToken, (req, res) =>
  res.status(200).json({ message: "Token is valid." })
);

module.exports = router;
