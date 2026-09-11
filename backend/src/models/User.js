const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    userStatus: {
      type: String,
      enum: ["pending", "active"],
      default: "pending",
    },
    verificationToken: String,
    verificationCode: String,
    verificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordCode: String,
    resetPasswordExpire: Date,
    refreshToken: String,
    refreshTokenExpire: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    addresses: [
      {
        label: { type: String, default: "Home" },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, default: "India" },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.getSignedJwtToken = function (expiresIn) {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRE,
  });
};

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

UserSchema.methods.getResetPasswordCode = function () {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  this.resetPasswordCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return code;
};

UserSchema.methods.getVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.verificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return verificationToken;
};

UserSchema.methods.getVerificationCode = function () {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  this.verificationCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  this.verificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return code;
};

UserSchema.methods.createRefreshToken = function () {
  const rawToken = crypto.randomBytes(40).toString("hex");
  this.refreshToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.refreshTokenExpire = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return rawToken;
};

UserSchema.methods.matchRefreshToken = function (rawToken) {
  const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
  return this.refreshToken === hashed;
};

module.exports = mongoose.model("User", UserSchema);