const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  createOperator,
  getDashboardStats,
  getAllUsers,
  getReportedBlogs,
} = require("../controllers/admin.controller");
const verifyAdmin = require("../middlewares/verifyAdmin");

const router = express.Router();

// Public
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Admin-protected
router.get("/me", verifyAdmin, getAdmin);
router.patch("/:id", verifyAdmin, updateAdmin);
router.delete("/:id", verifyAdmin, deleteAdmin);

router.post("/operators", verifyAdmin, createOperator);
router.get("/dashboard/stats", verifyAdmin, getDashboardStats);
router.get("/users", verifyAdmin, getAllUsers);
router.get("/reports", verifyAdmin, getReportedBlogs);

module.exports = router;