const mongoose = require("mongoose");

const registrationOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    tag: { type: String },
    passwordHash: { type: String, required: true, select: false },
    otpHash: { type: String, required: true, select: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    nextRequestAt: { type: Date, required: true },
  },
  { timestamps: true }
);

registrationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("registrationOtp", registrationOtpSchema);
