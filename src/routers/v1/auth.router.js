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

router.post(
  "/register",
  upload.array("avatars"),
  validate(registerValidation),
  async (req, res) => {
    try {
      const user = await register(req.body, req.files);
      res.status(201).json(user);
    } catch (error) {
      console.error(error);
      res.status(error.status || 400).json({ error: error.message });
    }
  }
);

router.post("/login", validate(loginValidation), async (req, res) => {
  try {
    const token = await login(req.body);
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(error.status || 400).json({ error: error.message });
  }
});

router.post("/logout", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.user.sessionId;

  try {
    await logout(userId, sessionId);
    res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Failed to logout." });
  }
});

router.get("/check-token", authenticateToken, (req, res) => {
  res.status(200).json({ message: "Token is valid." });
});

module.exports = router;
