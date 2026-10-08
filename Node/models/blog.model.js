const mongoose = require("mongoose");
const { CATEGORIES } = require("../constants/categories");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    content: { type: String, required: true },
    snippet: { type: String, maxlength: 300 },
    coverImage: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
      index: true,
    },
    tags: [{ type: String, index: true }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "authorModel",
    },
    authorModel: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    source: {
      type: String,
      enum: ["user", "api"],
      default: "user",
    },
    sourceUrl: { type: String },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "admin" },
    scheduledAt: { type: Date }, // optional: auto-publish later
    views: { type: Number, default: 0 },
    viewers: [{ type: String }], // IP or userId to dedupe views
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    shares: { type: Number, default: 0 },
    reports: [
      {
        reporter: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isFeatured: { type: Boolean, default: false, index: true },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true }
);

blogSchema.index({ title: "text", content: "text", tags: "text" });
blogSchema.index({ status: 1, category: 1, createdAt: -1 });

// Auto-generate slug from title before save
blogSchema.pre("save", function () {
  if (this.isModified("title") || !this.slug) {
    const base = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    this.slug = `${base}-${Date.now().toString(36)}`;
  }
});

const BlogModel = mongoose.model("blog", blogSchema);
module.exports = BlogModel;