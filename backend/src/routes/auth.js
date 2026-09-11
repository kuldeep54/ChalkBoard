const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Stricter limiter for credential / email endpoints to slow brute force.
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
});

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters")
      .matches(/^[a-zA-Z][a-zA-Z\s.'-]*$/)
      .withMessage("Name can only contain letters, spaces, dots, apostrophes and hyphens"),
    body("email")
      .isEmail()
      .withMessage("Please include a valid email")
      .custom((value) => {
        const local = value.split("@")[0];
        if (!/[a-zA-Z]/.test(local)) {
          throw new Error("Email must contain at least one letter");
        }
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  register
);

router.post(
  "/login",
  strictLimiter,
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  login
);

router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", protect, getMe);

router.post(
  "/verify-email",
  [
    body("token").optional().notEmpty(),
    body("code").optional().isLength({ min: 6, max: 6 }).withMessage("Invalid verification code"),
    (req, res, next) => {
      if (!req.body.token && !req.body.code) {
        return res
          .status(400)
          .json({ success: false, message: "Verification code is required" });
      }
      next();
    },
  ],
  verifyEmail
);

router.post("/resend-verification", strictLimiter, resendVerification);

router.post("/forgot-password", strictLimiter, forgotPassword);

router.post(
  "/reset-password",
  [
    body("token").optional().notEmpty(),
    body("code").optional().isLength({ min: 6, max: 6 }).withMessage("Invalid reset code"),
    (req, res, next) => {
      if (!req.body.token && !req.body.code) {
        return res
          .status(400)
          .json({ success: false, message: "Reset code is required" });
      }
      next();
    },
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  resetPassword
);

module.exports = router;