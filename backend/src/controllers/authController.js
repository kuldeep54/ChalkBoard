const crypto = require("crypto");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const { sendMail, buildLink } = require("../utils/mailer");

const ACCESS_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || "15m";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  status: user.userStatus,
});

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

async function sendVerificationEmail(req, user) {
  const token = user.getVerificationToken();
  const code = user.getVerificationCode();
  await user.save({ validateBeforeSave: false });

  const link = buildLink(req, "verify-email", token);
  await sendMail({
    to: user.email,
    subject: "Verify your ChalkBoard email",
    text: `Hi ${user.name},

Thanks for signing up for ChalkBoard. Your verification code is:

  ${code}

Enter this 6-digit code in the app to confirm your email address (valid for 24 hours).

Or open this link on this device instead:

  ${link}

If you didn't create this account, you can ignore this email.`,
  });

  return code;
}

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const user = await User.create({ name, email: email.toLowerCase(), password });
    await sendVerificationEmail(req, user);

    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message:
        "Account created. Check your email for a verification link to activate your account.",
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${minutes} minute(s).`,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
        user.failedLoginAttempts = 0;
      }
      await user.save({ validateBeforeSave: false });
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (user.userStatus === "pending") {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: user.email,
        message: "Please verify your email before signing in.",
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    const accessToken = user.getSignedJwtToken(ACCESS_EXPIRE);
    const refreshToken = user.createRefreshToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Exchange a refresh token for a new access + refresh token
// @route   POST /api/auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required" });
    }

    const user = await User.findOne({ refreshToken: hashToken(refreshToken) });
    if (
      !user ||
      !user.refreshTokenExpire ||
      user.refreshTokenExpire < Date.now() ||
      !user.matchRefreshToken(refreshToken)
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired session" });
    }

    const accessToken = user.getSignedJwtToken(ACCESS_EXPIRE);
    const newRefreshToken = user.createRefreshToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Revoke the refresh token (server-side logout)
// @route   POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.updateOne(
        { refreshToken: hashToken(refreshToken) },
        { $unset: { refreshToken: "", refreshTokenExpire: "" } }
      );
    }
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token, code } = req.body;
    const value = (token || code || "").trim();
    if (!value) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code is required" });
    }

    const user = await User.findOne({
      $or: [
        { verificationToken: hashToken(value), verificationExpire: { $gt: Date.now() } },
        { verificationCode: hashToken(value), verificationExpire: { $gt: Date.now() } },
      ],
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired verification code" });
    }

    user.userStatus = "active";
    user.verificationToken = undefined;
    user.verificationCode = undefined;
    user.verificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified. You can now sign in.",
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resend the verification email
// @route   POST /api/auth/resend-verification
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide your email" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.userStatus === "pending") {
      await sendVerificationEmail(req, user);
    }

    res.status(200).json({
      success: true,
      message: "If that account is awaiting verification, a new code has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request a password reset link by email
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide your email" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond with the same message whether or not the account exists
    // to avoid leaking which emails are registered (user enumeration).
    if (user) {
      const resetToken = user.getResetPasswordToken();
      const resetCode = user.getResetPasswordCode();
      await user.save({ validateBeforeSave: false });

      const link = buildLink(req, "reset-password", resetToken);
      await sendMail({
        to: user.email,
        subject: "Reset your ChalkBoard password",
        text: `Hi ${user.name},

We received a request to reset your ChalkBoard password. Your reset code is:

  ${resetCode}

Enter this 6-digit code in the app to choose a new password (valid for 10 minutes).

Or open this link on this device instead:

  ${link}

If you didn't request this, you can safely ignore this email.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "If that email exists, a reset code has been sent",
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password using a token
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const { token, code, newPassword } = req.body;
    const value = (token || code || "").trim();
    if (!value) {
      return res
        .status(400)
        .json({ success: false, message: "Reset code is required" });
    }

    const user = await User.findOne({
      $or: [
        { resetPasswordToken: hashToken(value), resetPasswordExpire: { $gt: Date.now() } },
        { resetPasswordCode: hashToken(value), resetPasswordExpire: { $gt: Date.now() } },
      ],
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset code" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    // Invalidate any existing sessions after a password change.
    user.refreshToken = undefined;
    user.refreshTokenExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (err) {
    next(err);
  }
};