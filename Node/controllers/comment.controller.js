const BlogModel = require("../models/blog.model");
const CommentModel = require("../models/comment.model");

const addComment = async (req, res) => {
  const { id: userId } = req.user;
  const { blogId } = req.params;
  const { content, parentComment } = req.body;

  try {
    if (!content) return res.status(400).send({ message: "Content is required" });

    const blog = await BlogModel.findById(blogId);
    if (!blog || blog.status !== "approved") {
      return res.status(404).send({ message: "Blog not found" });
    }

    if (parentComment) {
      const parent = await CommentModel.findById(parentComment);
      if (!parent || parent.isDeleted) {
        return res.status(400).send({ message: "Parent comment not found" });
      }
    }

    const comment = await CommentModel.create({
      blog: blogId,
      author: userId,
      content,
      parentComment: parentComment || null,
    });

    blog.commentsCount += 1;
    await blog.save();

    res.status(201).send({ message: "Comment added", data: comment });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot add comment" });
  }
};

const getCommentsByBlog = async (req, res) => {
  const { blogId } = req.params;

  try {
    const comments = await CommentModel.find({ blog: blogId, isDeleted: false })
      .populate("author", "firstname lastname tag profilePicture")
      .sort({ createdAt: -1 });

    // Build threaded tree
    const map = {};
    const roots = [];
    comments.forEach((c) => {
      map[c._id] = { ...c.toObject(), replies: [] };
    });
    comments.forEach((c) => {
      if (c.parentComment && map[c.parentComment]) {
        map[c.parentComment].replies.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });

    res.status(200).send({ message: "Comments fetched", data: roots });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch comments" });
  }
};

const updateComment = async (req, res) => {
  const { id: userId, role } = req.user;
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    const comment = await CommentModel.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).send({ message: "Comment not found" });
    }

    const isOwner = String(comment.author) === String(userId);
    const isPrivileged = role === "admin" || role === "operator";
    if (!isOwner && !isPrivileged) {
      return res.status(403).send({ message: "Forbidden resource" });
    }

    comment.content = content || comment.content;
    await comment.save();

    res.status(200).send({ message: "Comment updated", data: comment });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot update comment" });
  }
};

const deleteComment = async (req, res) => {
  const { id: userId, role } = req.user;
  const { commentId } = req.params;

  try {
    const comment = await CommentModel.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).send({ message: "Comment not found" });
    }

    const isOwner = String(comment.author) === String(userId);
    const isPrivileged = role === "admin" || role === "operator";
    if (!isOwner && !isPrivileged) {
      return res.status(403).send({ message: "Forbidden resource" });
    }

    comment.isDeleted = true;
    await comment.save();

    const blog = await BlogModel.findById(comment.blog);
    if (blog && blog.commentsCount > 0) {
      blog.commentsCount -= 1;
      await blog.save();
    }

    res.status(200).send({ message: "Comment deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot delete comment" });
  }
};

const toggleCommentLike = async (req, res) => {
  const { id: userId } = req.user;
  const { commentId } = req.params;

  try {
    const comment = await CommentModel.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).send({ message: "Comment not found" });
    }

    const has = comment.likes.some((l) => String(l) === String(userId));
    if (has) {
      comment.likes = comment.likes.filter((l) => String(l) !== String(userId));
    } else {
      comment.likes.push(userId);
    }
    await comment.save();

    res.status(200).send({
      message: has ? "Comment unliked" : "Comment liked",
      data: { likes: comment.likes.length, liked: !has },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot toggle comment like" });
  }
};

const getAllCommentsAdmin = async (req, res) => {
  try {
    const comments = await CommentModel.find({ isDeleted: false })
      .populate("author", "firstname lastname tag profilePicture email")
      .populate("blog", "title")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).send({ message: "Comments fetched", data: comments });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch comments" });
  }
};

module.exports = {
  addComment,
  getCommentsByBlog,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getAllCommentsAdmin,
};