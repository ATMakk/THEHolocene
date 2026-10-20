import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--holocene-green-dark)",
        color: "var(--holocene-cream)",
        padding: "3rem 0 1.5rem",
        marginTop: "5rem",
      }}
    >
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-6">
            <div style={{ fontFamily: "var(--font-serif)", lineHeight: 1, marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "var(--holocene-gold)" }}>THE</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>Holocene</div>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--holocene-gold-soft)" }}>
                news of our time
              </div>
            </div>
            <p style={{ color: "rgba(246,241,228,0.7)", maxWidth: 360 }}>
              Real stories. Fresh perspectives. The news, ideas and conversations shaping our world today.
            </p>
          </div>

          <div className="col-lg-3 col-6">
            <h5 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Explore</h5>
            <ul className="list-unstyled">
              <li><Link to="/" style={{ color: "var(--holocene-gold-soft)" }}>Home</Link></li>
              <li><Link to="/blogs" style={{ color: "var(--holocene-gold-soft)" }}>All Articles</Link></li>
              <li><Link to="/about" style={{ color: "var(--holocene-gold-soft)" }}>About</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-6">
            <h5 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Account</h5>
            <ul className="list-unstyled">
              <li><Link to="/login" style={{ color: "var(--holocene-gold-soft)" }}>Login</Link></li>
              <li><Link to="/register" style={{ color: "var(--holocene-gold-soft)" }}>Sign Up</Link></li>
              <li><Link to="/my-articles" style={{ color: "var(--holocene-gold-soft)" }}>Write for us</Link></li>
            </ul>
          </div>
        </div>

        <hr style={{ borderColor: "rgba(246,241,228,0.15)", margin: "2rem 0 1rem" }} />
        <p style={{ textAlign: "center", color: "rgba(246,241,228,0.6)", fontSize: "0.85rem", marginBottom: 0 }}>
          © {new Date().getFullYear()} THE Holocene — news of our time. All rights reserved.
        </p>
      </div>
    </footer>
  );
}