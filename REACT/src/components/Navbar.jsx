import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { getTrendingBlogs } from "../API/index.js";

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

// Reusable inline style for desktop nav links
const navLinkStyle = ({ isActive }) => ({
  fontWeight: isActive ? 700 : 500,
  color: isActive ? "var(--holocene-green)" : "var(--holocene-ink)",
  textDecoration: "none",
  fontSize: "0.95rem",
  transition: "color 0.15s ease",
  whiteSpace: "nowrap",
});

function NewsTicker({ items }) {
  if (!items.length) return null;

  const repeated = [...items, ...items];
  const timestamp = new Date();

  return (
    <div
      aria-label="Breaking news"
      style={{
        background: "var(--holocene-green)",
        color: "var(--holocene-cream)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        height: 38,
        fontSize: "0.82rem",
      }}
    >
      <span
        style={{
          background: "red",
          color: "#fff",
          padding: "0 1rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          height: "100%",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          textTransform: "uppercase",
          fontSize: "0.75rem",
        }}
      >
        Live
      </span>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div className="ticker-track">
          {repeated.map((blog, index) => (
            <Link
              key={`${blog._id}-${index}`}
              to={`/blogs/${blog._id}`}
              style={{
                color: "var(--holocene-cream)",
                marginRight: "2rem",
                whiteSpace: "nowrap",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              {blog.title}
            </Link>
          ))}
        </div>
      </div>
      <time
        className="d-none d-md-inline"
        dateTime={timestamp.toISOString()}
        style={{
          flexShrink: 0,
          padding: "0.4rem 1rem",
          opacity: 0.9,
          whiteSpace: "nowrap",
          borderLeft: "1px solid rgba(255,255,255,0.15)",
          fontSize: "0.85rem",
        }}
      >
        {timestamp.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
    </div>
  );
}

function SearchControls({
  initialSearch,
  initialCategory,
  onSearch,
  compact = false,
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCat, setSelectedCat] = useState(initialCategory);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(searchTerm, selectedCat);
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className="d-flex align-items-center"
        role="search"
        style={{
          background: "#f8f9fa",
          border: "1px solid var(--holocene-line)",
          borderRadius: 20,
          padding: "2px 4px 2px 10px",
          width: 210,
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--holocene-muted)"
          strokeWidth="2.4"
          aria-hidden="true"
          style={{ flexShrink: 0, marginRight: 6 }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <label htmlFor="nav-search" className="visually-hidden">
          Search
        </label>
        <input
          id="nav-search"
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: "0.8rem",
            width: "100%",
            minWidth: 0,
            color: "var(--holocene-ink)",
          }}
        />
        <button
          type="submit"
          aria-label="Search"
          style={{
            border: "none",
            background: "var(--holocene-green)",
            color: "var(--holocene-cream)",
            borderRadius: "50%",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="d-flex align-items-center gap-2"
      role="search"
    >
      <input
        type="text"
        className="form-control form-control-sm"
        placeholder="Search news..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search news"
      />
      <select
        className="form-select form-select-sm"
        style={{ width: "auto", maxWidth: 130 }}
        value={selectedCat}
        onChange={(e) => setSelectedCat(e.target.value)}
        aria-label="Category"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c === "all" ? "All" : c}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-sm btn-dark">
        Search
      </button>
    </form>
  );
}

export default function Navbar() {
  const { user, isAuth, canAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [trending, setTrending] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    getTrendingBlogs({ limit: 6 })
      .then((response) => {
        if (!cancelled) setTrending(response.data?.data || []);
      })
      .catch((error) => {
        console.error("Failed to load breaking news", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeSearch = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "all";

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const handleSearchSubmit = (searchTerm, selectedCat) => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (selectedCat && selectedCat !== "all") params.set("category", selectedCat);
    setOpen(false);
    navigate(`/blogs?${params.toString()}`);
  };

  const closeMobile = () => setOpen(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1050,
        width: "100%",
        background: "#ffffff",
        boxShadow: "0 2px 15px rgba(0,0,0,0.06)",
      }}
    >
      <NewsTicker items={trending} />

      <nav
        className="container d-flex align-items-center justify-content-between gap-3"
        style={{
          paddingTop: "0.625rem",
          paddingBottom: "0.625rem",
          borderBottom: "1px solid var(--holocene-line)",
        }}
      >
        {/* ---------- LEFT: Brand + Nav Links ---------- */}
        <div
          className="d-flex align-items-center gap-5"
          style={{ minWidth: 0, flexShrink: 0 }}
        >
          {/* Brand */}
          <Link
            to="/"
            onClick={closeMobile}
            className="d-flex align-items-center gap-2"
            style={{ textDecoration: "none", flexShrink: 0 }}
            aria-label="The Holocene News Desk — Home"
          >
            <div style={{ fontFamily: "var(--font-serif)", lineHeight: 1.05 }}>
              <div
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.35em",
                  color: "var(--holocene-gold)",
                  fontWeight: 700,
                }}
              >
                THE
              </div>
              <div
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 800,
                  color: "var(--holocene-green)",
                  letterSpacing: "-0.02em",
                }}
              >
                Holocene
              </div>
              <div
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.22em",
                  color: "var(--holocene-muted)",
                  textTransform: "uppercase",
                }}
              >
                News Desk &amp; Agency
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links — grouped right after brand */}
          <div className="d-none d-lg-flex gap-4 align-items-center">
            <NavLink to="/" end style={navLinkStyle}>
              Home
            </NavLink>
            <NavLink to="/blogs" style={navLinkStyle}>
              Articles
            </NavLink>
            <NavLink to="/about" style={navLinkStyle}>
              About Us
            </NavLink>
          </div>
        </div>

        {/* ---------- RIGHT: Compact Search + Auth Actions ---------- */}
        <div
          className="d-none d-lg-flex align-items-center gap-2"
          style={{ flexShrink: 0 }}
        >
          {/* Compact search — far right */}
          <SearchControls
            key={`${activeSearch}|${activeCategory}`}
            initialSearch={activeSearch}
            initialCategory={activeCategory}
            onSearch={handleSearchSubmit}
            compact
          />

          {/* Auth Actions */}
          {isAuth ? (
            <>
              <Link
                to="/profile"
                className="btn btn-sm"
                style={{
                  background: "transparent",
                  color: "var(--holocene-green)",
                  border: "1px solid var(--holocene-green)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                👤 {user?.firstname || "Profile"}
              </Link>
              <Link
                to="/my-articles"
                className="btn btn-sm"
                style={{
                  background: "transparent",
                  color: "var(--holocene-green)",
                  border: "1px solid var(--holocene-green)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                My Articles
              </Link>
              {canAdmin && (
                <Link
                  to="/admin"
                  className="btn btn-sm"
                  style={{
                    background: "var(--holocene-gold)",
                    color: "var(--holocene-green)",
                    fontWeight: 700,
                    border: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleLogout}
                style={{ whiteSpace: "nowrap" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-sm"
                style={{
                  background: "transparent",
                  color: "var(--holocene-green)",
                  border: "1px solid var(--holocene-green)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-sm"
                style={{
                  background: "var(--holocene-green)",
                  color: "var(--holocene-cream)",
                  border: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* ---------- Mobile Toggle ---------- */}
        <button
          type="button"
          className="btn d-lg-none p-1"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          style={{ border: "1px solid var(--holocene-line)", flexShrink: 0 }}
        >
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>
            {open ? "✕" : "☰"}
          </span>
        </button>
      </nav>

      {/* ================= Mobile Drawer ================= */}
      {open && (
        <div
          id="mobile-nav"
          className="d-lg-none container pb-3 pt-2 d-flex flex-column gap-3 border-top"
        >
          <div className="d-flex flex-column gap-2">
            <Link
              to="/"
              onClick={closeMobile}
              style={{ textDecoration: "none", color: "var(--holocene-ink)" }}
            >
              Home
            </Link>
            <Link
              to="/blogs"
              onClick={closeMobile}
              style={{ textDecoration: "none", color: "var(--holocene-ink)" }}
            >
              Articles &amp; News
            </Link>
            <Link
              to="/about"
              onClick={closeMobile}
              style={{ textDecoration: "none", color: "var(--holocene-ink)" }}
            >
              About Us
            </Link>
          </div>

          <SearchControls
            key={`${activeSearch}|${activeCategory}`}
            initialSearch={activeSearch}
            initialCategory={activeCategory}
            onSearch={handleSearchSubmit}
          />

          <hr className="my-1" />

          {isAuth ? (
            <div className="d-flex flex-column gap-2">
              <Link to="/profile" onClick={closeMobile}>
                My Profile ({user?.firstname || "User"})
              </Link>
              <Link to="/my-articles" onClick={() => setOpen(false)}>
                My Articles
              </Link>
              {canAdmin && (
                <Link
                  to="/admin"
                  onClick={closeMobile}
                  style={{ color: "var(--holocene-green)", fontWeight: 700 }}
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                className="btn btn-outline-danger btn-sm mt-2"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Link
                to="/login"
                className="btn btn-outline-dark btn-sm flex-fill"
                onClick={closeMobile}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-sm flex-fill"
                style={{
                  background: "var(--holocene-green)",
                  color: "var(--holocene-cream)",
                }}
                onClick={closeMobile}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}