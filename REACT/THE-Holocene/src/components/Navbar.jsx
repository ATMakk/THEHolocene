import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

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

export default function Navbar() {
  const { user, isAuth, canAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCat, setSelectedCat] = useState(searchParams.get("category") || "all");
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (selectedCat && selectedCat !== "all") params.set("category", selectedCat);
    navigate(`/blogs?${params.toString()}`);
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1050,
        background: "#ffffff",
        borderBottom: "1px solid var(--holocene-line)",
        boxShadow: "0 2px 15px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top Utility Bar */}
      <div style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}>
        <div
          className="container d-flex justify-content-between align-items-center py-1.5"
          style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ color: "var(--holocene-gold)", fontWeight: 700 }}>● LIVE</span>
            <span>THE HOLOCENE NEWS DESK & MEDIA HOUSE</span>
          </div>
          <span className="d-none d-md-inline" style={{ letterSpacing: 0, textTransform: "none", opacity: 0.9 }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="container py-2.5 d-flex align-items-center justify-content-between gap-3">
        {/* Brand Logo tailored to THE Holocene News Desk / Agency */}
        <Link to="/" className="d-flex align-items-center gap-2.5" style={{ textDecoration: "none" }}>
          {/* Custom Holocene Media Emblem Icon */}
          <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="20" fill="var(--holocene-green)" />
            <circle cx="50" cy="50" r="34" stroke="var(--holocene-gold)" strokeWidth="3" fill="none" strokeDasharray="6 4" />
            <path d="M30 36H70M30 50H70M30 64H52" stroke="var(--holocene-cream)" strokeWidth="5" strokeLinecap="round" />
            <circle cx="64" cy="64" r="7" fill="var(--holocene-gold)" />
          </svg>

          <div style={{ fontFamily: "var(--font-serif)", lineHeight: 1.05 }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.35em", color: "var(--holocene-gold)", fontWeight: 700 }}>
              THE
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--holocene-green)", letterSpacing: "-0.02em" }}>
              Holocene
            </div>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", color: "var(--holocene-muted)", textTransform: "uppercase" }}>
              News Desk & Agency
            </div>
          </div>
        </Link>

        {/* Integrated Category & Keyword Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="d-none d-lg-flex align-items-center"
          style={{
            background: "#f8f9fa",
            border: "1px solid var(--holocene-line)",
            borderRadius: 24,
            padding: "2px 6px 2px 14px",
            maxWidth: 460,
            width: "100%",
          }}
        >
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "0.8rem",
              color: "var(--holocene-ink)",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              marginRight: 8,
              textTransform: "capitalize",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>
          <div style={{ width: 1, height: 18, background: "var(--holocene-line)", marginRight: 8 }} />
          <input
            type="text"
            placeholder="Search news titles or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "0.85rem",
              width: "100%",
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
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        {/* Desktop Links */}
        <div className="d-none d-md-flex gap-4 align-items-center">
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--holocene-green)" : "var(--holocene-ink)",
              textDecoration: "none",
              fontSize: "0.95rem",
            })}
          >
            Home
          </NavLink>
          <NavLink
            to="/blogs"
            style={({ isActive }) => ({
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--holocene-green)" : "var(--holocene-ink)",
              textDecoration: "none",
              fontSize: "0.95rem",
            })}
          >
            Articles
          </NavLink>
          <NavLink
            to="/about"
            style={({ isActive }) => ({
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--holocene-green)" : "var(--holocene-ink)",
              textDecoration: "none",
              fontSize: "0.95rem",
            })}
          >
            About
          </NavLink>
        </div>

        {/* Desktop Auth Actions */}
        <div className="d-none d-md-flex gap-2 align-items-center">
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
                }}
              >
                👤 {user.firstname}
              </Link>
              <Link
                to="/my-articles"
                className="btn btn-sm"
                style={{
                  background: "transparent",
                  color: "var(--holocene-green)",
                  border: "1px solid var(--holocene-green)",
                  fontWeight: 600,
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
                  }}
                >
                  Admin Panel
                </Link>
              )}
              <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
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
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="btn d-md-none p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle Navigation"
          style={{ border: "1px solid var(--holocene-line)" }}
        >
          <span style={{ fontSize: "1.4rem" }}>{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="d-md-none container pb-3 pt-2 d-flex flex-column gap-3 border-top">
          <form onSubmit={handleSearchSubmit} className="d-flex align-items-center gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-sm btn-dark">
              Search
            </button>
          </form>

          <div className="d-flex flex-column gap-2">
            <Link to="/" onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "var(--holocene-ink)" }}>
              Home
            </Link>
            <Link to="/blogs" onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "var(--holocene-ink)" }}>
              Articles & News
            </Link>
            <Link to="/about" onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "var(--holocene-ink)" }}>
              About Us
            </Link>
          </div>

          <hr className="my-1" />
          {isAuth ? (
            <div className="d-flex flex-column gap-2">
              <Link to="/profile" onClick={() => setOpen(false)}>
                My Profile ({user.firstname})
              </Link>
              <Link to="/my-articles" onClick={() => setOpen(false)}>
                My Articles
              </Link>
              {canAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)} style={{ color: "var(--holocene-green)", fontWeight: 700 }}>
                  Admin Dashboard
                </Link>
              )}
              <button className="btn btn-outline-danger btn-sm mt-2" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-outline-dark btn-sm flex-fill" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-sm flex-fill"
                style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
                onClick={() => setOpen(false)}
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