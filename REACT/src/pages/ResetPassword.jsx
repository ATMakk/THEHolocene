import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../API/index.js";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await resetPassword(token, { newPassword });
      setMessage(res.data?.message || "Password reset successful!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Token may be invalid or expired.");
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
          Set New Password
        </h4>
        <p style={{ textAlign: "center", color: "var(--holocene-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Enter your new password below.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {message && <div className="alert alert-success py-2">{message} Redirecting to login...</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.9rem" }}>New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="At least 4 characters"
              required
              minLength={4}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Re-enter new password"
              required
              minLength={4}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn w-100"
            style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)", fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
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
