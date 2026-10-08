const express = require("express");
const {
  registerUser,
  loginUser,
  socialLoginUser,
  getUser,
  getUserByOperator,
  updateUser,
  updateProfilePicture,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteUser,
} = require("../controllers/user.controller");
const verifyUser = require("../middlewares/verifyUser");

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/social-login", socialLoginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Auth
router.get("/me", verifyUser, getUser);
router.patch("/me/picture", verifyUser, updateProfilePicture);
router.patch("/me/password", verifyUser, changePassword);

// Operator / admin can fetch specific user
router.get("/:userId", verifyUser, getUserByOperator);
router.patch("/:id", verifyUser, updateUser);
router.delete("/:id", verifyUser, deleteUser);

module.exports = router;