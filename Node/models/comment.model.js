const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "blog",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, strict: "throw" }
);

const CommentModel = mongoose.model("comment", commentSchema);
module.exports = CommentModel;