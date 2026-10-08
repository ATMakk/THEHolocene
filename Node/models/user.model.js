const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    tag: { type: String, sparse: true, unique: true },
    password: { type: String, required: false, select: false },
    provider: {
      type: String,
      default: "local",
      enum: ["local", "google", "github"],
    },
    googleId: { type: String, sparse: true },
    githubId: { type: String, sparse: true },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "operator"],
    },
    idNumber: { type: String, sparse: true, unique: true },
    profilePicture: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "blog" }],
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true, strict: true }
);

const UserModel = mongoose.model("user", UserSchema);
module.exports = UserModel;