import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getBlogs, getTrendingBlogs } from "../API/index.js";
import BlogCard from "../components/BlogCard.jsx";

// ──────────────────────────────────────────────
// HERO CAROUSEL
// ──────────────────────────────────────────────
function HeroCarousel({ slides }) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (animating || idx === active) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setAnimating(false);
    }, 400);
  };

  const next = () => goTo((active + 1) % slides.length);
  const prev = () => goTo((active - 1 + slides.length) % slides.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 6000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, slides.length]);

  if (!slides.length) return null;
  const slide = slides[active];

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 16 }}>
      <div
        style={{
          background: "var(--holocene-green)",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          minHeight: 420,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          opacity: animating ? 0.3 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        {slide.coverImage?.secure_url && (
          <img
            src={slide.coverImage.secure_url}
            alt={slide.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.38,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(8,35,24,0.98) 0%, rgba(15,61,46,0.60) 50%, transparent 100%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 2, padding: "2.5rem 2rem 2rem" }}>
          <span
            style={{
              background: "var(--holocene-gold)",
              color: "#fff",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              padding: "0.22rem 0.8rem",
              borderRadius: 4,
              fontWeight: 700,
              textTransform: "uppercase",
              display: "inline-block",
              marginBottom: "0.75rem",
            }}
          >
            {slide.category}
          </span>
          <h2
            style={{
              color: "#fff",
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.4rem, 3vw, 2.1rem)",
              lineHeight: 1.2,
              marginBottom: "0.65rem",
              maxWidth: 640,
            }}
          >
            {slide.title}
          </h2>
          <p style={{ color: "rgba(246,241,228,0.82)", marginBottom: "1.2rem", maxWidth: 540, fontSize: "0.95rem" }}>
            {(slide.snippet || slide.content || "").slice(0, 140)}
          </p>
          <Link
            to={"/blogs/" + slide._id}
            style={{
              background: "var(--holocene-gold)",
              color: "#fff",
              padding: "0.55rem 1.4rem",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: "0.9rem",
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            Read Article
          </Link>
        </div>
      </div>

      <button
        onClick={prev}
        style={{
          position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)",
          zIndex: 5, background: "rgba(8,35,24,0.55)", color: "#fff", border: "none",
          width: 38, height: 38, borderRadius: "50%", fontSize: "1.5rem", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        aria-label="Previous"
      >
        ‹
      </button>
      <button
        onClick={next}
        style={{
          position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)",
          zIndex: 5, background: "rgba(8,35,24,0.55)", color: "#fff", border: "none",
          width: 38, height: 38, borderRadius: "50%", fontSize: "1.5rem", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        aria-label="Next"
      >
        ›
      </button>

      <div style={{ position: "absolute", bottom: 14, right: 16, display: "flex", gap: 6, zIndex: 5 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={"Slide " + (i + 1)}
            style={{
              width: i === active ? 22 : 8,
              height: 8,
              borderRadius: 4,
              border: "none",
              background: i === active ? "var(--holocene-gold)" : "rgba(255,255,255,0.45)",
              cursor: "pointer",
              padding: 0,
              transition: "width .3s, background .3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// BREAKING NEWS TICKER
// ──────────────────────────────────────────────
function NewsTicker({ items }) {
  if (!items.length) return null;
  const repeated = [...items, ...items];
  return (
    <div
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
          background: "var(--holocene-gold)",
          color: "#fff",
          padding: "0 1rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          height: "100%",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          textTransform: "uppercase",
          fontSize: "0.7rem",
        }}
      >
        LIVE
      </span>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div className="ticker-track">
          {repeated.map((b, i) => (
            <Link
              key={i}
              to={"/blogs/" + b._id}
              style={{
                color: "var(--holocene-cream)",
                marginRight: "3rem",
                whiteSpace: "nowrap",
                fontWeight: i % items.length === 0 ? 600 : 400,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              {b.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// CATEGORY STRIP
// ──────────────────────────────────────────────
const DISPLAY_CATEGORIES = [
  { id: "headlines", label: "Headlines", emoji: "📰" },
  { id: "politics", label: "Politics", emoji: "🏛️" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬" },
  { id: "technology", label: "Technology", emoji: "💻" },
  { id: "business", label: "Business", emoji: "📊" },
  { id: "health", label: "Health", emoji: "❤️" },
  { id: "world", label: "World", emoji: "🌍" },
  { id: "fintech", label: "Fintech", emoji: "💳" },
  { id: "education", label: "Education", emoji: "📚" },
];

function CategoryStrip() {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        paddingBottom: "0.35rem",
        scrollbarWidth: "none",
      }}
    >
      {DISPLAY_CATEGORIES.map((c) => (
        <Link
          key={c.id}
          to={"/blogs?category=" + c.id}
          className="holocene-cat-chip"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "#fff",
            border: "1px solid var(--holocene-line)",
            borderRadius: 24,
            padding: "0.38rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--holocene-ink)",
            whiteSpace: "nowrap",
            textDecoration: "none",
            transition: "all .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--holocene-green)";
            e.currentTarget.style.color = "var(--holocene-cream)";
            e.currentTarget.style.borderColor = "var(--holocene-green)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "var(--holocene-ink)";
            e.currentTarget.style.borderColor = "var(--holocene-line)";
          }}
        >
          <span>{c.emoji}</span>
          <span>{c.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// SKELETON CARD
// ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--holocene-line)", borderRadius: 8, overflow: "hidden" }}>
      <div className="holocene-skeleton" style={{ height: 180 }} />
      <div style={{ padding: "1rem" }}>
        <div className="holocene-skeleton" style={{ height: 12, width: 60, marginBottom: 10, borderRadius: 4 }} />
        <div className="holocene-skeleton" style={{ height: 18, marginBottom: 8, borderRadius: 4 }} />
        <div className="holocene-skeleton" style={{ height: 14, marginBottom: 6, borderRadius: 4 }} />
        <div className="holocene-skeleton" style={{ height: 14, width: "70%", borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SECTION HEADER
// ──────────────────────────────────────────────
function SectionHeader({ title, link, linkLabel }) {
  return (
    <div
      className="d-flex justify-content-between align-items-baseline mb-4"
      style={{ borderBottom: "2px solid var(--holocene-green)", paddingBottom: "0.65rem" }}
    >
      <h2 style={{ fontFamily: "var(--font-serif)", margin: 0, fontSize: "clamp(1.3rem, 2.5vw, 1.7rem)" }}>
        {title}
      </h2>
      {link && (
        <Link to={link} style={{ color: "var(--holocene-green)", fontSize: "0.9rem", fontWeight: 600 }}>
          {linkLabel || "View all →"}
        </Link>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN HOME PAGE
// ──────────────────────────────────────────────
export default function Home() {
  const [latest, setLatest] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [a, b] = await Promise.all([
        getBlogs({ page: 1, limit: 9 }),
        getTrendingBlogs({ limit: 6 }),
      ]);
      setLatest(a.data?.data || []);
      setTrending(b.data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const featured = latest.slice(0, 5);
  const latestRest = latest.slice(5);
  const gridBlogs = latestRest.length > 0 ? latestRest : latest.slice(1);

  return (
    <>
      {/* BREAKING TICKER */}
      {!loading && trending.length > 0 && <NewsTicker items={trending} />}

      {/* HERO */}
      <section style={{ background: "var(--holocene-offwhite)", padding: "2rem 0 1.5rem" }}>
        <div className="container">
          <div className="row g-4 align-items-start">
            {/* Carousel col */}
            <div className="col-lg-7">
              {loading ? (
                <div className="holocene-skeleton" style={{ height: 420, borderRadius: 16 }} />
              ) : featured.length > 0 ? (
                <HeroCarousel slides={featured} />
              ) : (
                <div
                  style={{
                    height: 420,
                    background: "var(--holocene-green)",
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    color: "var(--holocene-cream)",
                    gap: "1rem",
                  }}
                >
                  <div style={{ fontSize: "3rem" }}>📰</div>
                  <p>No articles yet — come back soon!</p>
                </div>
              )}
            </div>

            {/* Side info panel */}
            <div className="col-lg-5">
              <div
                style={{
                  background: "var(--holocene-green)",
                  borderRadius: 14,
                  padding: "1.75rem",
                  minHeight: 420,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      letterSpacing: "0.3em",
                      color: "var(--holocene-gold)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    THE
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "2.2rem",
                      fontWeight: 700,
                      color: "var(--holocene-cream)",
                      lineHeight: 1,
                      margin: "0.15rem 0 0.25rem",
                    }}
                  >
                    Holocene
                  </div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.25em",
                      color: "var(--holocene-gold-soft)",
                      marginBottom: "1.25rem",
                    }}
                  >
                    news of our time
                  </div>
                  <p style={{ color: "rgba(246,241,228,0.8)", fontSize: "0.93rem", lineHeight: 1.65 }}>
                    Real stories. Fresh perspectives. THE Holocene brings you
                    the news, ideas and conversations shaping our world today.
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      color: "var(--holocene-gold)",
                      fontSize: "0.7rem",
                      letterSpacing: "0.15em",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Trending Now
                  </div>

                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="holocene-skeleton" style={{ height: 16, marginBottom: 12, borderRadius: 4 }} />
                    ))
                  ) : trending.slice(0, 4).map((b, i) => (
                    <Link
                      key={b._id}
                      to={"/blogs/" + b._id}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "flex-start",
                        marginBottom: "0.85rem",
                        textDecoration: "none",
                        opacity: 1,
                        transition: "opacity .2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <span
                        style={{
                          color: "var(--holocene-gold)",
                          fontFamily: "var(--font-serif)",
                          fontWeight: 700,
                          fontSize: "1.1rem",
                          lineHeight: 1,
                          flexShrink: 0,
                          minWidth: 22,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        style={{
                          color: "var(--holocene-cream)",
                          fontSize: "0.87rem",
                          lineHeight: 1.35,
                          fontWeight: i === 0 ? 600 : 400,
                        }}
                      >
                        {b.title.length > 65 ? b.title.slice(0, 65) + "…" : b.title}
                      </span>
                    </Link>
                  ))}

                  <Link
                    to="/blogs"
                    style={{
                      display: "block",
                      textAlign: "center",
                      marginTop: "1rem",
                      background: "var(--holocene-gold)",
                      color: "#fff",
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: "0.87rem",
                      textDecoration: "none",
                      transition: "opacity .2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Explore All Articles →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--holocene-line)", padding: "0.75rem 0" }}>
        <div className="container">
          <CategoryStrip />
        </div>
      </div>

      {/* LATEST STORIES */}
      <section className="container" style={{ marginTop: "3rem", marginBottom: "3rem" }}>
        <SectionHeader title="Latest Stories" link="/blogs" linkLabel="View all →" />

        {error ? (
          <div className="alert alert-danger">
            {error}{" "}
            <button className="btn btn-sm btn-outline-danger ms-2" onClick={load}>Retry</button>
          </div>
        ) : loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : gridBlogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--holocene-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📰</div>
            <p>No articles yet. Check back soon!</p>
          </div>
        ) : (
          <div className="row g-4">
            {gridBlogs.map((b, i) => (
              <div key={b._id} className="col-md-6 col-lg-4 holocene-card-animate" style={{ animationDelay: (i * 0.07) + "s" }}>
                <BlogCard blog={b} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TRENDING */}
      {!loading && trending.length > 0 && (
        <section style={{ background: "var(--holocene-cream)", padding: "3rem 0" }}>
          <div className="container">
            <SectionHeader title="🔥 Most Popular" />
            <div className="row g-4">
              {trending.slice(0, 6).map((b, i) => (
                <div key={b._id} className="col-md-6 col-lg-4 holocene-card-animate" style={{ animationDelay: (i * 0.06) + "s" }}>
                  <BlogCard blog={b} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      <section style={{ background: "var(--holocene-green)", padding: "4rem 0" }}>
        <div className="container text-center">
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📬</div>
            <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--holocene-cream)", marginBottom: "0.75rem" }}>
              Stay informed
            </h3>
            <p style={{ color: "var(--holocene-gold-soft)", marginBottom: "1.5rem" }}>
              Join thousands of readers getting the best of THE Holocene — real news, real perspectives.
            </p>
            <Link
              to="/register"
              style={{
                background: "var(--holocene-gold)",
                color: "#fff",
                padding: "0.75rem 2.5rem",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: "1rem",
                display: "inline-block",
                textDecoration: "none",
                transition: "transform .2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}