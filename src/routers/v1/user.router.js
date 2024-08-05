const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validation.middleware");
const { rateValidation } = require("../../validators/user.validator");
const { getUsersByProximity, rate } = require("../../services/user");

router.get("/nearby-users", authenticateToken, async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  console.log(
    `Received request to fetch nearby users. Page: ${page}, Size: ${size}`
  );

  try {
    const users = await getUsersByProximity(
      req.user.id,
      parseInt(page),
      parseInt(size)
    );
    console.log("Successfully fetched users:", users);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching nearby users:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching nearby users" });
  }
});

router.post(
  "/:targetId/rate",
  authenticateToken,
  validate(rateValidation),
  async (req, res) => {
    const userId = req.user.id;
    const targetId = req.params.targetId;
    const { type } = req.body;

    try {
      const result = await rate(userId, targetId, type);

      res.status(200).json({
        message: `Successfully ${
          type === "LIKE" ? "liked" : "disliked"
        } user ${targetId}.`,
        result,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while processing the request." });
    }
  }
);

module.exports = router;
