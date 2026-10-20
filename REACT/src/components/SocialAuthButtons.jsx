import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function SocialAuthButtons({ actionText = "Sign in" }) {
  const { loginWithSocial } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading("google");
    setError("");
    try {
      // Prompt user or simulate Google OAuth credential response
      const mockGoogleUser = {
        email: "google.user@example.com",
        firstname: "Google",
        lastname: "User",
        photo: "https://lh3.googleusercontent.com/a/default-user=s96-c",
        provider: "google",
        providerId: `google_${Date.now()}`,
      };

      // If Google Client ID / SDK is initialized in window.google, we can use real Google token:
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback for dev mode
            loginWithSocial(mockGoogleUser).then(() => navigate("/"));
          }
        });
      } else {
        await loginWithSocial(mockGoogleUser);
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(null);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading("github");
    setError("");
    try {
      const mockGithubUser = {
        email: "github.developer@example.com",
        firstname: "GitHub",
        lastname: "Developer",
        photo: "https://avatars.githubusercontent.com/u/9919?v=4",
        provider: "github",
        providerId: `github_${Date.now()}`,
      };

      await loginWithSocial(mockGithubUser);
      navigate("/");
    } catch (err) {
      setError(err.message || "GitHub sign-in failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-100 my-3">
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="d-flex align-items-center my-3">
        <hr className="flex-grow-1 my-0" style={{ borderColor: "var(--holocene-line)" }} />
        <span className="px-2 text-muted" style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          OR CONTINUE WITH
        </span>
        <hr className="flex-grow-1 my-0" style={{ borderColor: "var(--holocene-line)" }} />
      </div>

      <div className="d-flex flex-column gap-2">
        {/* Google Button */}
        <button
          type="button"
          className="btn d-flex align-items-center justify-content-center gap-2 py-2"
          onClick={handleGoogleSignIn}
          disabled={!!loading}
          style={{
            background: "#ffffff",
            border: "1px solid var(--holocene-line)",
            color: "#3c4043",
            fontWeight: 600,
            fontSize: "0.9rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {loading === "google" ? "Connecting to Google..." : `${actionText} with Google`}
        </button>

        {/* GitHub Button */}
        <button
          type="button"
          className="btn d-flex align-items-center justify-content-center gap-2 py-2"
          onClick={handleGithubSignIn}
          disabled={!!loading}
          style={{
            background: "#24292e",
            border: "none",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.9rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          {loading === "github" ? "Connecting to GitHub..." : `${actionText} with GitHub`}
        </button>
      </div>
    </div>
  );
}
