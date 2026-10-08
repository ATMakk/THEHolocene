const express = require("express");
const {
  addComment,
  getCommentsByBlog,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getAllCommentsAdmin,
} = require("../controllers/comment.controller");
const verifyUser = require("../middlewares/verifyUser");
const verifyAdmin = require("../middlewares/verifyAdmin");

const router = express.Router();

router.get("/blog/:blogId", getCommentsByBlog);
router.get("/admin/all", verifyAdmin, getAllCommentsAdmin);
router.post("/blog/:blogId", verifyUser, addComment);
router.patch("/:commentId", verifyUser, updateComment);
router.delete("/:commentId", verifyUser, deleteComment);
router.post("/:commentId/like", verifyUser, toggleCommentLike);

module.exports = router;