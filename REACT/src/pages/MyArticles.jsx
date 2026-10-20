import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBlogs, deleteBlog } from "../api/index.js";

const statusStyles = {
  draft: { bg: "#e9ecef", color: "#495057", label: "Draft" },
  pending: { bg: "#fff3cd", color: "#856404", label: "Pending Approval" },
  approved: { bg: "#d1e7dd", color: "#0a5d3a", label: "Published" },
  rejected: { bg: "#f8d7da", color: "#842029", label: "Rejected" },
};

export default function MyArticles() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getMyBlogs();
      setBlogs(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this article permanently?")) return;
    try {
      await deleteBlog(id);
      load();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <div className="container my-5">
      <div
        className="d-flex justify-content-between align-items-baseline mb-4"
        style={{ borderBottom: "2px solid var(--holocene-green)", paddingBottom: "0.65rem" }}
      >
        <h2 style={{ fontFamily: "var(--font-serif)", margin: 0 }}>My Articles</h2>
        <Link
          to="/my-articles/new"
          className="btn"
          style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
        >
          + New Article
        </Link>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : blogs.length === 0 ? (
        <div className="text-center my-5">
          <h4>You haven't written anything yet</h4>
          <p style={{ color: "var(--holocene-muted)" }}>Start sharing your perspective.</p>
          <Link
            to="/my-articles/new"
            className="btn mt-2"
            style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
          >
            Write your first article
          </Link>
        </div>
      ) : (
        <div className="table-responsive" style={{ background: "#fff", borderRadius: 8, border: "1px solid var(--holocene-line)" }}>
          <table className="table mb-0 align-middle">
            <thead style={{ background: "var(--holocene-cream)" }}>
              <tr>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Category</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Status</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => {
                const s = statusStyles[b.status] || statusStyles.draft;
                return (
                  <tr key={b._id}>
                    <td style={{ maxWidth: 340 }}>
                      <Link to={`/blogs/${b._id}`}>{b.title}</Link>
                      {b.status === "rejected" && b.rejectionReason && (
                        <div style={{ fontSize: "0.78rem", color: "var(--holocene-danger)", marginTop: 4 }}>
                          Reason: {b.rejectionReason}
                        </div>
                      )}
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
                          letterSpacing: "0.05em",
                        }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td>
                      <Link to={`/my-articles/edit/${b._id}`} className="btn btn-sm btn-outline-dark me-1">
                        Edit
                      </Link>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}