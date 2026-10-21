import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllBlogs, adminDeleteBlog, featureBlog, cleanupOldBlogsAPI } from "../API/index.js";

const statusStyles = {
  draft: { bg: "#e9ecef", color: "#495057", label: "Draft" },
  pending: { bg: "#fff3cd", color: "#856404", label: "Pending" },
  approved: { bg: "#d1e7dd", color: "#0a5d3a", label: "Approved" },
  rejected: { bg: "#f8d7da", color: "#842029", label: "Rejected" },
};

const articleQueryParams = (status, search) => {
  const params = { limit: 100 };
  if (status === "featured") params.featured = true;
  else if (status) params.status = status;
  if (search.trim()) params.search = search.trim();
  return params;
};

export default function AdminArticles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status =
    searchParams.get("featured") === "true"
      ? "featured"
      : searchParams.get("status") || "";

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cleaning, setCleaning] = useState(false);

  const load = async (
    s = status,
    q = searchParams.get("search") || ""
  ) => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllBlogs(articleQueryParams(s, q));
      setBlogs(res.data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const currentStatus =
      searchParams.get("featured") === "true"
        ? "featured"
        : searchParams.get("status") || "";

    getAllBlogs(
      articleQueryParams(currentStatus, searchParams.get("search") || "")
    )
      .then((response) => {
        if (!cancelled) {
          setBlogs(response.data?.data || []);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Failed to load articles");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const updateFilters = (nextStatus, searchTerm) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (nextStatus === "featured") params.set("featured", "true");
    else if (nextStatus) params.set("status", nextStatus);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    setSearchParams(params);
  };

  const handleFeature = async (blog) => {
    try {
      await featureBlog(blog._id, { isFeatured: !blog.isFeatured });
      await load();
    } catch (err) {
      alert(err.message || "Cannot update featured status");
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    try {
      await adminDeleteBlog(blogId);
      await load();
    } catch (err) {
      alert(err.message || "Cannot delete article");
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm("Clean up automated news articles older than 30 days? User-authored, bookmarked, and featured articles will be preserved.")) return;
    try {
      setCleaning(true);
      const res = await cleanupOldBlogsAPI(30);
      alert(res.data?.message || "Cleanup complete");
      load();
    } catch (err) {
      alert(err.message || "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <h4 style={{ margin: 0 }}>All Articles</h4>
          <Link
            to="/admin/articles/new"
            className="btn btn-sm"
            style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)", fontWeight: 600 }}
          >
            + Create Article
          </Link>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning text-dark"
            style={{ fontWeight: 600 }}
            onClick={handleCleanup}
            disabled={cleaning}
          >
            {cleaning ? "Cleaning..." : "🧹 Clean Up Old News (>30d)"}
          </button>
        </div>

        <ArticleFilters
          key={searchParams.toString()}
          status={status}
          initialSearch={searchParams.get("search") || ""}
          onSubmit={(searchTerm) => updateFilters(status, searchTerm)}
          onStatusChange={(nextStatus, searchTerm) =>
            updateFilters(nextStatus, searchTerm)
          }
        />
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}{" "}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <p>Loading Articles…</p>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--holocene-line)",
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          <table className="table mb-0 align-middle">
            <thead style={{ background: "var(--holocene-cream)" }}>
              <tr>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Title</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Author</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Category</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Status</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Featured</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Date</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    No articles found matching filters
                  </td>
                </tr>
              ) : (
                blogs.map((b) => {
                  const s = statusStyles[b.status] || statusStyles.draft;
                  return (
                    <tr key={b._id}>
                      <td style={{ maxWidth: 260 }}>
                        {b.status === "approved" ? (
                          <Link to={`/blogs/${b._id}`} style={{ fontWeight: 600, color: "var(--holocene-green)" }}>
                            {b.title}
                          </Link>
                        ) : (
                          b.title
                        )}
                      </td>
                      <td>
                        {b.author?.firstname} {b.author?.lastname}
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{b.category}</td>
                      <td>
                        <span
                          style={{
                            background: s.bg,
                            color: s.color,
                            fontSize: "0.72rem",
                            padding: "0.25rem 0.65rem",
                            borderRadius: 4,
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td>{b.isFeatured ? "★" : "—"}</td>
                      <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <Link
                            to={`/admin/articles/${b._id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleFeature(b)}
                          >
                            {b.isFeatured ? "Unfeature" : "Feature"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(b._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ArticleFilters({ status, initialSearch, onSubmit, onStatusChange }) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex gap-2 align-items-center flex-wrap">
      <input
        type="text"
        className="form-control form-control-sm"
        placeholder="Search by title, category..."
        style={{ width: 220 }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search articles"
      />
      <select
        className="form-select form-select-sm"
        style={{ width: 150 }}
        value={status}
        onChange={(e) => onStatusChange(e.target.value, searchTerm)}
        aria-label="Filter articles by status"
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="featured">Featured</option>
      </select>
      <button type="submit" className="btn btn-sm btn-dark">
        Search
      </button>
    </form>
  );
}