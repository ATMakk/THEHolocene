import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../API/index.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setResetUrl("");

    try {
      const res = await forgotPassword({ email });
      setMessage(res.data?.message || "Password reset request sent!");
      if (res.data?.resetUrl) {
        setResetUrl(res.data.resetUrl);
      }
    } catch (err) {
      setError(err.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5" style={{ maxWidth: 450 }}>
      <div className="text-center mb-4">
        <Link to="/" style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "var(--font-serif)", lineHeight: 1 }}>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "var(--holocene-gold)" }}>THE</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--holocene-green)" }}>Holocene</div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--holocene-muted)" }}>
              news of our time
            </div>
          </div>
        </Link>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--holocene-line)",
          borderRadius: 12,
          padding: "2rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <h4 style={{ fontFamily: "var(--font-serif)", textAlign: "center", marginBottom: "0.5rem" }}>
          Forgot Password
        </h4>
        <p style={{ textAlign: "center", color: "var(--holocene-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Enter your registered email address and we will send you instructions to reset your password.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {message && <div className="alert alert-success py-2">{message}</div>}

        {resetUrl && (
          <div className="alert alert-info py-2 text-break">
            <strong>Development Reset Link:</strong><br />
            <a href={resetUrl}>{resetUrl}</a>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn w-100"
            style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)", fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/login" style={{ fontSize: "0.85rem", color: "var(--holocene-green)", fontWeight: 600 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
