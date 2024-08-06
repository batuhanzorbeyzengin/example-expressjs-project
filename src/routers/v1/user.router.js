const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validation.middleware");
const { rateValidation } = require("../../validators/user.validator");
const { getUsersByProximity, rate } = require("../../services/user");
const handleRequest = require("../../lib/requestHandler");

router.get(
  "/nearby-users",
  authenticateToken,
  handleRequest(async (req) => {
    const { page = 1, size = 10 } = req.query;
    console.log(
      `Received request to fetch nearby users. Page: ${page}, Size: ${size}`
    );
    const users = await getUsersByProximity(
      req.user.id,
      parseInt(page),
      parseInt(size)
    );
    console.log("Successfully fetched users:", users);
    return users;
  })
);

router.post(
  "/:targetId/rate",
  authenticateToken,
  validate(rateValidation),
  handleRequest(async (req) => {
    const result = await rate(req.user.id, req.params.targetId, req.body.type);
    return {
      message: `Successfully ${
        req.body.type === "LIKE" ? "liked" : "disliked"
      } user ${req.params.targetId}.`,
      result,
    };
  })
);

module.exports = router;
