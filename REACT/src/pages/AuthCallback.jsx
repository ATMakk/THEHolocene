import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function AuthCallback() {
  const { completeSocialLogin } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState("");
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token")
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    window.history.replaceState(null, "", window.location.pathname);
    if (!token) return;

    completeSocialLogin(token)
      .then(() => navigate("/", { replace: true }))
      .catch((loginError) => {
        setError(loginError.message || "Could not complete social sign-in.");
      });
  }, [completeSocialLogin, navigate, token]);

  return (
    <main className="container my-5 text-center" aria-live="polite">
      {error ? (
        <>
          <div className="alert alert-danger" role="alert">{error}</div>
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={() => navigate("/login", { replace: true })}
          >
            Return to login
          </button>
        </>
      ) : !token ? (
        <>
          <div className="alert alert-danger" role="alert">
            Social sign-in did not return a valid session. Please try again.
          </div>
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={() => navigate("/login", { replace: true })}
          >
            Return to login
          </button>
        </>
      ) : (
        <p>Completing secure sign-in…</p>
      )}
    </main>
  );
}
