import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../API/index.js";

// 8–72 characters: at least one lowercase, one uppercase, one number, one special character; no spaces.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,72}$/;

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!PASSWORD_PATTERN.test(newPassword)) {
      setError(
        "Use 8–72 characters with an uppercase letter, a lowercase letter, a number and a special character; no spaces"
      );
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

        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        {message && <div className="alert alert-success py-2">{message} Redirecting to login...</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="reset-new-password" className="form-label" style={{ fontWeight: 600, fontSize: "0.9rem" }}>New Password</label>
            <div className="input-group">
              <input
                id="reset-new-password"
                type={showNew ? "text" : "password"}
                className="form-control"
                placeholder="8–72 characters, upper & lower case, number, symbol"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Hide password" : "Show password"}
                aria-pressed={showNew}
                title={showNew ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showNew ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="reset-confirm-password" className="form-label" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Confirm Password</label>
            <div className="input-group">
              <input
                id="reset-confirm-password"
                type={showConfirm ? "text" : "password"}
                className="form-control"
                placeholder="Re-enter new password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                aria-pressed={showConfirm}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100"
            style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)", fontWeight: 600 }}
            disabled={loading || !!message}
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