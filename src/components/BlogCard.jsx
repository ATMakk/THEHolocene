import { Link } from "react-router-dom";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

const truncate = (str = "", n = 120) =>
  str.length > n ? str.substring(0, n).trim() + "…" : str;

export default function BlogCard({ blog }) {
  const author =
    blog.author?.firstname && blog.author?.lastname
      ? `${blog.author.firstname} ${blog.author.lastname}`
      : "THE Holocene";

  return (
    <Link to={`/blogs/${blog._id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--holocene-line)",
          borderRadius: 8,
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform .2s ease, box-shadow .2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(15,61,46,0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <img
          src={blog.coverImage?.secure_url || "https://placehold.co/600x400?text=THE+Holocene"}
          alt={blog.title}
          loading="lazy"
          style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }}
        />
        <div style={{ padding: "1.15rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <span
            style={{
              background: "var(--holocene-green)",
              color: "var(--holocene-cream)",
              fontSize: "0.68rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "0.22rem 0.65rem",
              borderRadius: 4,
              alignSelf: "flex-start",
            }}
          >
            {blog.category}
          </span>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", lineHeight: 1.3, margin: "0.6rem 0" }}>
            {truncate(blog.title, 90)}
          </h3>
          <p style={{ color: "var(--holocene-muted)", fontSize: "0.9rem", flexGrow: 1 }}>
            {truncate(blog.snippet || blog.content || "", 130)}
          </p>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--holocene-muted)",
              display: "flex",
              gap: "0.6rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span>{author}</span>
            <span>·</span>
            <span>{formatDate(blog.createdAt)}</span>
            <span className="ms-auto">👁 {blog.views ?? 0}</span>
            <span>💬 {blog.commentsCount ?? 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}