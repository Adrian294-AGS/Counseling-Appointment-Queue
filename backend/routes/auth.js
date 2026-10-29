const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const UserModel = require("../models/user");
const { verifyPassword } = require("../utils/crypto");
const { authenticate } = require("../middleware/auth");
const logger = require("../middleware/logger");
const config = require("../config/app");

const router = express.Router();

router.post(
  "/login",
  [
    body("username").trim().isLength({ min: 3, max: 50 }),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = await UserModel.findByUsername(username);

      if (!user) {
        logger.warn("Login failed: User not found", { username });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        logger.warn("Login failed: Invalid password", { username });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn },
      );

      logger.info("User logged in", { userId: user.id, role: user.role });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          studentId: user.student_id,
        },
      });
    } catch (err) {
      logger.error("Login error", { error: err.message });
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      studentId: user.student_id,
    });
  } catch (err) {
    logger.error("Get me error", { error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
