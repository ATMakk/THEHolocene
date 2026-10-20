import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats, getAllBlogs } from "../API/index.js";

const statusStyles = {
  draft: { bg: "#e9ecef", color: "#495057", label: "Draft" },
  pending: { bg: "#fff3cd", color: "#856404", label: "Pending" },
  approved: { bg: "#d1e7dd", color: "#0a5d3a", label: "Approved" },
  rejected: { bg: "#f8d7da", color: "#842029", label: "Rejected" },
};

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([
          getStats(),
          getAllBlogs({ page: 1, limit: 6 }),
        ]);
        setStats(s.data?.data || {});
        setRecent(r.data?.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading Admin Dashboard…</p>;

  const cards = [
    { label: "Total Articles", value: stats?.totalBlogs, icon: "📄", link: "/admin/articles" },
    { label: "Pending Approval", value: stats?.pendingBlogs, icon: "⏳", link: "/admin/approvals" },
    { label: "Published", value: stats?.approvedBlogs, icon: "✓", link: "/admin/articles?status=approved" },
    { label: "Total Users", value: stats?.totalUsers, icon: "👤", link: "/admin/users" },
    { label: "Comments", value: stats?.totalComments, icon: "💬", link: "/admin/comments" },
    { label: "Rejected", value: stats?.rejectedBlogs, icon: "✕", link: "/admin/articles?status=rejected" },
    { label: "Featured", value: stats?.featuredBlogs, icon: "★", link: "/admin/articles?status=featured" },
    { label: "Reported", value: stats?.reportedBlogs, icon: "⚠", link: "/admin/articles?status=reported" },
  ];

  return (
    <>
      <h5 style={{ marginBottom: "1rem" }}>Dashboard Overview</h5>

      <div className="row g-3 mb-4">
        {cards.map((c) => (
          <div key={c.label} className="col-md-3 col-6">
            <Link
              to={c.link}
              style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--holocene-line)",
                  borderRadius: 8,
                  padding: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: "100%",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--holocene-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    {c.label}
                  </div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontFamily: "var(--font-serif)",
                      color: "var(--holocene-green)",
                      fontWeight: 700,
                    }}
                  >
                    {c.value ?? 0}
                  </div>
                </div>
                <div style={{ fontSize: "1.8rem", color: "var(--holocene-gold)" }}>{c.icon}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div
        className="d-flex justify-content-between align-items-baseline mb-3"
        style={{ borderBottom: "2px solid var(--holocene-green)", paddingBottom: "0.5rem" }}
      >
        <h5 style={{ margin: 0 }}>Recent Articles</h5>
        <Link to="/admin/articles" style={{ fontSize: "0.85rem", color: "var(--holocene-green)", fontWeight: 600 }}>
          View all →
        </Link>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--holocene-line)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <table className="table mb-0 align-middle">
          <thead style={{ background: "var(--holocene-cream)" }}>
            <tr>
              <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Title</th>
              <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Author</th>
              <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Status</th>
              <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-muted">
                  No articles yet
                </td>
              </tr>
            ) : (
              recent.map((b) => {
                const s = statusStyles[b.status] || statusStyles.draft;
                return (
                  <tr key={b._id}>
                    <td style={{ maxWidth: 340 }}>
                      <Link to={`/blogs/${b._id}`}>{b.title}</Link>
                    </td>
                    <td>
                      {b.author?.firstname} {b.author?.lastname}
                    </td>
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
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}