export default function About() {
  return (
    <div className="container my-5" style={{ maxWidth: 820 }}>
      <span
        style={{
          background: "var(--holocene-green)",
          color: "var(--holocene-cream)",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "0.25rem 0.7rem",
          borderRadius: 4,
        }}
      >
        About Us
      </span>
      <h1 style={{ fontFamily: "var(--font-serif)", marginTop: "0.75rem", marginBottom: "1.5rem" }}>
        Real Stories. Fresh Perspectives.
      </h1>
      <div style={{ fontSize: "1.1rem", lineHeight: 1.85 }}>
        <p>
          THE Holocene is a modern digital publication committed to bringing you the news, ideas
          and conversations shaping our world today.
        </p>
        <p>
          Our mission is simple: to inform, to inspire, and to give our readers the clarity they
          need to navigate an increasingly complex world.
        </p>
        <h2 style={{ fontFamily: "var(--font-serif)", marginTop: "2rem" }}>Our Values</h2>
        <p>
          Every story we publish is grounded in accuracy, fairness, and a commitment to
          understanding.
        </p>
        <h2 style={{ fontFamily: "var(--font-serif)", marginTop: "2rem" }}>Join Us</h2>
        <p>
          Whether you're here to read, to write, or to start a conversation — we're glad you're
          here. Welcome to THE Holocene.
        </p>
      </div>
    </div>
  );
}