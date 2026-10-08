import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getBlog,
  getComments,
  addComment,
  deleteComment,
  toggleLike,
  toggleBookmark,
} from "../api/index.js";
import { useAuth } from "../hooks/useAuth.js";
import BlogCard from "../components/BlogCard.jsx";
import { getRelatedBlogs } from "../api/index.js";

export default function BlogDetail() {
  const { id } = useParams();
  const { user, isAuth, canAdmin } = useAuth();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getBlog(id);
      const b = res.data?.data;
      setBlog(b);
      setLikes(b?.likes?.length || 0);
      setLiked(
        user ? (b?.likes || []).some((x) => String(x) === String(user._id)) : false
      );

      const c = await getComments(id);
      setComments(c.data?.data || []);

      try {
        const r = await getRelatedBlogs(id);
        setRelated(r.data?.data || []);
      } catch {
        /* silent */
      }
    } catch (err) {
      setError(err.message || "Article not found");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLike = async () => {
    if (!isAuth) return alert("Please login to like this article");
    try {
      const res = await toggleLike(id);
      setLikes(res.data?.data?.likes ?? likes);
      setLiked(res.data?.data?.liked ?? !liked);
    } catch (err) {
      alert(err.message || "Cannot like");
    }
  };

  const handleBookmark = async () => {
    if (!isAuth) return alert("Please login to bookmark");
    try {
      const res = await toggleBookmark(id);
      alert(res.data?.data?.bookmarked ? "Bookmarked" : "Bookmark removed");
    } catch (err) {
      alert(err.message || "Cannot bookmark");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment(id, { content: commentText });
      setCommentText("");
      const c = await getComments(id);
      setComments(c.data?.data || []);
    } catch (err) {
      alert(err.message || "Cannot post comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      const c = await getComments(id);
      setComments(c.data?.data || []);
    } catch (err) {
      alert(err.message || "Cannot delete comment");
    }
  };

  if (loading) return <div className="container my-5">Loading…</div>;
  if (error)
    return (
      <div className="container my-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  if (!blog) return null;

  const author = blog.author?.firstname
    ? `${blog.author.firstname} ${blog.author.lastname}`
    : "THE Holocene";

  return (
    <article className="container my-5" style={{ maxWidth: 820 }}>
      <Link to="/blogs" style={{ fontSize: "0.9rem" }}>
        ← Back to all articles
      </Link>

      <div className="mt-4">
        <span
          style={{
            background: "var(--holocene-green)",
            color: "var(--holocene-cream)",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "0.25rem 0.7rem",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          {blog.category}
        </span>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
            lineHeight: 1.15,
            marginTop: "0.75rem",
          }}
        >
          {blog.title}
        </h1>
        {blog.snippet && (
          <p style={{ fontSize: "1.1rem", color: "var(--holocene-muted)", fontStyle: "italic" }}>
            {blog.snippet}
          </p>
        )}
      </div>

      <div
        className="d-flex align-items-center gap-3 py-3 my-3 flex-wrap"
        style={{ borderTop: "1px solid var(--holocene-line)", borderBottom: "1px solid var(--holocene-line)" }}
      >
        <img
          src={
            blog.author?.profilePicture?.secure_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=0f3d2e&color=fff`
          }
          alt={author}
          style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>{author}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--holocene-muted)" }}>
            {new Date(blog.createdAt).toDateString()} · 👁 {blog.views ?? 0} · 💬 {blog.commentsCount ?? 0}
          </div>
        </div>
        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-sm"
            style={{
              border: "1px solid var(--holocene-green)",
              color: "var(--holocene-green)",
              background: liked ? "var(--holocene-green)" : "transparent",
            }}
            onClick={handleLike}
          >
            <span style={{ color: liked ? "#fff" : "inherit" }}>{liked ? "♥" : "♡"} {likes}</span>
          </button>
          {isAuth && (
            <button
              className="btn btn-sm"
              style={{ border: "1px solid var(--holocene-green)", color: "var(--holocene-green)" }}
              onClick={handleBookmark}
            >
              Bookmark
            </button>
          )}
        </div>
      </div>

      {blog.coverImage?.secure_url && (
        <img
          src={blog.coverImage.secure_url}
          alt={blog.title}
          style={{ width: "100%", borderRadius: 10, marginBottom: "2rem" }}
        />
      )}

      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "1.1rem",
          lineHeight: 1.85,
          color: "#2a2a2a",
          whiteSpace: "pre-wrap",
        }}
      >
        {blog.content}
      </div>

      {blog.tags?.length > 0 && (
        <div className="mt-4">
          {blog.tags.map((t) => (
            <span
              key={t}
              className="badge me-2 mb-2"
              style={{ background: "var(--holocene-cream)", color: "var(--holocene-green)", padding: "0.5rem 0.9rem" }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* COMMENTS */}
      <section className="mt-5">
        <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>
          Comments ({comments.length})
        </h3>

        {isAuth ? (
          <form onSubmit={handleComment} className="mb-4">
            <textarea
              className="form-control mb-2"
              rows={3}
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              className="btn"
              style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
              disabled={!commentText.trim()}
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p style={{ color: "var(--holocene-muted)" }}>
            Please <Link to="/login">login</Link> to join the conversation.
          </p>
        )}

        {comments.length === 0 ? (
          <p style={{ color: "var(--holocene-muted)" }}>No comments yet. Be the first.</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="py-3" style={{ borderBottom: "1px solid var(--holocene-line)" }}>
              <div className="d-flex gap-3">
                <img
                  src={
                    c.author?.profilePicture?.secure_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${c.author?.firstname || ""} ${c.author?.lastname || ""}`
                    )}&background=0f3d2e&color=fff`
                  }
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong>
                      {c.author?.firstname} {c.author?.lastname}
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--holocene-muted)" }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ marginBottom: "0.4rem", whiteSpace: "pre-wrap" }}>{c.content}</p>
                  {user && (String(c.author?._id) === String(user._id) || canAdmin) && (
                    <button
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => handleDeleteComment(c._id)}
                    >
                      Delete
                    </button>
                  )}

                  {/* Nested replies */}
                  {c.replies?.length > 0 && (
                    <div className="mt-3 ps-3" style={{ borderLeft: "2px solid var(--holocene-line)" }}>
                      {c.replies.map((r) => (
                        <div key={r._id} className="py-2">
                          <strong>
                            {r.author?.firstname} {r.author?.lastname}
                          </strong>
                          <span className="ms-2" style={{ fontSize: "0.78rem", color: "var(--holocene-muted)" }}>
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="mt-5">
          <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>Related Articles</h3>
          <div className="row g-4">
            {related.map((b) => (
              <div key={b._id} className="col-md-4">
                <BlogCard blog={b} />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}