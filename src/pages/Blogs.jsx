import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getBlogs } from "../API/index.js";
import BlogCard from "../components/BlogCard.jsx";

const CATEGORIES = [
  "all",
  "headlines",
  "politics",
  "sports",
  "entertainment",
  "technology",
  "education",
  "fintech",
  "business",
  "health",
  "world",
];

export default function Blogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catFromUrl = searchParams.get("category") || "all";
  const searchFromUrl = searchParams.get("search") || "";

  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(catFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);

  const load = async (p = 1, cat = category, q = searchQuery) => {
    try {
      setLoading(true);
      setError("");
      const params = { page: p, limit: 9 };
      if (cat && cat !== "all") params.category = cat;
      if (q.trim()) params.search = q.trim();

      const res = await getBlogs(params);
      setBlogs(res.data?.data || []);
      setPages(res.data?.pagination?.pages || 1);
      setPage(p);
    } catch (err) {
      setError(err.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const c = searchParams.get("category") || "all";
    const s = searchParams.get("search") || "";
    setCategory(c);
    setSearchQuery(s);
    load(1, c, s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCategorySelect = (c) => {
    setCategory(c);
    const p = new URLSearchParams(searchParams);
    if (c === "all") p.delete("category");
    else p.set("category", c);
    setSearchParams(p);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    if (searchQuery.trim()) p.set("search", searchQuery.trim());
    else p.delete("search");
    setSearchParams(p);
  };

  return (
    <div className="container my-5">
      {/* Header & Search */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", margin: 0 }}>News & Articles Desk</h2>
          <p style={{ color: "var(--holocene-muted)", margin: 0, fontSize: "0.9rem" }}>
            Explore verified journalism, breaking stories, and in-depth analytical pieces
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="d-flex gap-2" style={{ maxWidth: 380, width: "100%" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search titles or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="btn"
            style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)", fontWeight: 600 }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Category Pills */}
      <div className="d-flex gap-2 flex-wrap mb-4 pb-2 border-bottom">
        {CATEGORIES.map((c) => {
          const isActive = category === c;
          return (
            <button
              key={c}
              className="btn btn-sm text-capitalize"
              style={{
                background: isActive ? "var(--holocene-green)" : "#f4f6f5",
                color: isActive ? "var(--holocene-cream)" : "var(--holocene-ink)",
                border: "1px solid var(--holocene-line)",
                fontWeight: isActive ? 700 : 500,
                borderRadius: 20,
                padding: "0.35rem 0.9rem",
              }}
              onClick={() => handleCategorySelect(c)}
            >
              {c === "all" ? "All Categories" : c}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="alert alert-danger">
          {error}{" "}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => load(page)}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <p>Loading articles…</p>
      ) : blogs.length === 0 ? (
        <div className="text-center py-5">
          <h5>No articles found</h5>
          <p style={{ color: "var(--holocene-muted)" }}>
            Try adjusting your search terms or selected category filter.
          </p>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {blogs.map((b) => (
              <div key={b._id} className="col-md-6 col-lg-4">
                <BlogCard blog={b} />
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
              <button
                className="btn btn-sm btn-outline-dark"
                disabled={page === 1}
                onClick={() => load(page - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className="btn btn-sm"
                  style={{
                    background: n === page ? "var(--holocene-green)" : "transparent",
                    color: n === page ? "var(--holocene-cream)" : "var(--holocene-green)",
                    border: "1px solid var(--holocene-green)",
                  }}
                  onClick={() => load(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="btn btn-sm btn-outline-dark"
                disabled={page === pages}
                onClick={() => load(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}