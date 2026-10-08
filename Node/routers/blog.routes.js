// const express = require("express");
// const router = express.Router();




// router.get("/", getAllBlogs);
// router.get("/trending", getTrendingBlogs);
// router.get("/author/:authorId", getBlogsByAuthor);

// router.get("/me/list", verifyUser, getMyBlogs);
// router.get("/me/bookmarks", verifyUser, getMyBookmarks);

// router.get("/:blogId/related", getRelatedBlogs);
// router.get("/:blogId", getBlogById);

// router.post("/", verifyUser, createBlog);
// router.patch("/:blogId", verifyUser, updateBlog);
// router.delete("/:blogId", verifyUser, deleteBlog);

// router.post("/:blogId/like", verifyUser, toggleLike);
// router.post("/:blogId/share", shareBlog);
// router.post("/:blogId/bookmark", verifyUser, toggleBookmark);
// router.post("/:blogId/report", verifyUser, reportBlog);


const express = require("express");
const {
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogById,
  getAllBlogs,
  getMyBlogs,
  getBlogsByAuthor,
  getRelatedBlogs,
  getTrendingBlogs,
  toggleLike,
  shareBlog,
  reportBlog,
  toggleBookmark,
  getMyBookmarks,
} = require("../controllers/blog.controller");
const verifyUser = require("../middlewares/verifyUser");

const router = express.Router();

// Public (order matters!)
router.get("/", getAllBlogs);
router.get("/trending", getTrendingBlogs);
router.get("/author/:authorId", getBlogsByAuthor);

// Authenticated user — MUST come before "/:blogId"
router.get("/me/list", verifyUser, getMyBlogs);
router.get("/me/bookmarks", verifyUser, getMyBookmarks);

// Public single + related
router.get("/:blogId/related", getRelatedBlogs);
router.get("/:blogId", getBlogById);

// Authenticated mutations
router.post("/", verifyUser, createBlog);
router.patch("/:blogId", verifyUser, updateBlog);
router.delete("/:blogId", verifyUser, deleteBlog);

router.post("/:blogId/like", verifyUser, toggleLike);
router.post("/:blogId/share", shareBlog);
router.post("/:blogId/bookmark", verifyUser, toggleBookmark);
router.post("/:blogId/report", verifyUser, reportBlog);

module.exports = router;