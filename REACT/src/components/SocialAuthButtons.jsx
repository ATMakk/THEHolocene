import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { getGithubLoginUrl } from "../API/index.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
    }

    const handleLoad = () => {
      script.dataset.loaded = "true";
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      if (window.google?.accounts?.id) resolve();
      else reject(new Error("Google sign-in could not be initialized"));
    };
    const handleError = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      reject(new Error("Could not load Google sign-in"));
    };

    if (script.dataset.loaded === "true") {
      handleLoad();
    } else {
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      if (!script.isConnected) document.head.appendChild(script);
    }
  });
}

// Reads the payload of a signed token (Google credential / GitHub ticket) FOR DISPLAY ONLY.
// This is NOT verification: the server must verify the signature, audience/nonce, expiry and email.
function decodeTokenPayload(token) {
  try {
    const part = String(token).split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = decodeURIComponent(
      Array.from(atob(padded), (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const providerLabel = (provider) => (provider === "google" ? "Google" : "GitHub");

const socialErrorMessages = {
  github: "GitHub sign-in could not be completed. Please try again.",
  "github-config": "GitHub sign-in is not configured on this server.",
  "github-email":
    "Your GitHub account needs a verified primary email address to sign in.",
};

export default function SocialAuthButtons({ actionText = "Sign in" }) {
  const { loginWithSocial } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  // Account the provider returned, waiting for the user to confirm. No session exists until confirmed.
  const [pending, setPending] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const googleButton = useRef(null);
  const [nonce] = useState(() =>
    Array.from(
      window.crypto.getRandomValues(new Uint8Array(32)),
      (value) => value.toString(16).padStart(2, "0")
    ).join("")
  );

  // Google: show the account for confirmation instead of logging in straight away
  useEffect(() => {
    const button = googleButton.current;
    if (!GOOGLE_CLIENT_ID || !button) return undefined;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce,
          auto_select: false,
          callback: (response) => {
            setError("");
            if (!response?.credential) {
              setError("Google did not return a valid sign-in credential.");
              return;
            }
            const profile = decodeTokenPayload(response.credential);
            if (!profile?.email) {
              setError("Google did not return an email address for this account.");
              return;
            }
            if (profile.email_verified !== true) {
              setError("Your Google email address is not verified, so it can't be used to sign in.");
              return;
            }
            if (profile.nonce !== nonce) {
              setError("Google sign-in could not be validated. Please try again.");
              return;
            }
            setPending({
              provider: "google",
              email: profile.email,
              name: profile.name || "",
              picture: profile.picture || "",
              payload: { provider: "google", credential: response.credential, nonce },
            });
          },
        });
        window.google.accounts.id.renderButton(button, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: actionText === "Sign up" ? "signup_with" : "signin_with",
          shape: "rectangular",
          width: 360,
        });
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      });

    return () => {
      cancelled = true;
      button.replaceChildren();
    };
  }, [actionText, nonce]);

  // GitHub: the server redirects back with a short-lived signed ticket (?socialConfirm=...).
  // We show the GitHub account for confirmation; nothing is logged in until the user confirms.
  useEffect(() => {
    const ticket = searchParams.get("socialConfirm");
    if (!ticket) return;

    const next = new URLSearchParams(searchParams);
    next.delete("socialConfirm"); // keep the ticket out of the address bar / history
    setSearchParams(next, { replace: true });

    const profile = decodeTokenPayload(ticket);
    if (!profile?.email) {
      setError("GitHub sign-in could not be completed. Please try again.");
      return;
    }
    if (profile.exp && profile.exp * 1000 < Date.now()) {
      setError("This GitHub sign-in expired. Please try again.");
      return;
    }
    setError("");
    setPending({
      provider: "github",
      email: profile.email,
      name: profile.name || "",
      picture: profile.picture || profile.avatar || "",
      payload: { provider: "github", ticket },
    });
  }, [searchParams, setSearchParams]);

  const handleConfirm = async () => {
    if (!pending) return;
    setConfirming(true);
    setError("");
    try {
      await loginWithSocial(pending.payload);
      navigate("/");
    } catch (requestError) {
      setError(requestError.message || `${providerLabel(pending.provider)} sign-in failed.`);
      setPending(null); // credentials/tickets are single-use: start again after a failure
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    // Stop Google from silently re-selecting the same account next time
    window.google?.accounts?.id?.disableAutoSelect?.();
    setPending(null);
    setError("");
  };

  const providerError = socialErrorMessages[searchParams.get("socialError")];

  return (
    <div className="w-100 my-3">
      {(error || providerError) && (
        <div className="alert alert-danger py-2 small" role="alert">
          {error || providerError}
        </div>
      )}

      {pending && (
        <div
          className="border rounded-3 p-3 text-center"
          role="alertdialog"
          aria-live="polite"
          style={{ borderColor: "var(--holocene-line)" }}
        >
          <p className="fw-semibold mb-2">Confirm your {providerLabel(pending.provider)} account</p>
          {/^https:\/\//.test(pending.picture) && (
            <img
              src={pending.picture}
              alt=""
              width={56}
              height={56}
              referrerPolicy="no-referrer"
              style={{ borderRadius: "50%", objectFit: "cover" }}
              className="mb-2"
            />
          )}
          {pending.name && <div className="fw-medium">{pending.name}</div>}
          <div className="text-muted small mb-3">{pending.email}</div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary w-50"
              onClick={handleCancel}
              disabled={confirming}
            >
              Use a different account
            </button>
            <button
              type="button"
              className="btn w-50"
              onClick={handleConfirm}
              disabled={confirming}
              style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)", fontWeight: 600 }}
            >
              {confirming
                ? "Confirming…"
                : actionText === "Sign up"
                ? "Confirm & sign up"
                : "Confirm & sign in"}
            </button>
          </div>
        </div>
      )}

      {/* Kept mounted (hidden while confirming) so the Google button is not destroyed */}
      <div className={pending ? "d-none" : ""}>
        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1 my-0" style={{ borderColor: "var(--holocene-line)" }} />
          <span className="px-2 text-muted" style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            OR CONTINUE WITH
          </span>
          <hr className="flex-grow-1 my-0" style={{ borderColor: "var(--holocene-line)" }} />
        </div>

        <div className="d-flex flex-column gap-2 align-items-center">
          {GOOGLE_CLIENT_ID ? (
            <div
              ref={googleButton}
              aria-label={`${actionText} with Google`}
              className={loading === "google" ? "pe-none opacity-50" : ""}
            />
          ) : (
            <p className="small text-muted mb-1">
              Google sign-in is not configured.
            </p>
          )}

          <button
            type="button"
            className="btn d-flex align-items-center justify-content-center gap-2 py-2 w-100"
            onClick={() => {
              setError("");
              setLoading("github");
              window.location.assign(getGithubLoginUrl());
            }}
            disabled={!!loading || !!pending}
            style={{
              background: "#24292e",
              border: "none",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            {loading === "github"
              ? "Connecting to GitHub…"
              : `${actionText} with GitHub`}
          </button>
        </div>
      </div>
    </div>
  );
}