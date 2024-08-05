const express = require("express");
const router = express.Router();
const authRouter = require("./auth.router");
const userRouter = require("./user.router");
const notificationRouter = require("./notification.router");

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/notifications", notificationRouter);

module.exports = router;
