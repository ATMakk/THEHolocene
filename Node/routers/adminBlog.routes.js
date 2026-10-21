const express = require("express");
const {
  adminGetAllBlogs,
  adminGetBlog,
  adminCreateBlog,
  adminUpdateBlog,
  approveBlog,
  rejectBlog,
  featureBlog,
  adminDeleteBlog,
  ingestNewsFromAPI,
  cleanupOldBlogs,
} = require("../controllers/blog.controller");
const verifyAdmin = require("../middlewares/verifyAdmin");

const router = express.Router();

router.use(verifyAdmin);

router.get("/", adminGetAllBlogs);
router.get("/:blogId", adminGetBlog);
router.post("/", adminCreateBlog);
router.patch("/:blogId", adminUpdateBlog);
router.delete("/cleanup", cleanupOldBlogs);
router.patch("/:blogId/approve", approveBlog);
router.patch("/:blogId/reject", rejectBlog);
router.patch("/:blogId/feature", featureBlog);
router.delete("/:blogId", adminDeleteBlog);
router.post("/ingest-news", ingestNewsFromAPI);

module.exports = router;