const BlogModel = require("../models/blog.model");
const CommentModel = require("../models/comment.model");
const cloudinary = require("../utils/cloudinary");
const { fetchNews } = require("../utils/newsFetcher");
const { CATEGORIES } = require("../constants/categories");

/* USER-FACING */

const createBlog = async (req, res) => {
  const { id: userId } = req.user;
  const { title, content, snippet, category, tags, coverImage, saveAsDraft } =
    req.body;

  try {
    if (!title || !content) {
      return res.status(400).send({ message: "Title and content are required" });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).send({
        message: `Category must be one of: ${CATEGORIES.join(", ")}`,
      });
    }

    let cover = {};
    if (coverImage) {
      const uploaded = await cloudinary.uploader.upload(coverImage, {
        folder: "blog_covers",
      });
      cover = { secure_url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const blog = await BlogModel.create({
      title,
      content,
      snippet: snippet || content.substring(0, 200),
      coverImage: cover,
      category,
      tags: tags || [],
      author: userId,
      authorModel: "user",
      source: "user",
      status: saveAsDraft ? "draft" : "pending",
    });

    res.status(201).send({
      message: saveAsDraft
        ? "Blog saved as draft"
        : "Blog submitted for approval",
      data: blog,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot create blog at this time" });
  }
};

const updateBlog = async (req, res) => {
  const { id: userId } = req.user;
  const { blogId } = req.params;
  const { title, content, snippet, category, tags, coverImage, saveAsDraft } =
    req.body;

  try {
    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    const isOwner = String(blog.author) === String(userId);
    const isPrivileged = req.user?.role === "admin" || req.user?.role === "operator";
    if (!isOwner && !isPrivileged) {
      return res.status(403).send({ message: "Forbidden resource" });
    }

    const updates = {
      ...(title && { title }),
      ...(content && { content }),
      ...(snippet && { snippet }),
      ...(category && CATEGORIES.includes(category) && { category }),
      ...(tags && { tags }),
    };

    if (coverImage) {
      if (blog.coverImage?.public_id) {
        await cloudinary.uploader.destroy(blog.coverImage.public_id);
      }
      const uploaded = await cloudinary.uploader.upload(coverImage, {
        folder: "blog_covers",
      });
      updates.coverImage = {
        secure_url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    updates.status = saveAsDraft ? "draft" : "pending";
    updates.rejectionReason = undefined;

    const updated = await BlogModel.findByIdAndUpdate(blogId, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).send({
      message: saveAsDraft
        ? "Draft updated"
        : "Blog updated and resubmitted for approval",
      data: updated,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot update blog at this time" });
  }
};

const deleteBlog = async (req, res) => {
  const { id: userId, role } = req.user;
  const { blogId } = req.params;

  try {
    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    const isOwner = String(blog.author) === String(userId);
    const isPrivileged = role === "admin" || role === "operator";
    if (!isOwner && !isPrivileged) {
      return res.status(403).send({ message: "Forbidden resource" });
    }

    if (blog.coverImage?.public_id) {
      await cloudinary.uploader.destroy(blog.coverImage.public_id);
    }
    await CommentModel.deleteMany({ blog: blogId });
    await BlogModel.findByIdAndDelete(blogId);

    res.status(200).send({ message: "Blog deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot delete blog at this time" });
  }
};

const getBlogById = async (req, res) => {
  const { blogId } = req.params;
  const viewerKey = req.user?.id || req.ip;

  try {
    const blog = await BlogModel.findById(blogId)
      .populate("author", "firstname lastname tag profilePicture")
      .populate("approvedBy", "firstname lastname");

    if (!blog || blog.status !== "approved") {
      return res.status(404).send({ message: "Blog not found" });
    }

    // De-duplicated view count
    if (!blog.viewers.includes(viewerKey)) {
      blog.viewers.push(viewerKey);
      blog.views += 1;
      await blog.save();
    }

    res.status(200).send({
      message: "Blog fetched successfully",
      data: blog,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch blog at this time" });
  }
};

const getAllBlogs = async (req, res) => {
  const { page = 1, limit = 10, category, search, tag, featured } = req.query;

  try {
    const filter = { status: "approved" };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (featured === "true") filter.isFeatured = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { snippet: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const blogs = await BlogModel.find(filter)
      .populate("author", "firstname lastname tag profilePicture")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await BlogModel.countDocuments(filter);

    res.status(200).send({
      message: "Blogs fetched successfully",
      data: blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch blogs at this time" });
  }
};

const getMyBlogs = async (req, res) => {
  const { id: userId } = req.user;
  const { status } = req.query;

  try {
    const filter = { author: userId };
    if (status) filter.status = status;

    const blogs = await BlogModel.find(filter).sort({ createdAt: -1 });
    res.status(200).send({
      message: "Your blogs fetched successfully",
      data: blogs,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch your blogs" });
  }
};

const getBlogsByAuthor = async (req, res) => {
  const { authorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const blogs = await BlogModel.find({
      author: authorId,
      status: "approved",
    })
      .populate("author", "firstname lastname tag profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await BlogModel.countDocuments({
      author: authorId,
      status: "approved",
    });

    res.status(200).send({
      message: "Author blogs fetched",
      data: blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch author blogs" });
  }
};

const getRelatedBlogs = async (req, res) => {
  const { blogId } = req.params;
  const { limit = 5 } = req.query;

  try {
    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    const related = await BlogModel.find({
      _id: { $ne: blogId },
      category: blog.category,
      status: "approved",
    })
      .populate("author", "firstname lastname profilePicture")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).send({
      message: "Related blogs fetched",
      data: related,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch related blogs" });
  }
};

const getTrendingBlogs = async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const blogs = await BlogModel.aggregate([
      { $match: { status: "approved" } },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$views", 1] },
              { $multiply: [{ $size: "$likes" }, 3] },
              { $multiply: ["$shares", 2] },
              { $multiply: ["$commentsCount", 2] },
            ],
          },
        },
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: Number(limit) },
    ]);

    res.status(200).send({
      message: "Trending blogs fetched",
      data: blogs,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch trending blogs" });
  }
};

const toggleLike = async (req, res) => {
  const { id: userId } = req.user;
  const { blogId } = req.params;

  try {
    const blog = await BlogModel.findById(blogId);
    if (!blog || blog.status !== "approved") {
      return res.status(404).send({ message: "Blog not found" });
    }

    const hasLiked = blog.likes.some((l) => String(l) === String(userId));
    if (hasLiked) {
      blog.likes = blog.likes.filter((l) => String(l) !== String(userId));
    } else {
      blog.likes.push(userId);
    }
    await blog.save();

    res.status(200).send({
      message: hasLiked ? "Blog unliked" : "Blog liked",
      data: { likes: blog.likes.length, liked: !hasLiked },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot process like" });
  }
};

const shareBlog = async (req, res) => {
  const { blogId } = req.params;

  try {
    const blog = await BlogModel.findByIdAndUpdate(
      blogId,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    res.status(200).send({
      message: "Share counted",
      data: { shares: blog.shares },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot count share" });
  }
};

const reportBlog = async (req, res) => {
  const { id: userId } = req.user;
  const { blogId } = req.params;
  const { reason } = req.body;

  try {
    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    const alreadyReported = blog.reports.some(
      (r) => String(r.reporter) === String(userId)
    );
    if (alreadyReported) {
      return res.status(400).send({ message: "You already reported this blog" });
    }

    blog.reports.push({ reporter: userId, reason: reason || "No reason given" });
    await blog.save();

    res.status(200).send({ message: "Blog reported. Admin will review." });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot report blog" });
  }
};

/* BOOKMARKS */

const toggleBookmark = async (req, res) => {
  const { id: userId } = req.user;
  const { blogId } = req.params;

  try {
    const UserModel = require("../models/user.model");
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).send({ message: "User not found" });

    const has = user.bookmarks.some((b) => String(b) === String(blogId));
    if (has) {
      user.bookmarks = user.bookmarks.filter(
        (b) => String(b) !== String(blogId)
      );
    } else {
      user.bookmarks.push(blogId);
    }
    await user.save();

    res.status(200).send({
      message: has ? "Bookmark removed" : "Blog bookmarked",
      data: { bookmarked: !has, count: user.bookmarks.length },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot toggle bookmark" });
  }
};

const getMyBookmarks = async (req, res) => {
  const { id: userId } = req.user;
  try {
    const UserModel = require("../models/user.model");
    const user = await UserModel.findById(userId).populate({
      path: "bookmarks",
      match: { status: "approved" },
      populate: { path: "author", select: "firstname lastname profilePicture" },
    });

    res.status(200).send({
      message: "Bookmarks fetched",
      data: user.bookmarks || [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch bookmarks" });
  }
};

/* ADMIN-FACING */

const adminGetAllBlogs = async (req, res) => {
  const { page = 1, limit = 20, status, category, author } = req.query;

  try {
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (author) filter.author = author;

    const skip = (Number(page) - 1) * Number(limit);
    const blogs = await BlogModel.find(filter)
      .populate("author", "firstname lastname email tag")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await BlogModel.countDocuments(filter);

    res.status(200).send({
      message: "Blogs fetched successfully",
      data: blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch blogs" });
  }
};

const approveBlog = async (req, res) => {
  const { id: adminId } = req.admin;
  const { blogId } = req.params;

  try {
    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    blog.status = "approved";
    blog.approvedBy = adminId;
    blog.rejectionReason = undefined;
    await blog.save();

    res.status(200).send({ message: "Blog approved", data: blog });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot approve blog" });
  }
};

const rejectBlog = async (req, res) => {
  const { blogId } = req.params;
  const { reason } = req.body;

  try {
    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    blog.status = "rejected";
    blog.rejectionReason = reason || "No reason provided";
    await blog.save();

    res.status(200).send({ message: "Blog rejected", data: blog });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot reject blog" });
  }
};

const featureBlog = async (req, res) => {
  const { blogId } = req.params;
  const { isFeatured } = req.body;

  try {
    const blog = await BlogModel.findByIdAndUpdate(
      blogId,
      { isFeatured: Boolean(isFeatured) },
      { new: true }
    );
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    res.status(200).send({
      message: blog.isFeatured ? "Blog featured" : "Blog unfeatured",
      data: blog,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot update featured status" });
  }
};

const adminDeleteBlog = async (req, res) => {
  const { blogId } = req.params;
  try {
    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.status(404).send({ message: "Blog not found" });

    if (blog.coverImage?.public_id) {
      await cloudinary.uploader.destroy(blog.coverImage.public_id);
    }
    await CommentModel.deleteMany({ blog: blogId });
    await BlogModel.findByIdAndDelete(blogId);

    res.status(200).send({ message: "Blog deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot delete blog" });
  }
};

/* NEWS API INGESTION */

const ingestNewsFromAPI = async (req, res) => {
  const { category, locale, page } = req.body;
  const adminId = req.admin.id;

  try {
    if (!CATEGORIES.includes(category)) {
      return res.status(400).send({
        message: `Category must be one of: ${CATEGORIES.join(", ")}`,
      });
    }

    const articles = await fetchNews({
      category,
      locale: locale || "en-US",
      page: page || 1,
    });

    const created = [];
    for (const article of articles) {
      const exists = await BlogModel.findOne({
        title: article.title,
        sourceUrl: article.url,
      });
      if (exists) continue;

      const blog = await BlogModel.create({
        title: article.title,
        content: article.snippet || article.title,
        snippet: article.snippet,
        category,
        source: "api",
        sourceUrl: article.url,
        status: "pending",
        author: adminId,
        authorModel: "admin",
      });
      created.push(blog);
    }

    res.status(201).send({
      message: `${created.length} article(s) ingested (awaiting approval)`,
      data: created,
    });
  } catch (error) {
    console.log(error);
    const status = error.statusCode || 500;
    res.status(status).send({
      message: error.message || "Cannot fetch news at this time",
    });
  }
};


const cleanupOldBlogs = async (req, res) => {
  const { days = 30 } = req.query;
  try {
    const { cleanUpOldNews } = require("../utils/newsScheduler");
    const count = await cleanUpOldNews(Number(days));
    res.status(200).send({
      message: `Database cleanup complete. Removed ${count} articles older than ${days} days.`,
      count,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Database cleanup failed" });
  }
};

module.exports = {
  // user
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
  // admin
  adminGetAllBlogs,
  approveBlog,
  rejectBlog,
  featureBlog,
  adminDeleteBlog,
  ingestNewsFromAPI,
  cleanupOldBlogs,
};