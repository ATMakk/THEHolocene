import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { fileToBase64 } from "../utils/fileToBase64.js";
import SocialAuthButtons from "../components/SocialAuthButtons.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

// Local part as before; domain must end in a letters-only TLD of 2+ characters (rejects "a@b.1", "a@b")
const EMAIL_PATTERN =
  /^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)*\.[A-Z]{2,}$/i;

// Letters only (any language), at least 3 letters. One space, hyphen or apostrophe allowed BETWEEN letters.
// Numbers and symbols are rejected.
const NAME_PATTERN = /^(?=(?:[^\p{L}]*\p{L}){3})\p{L}+(?:[ '-]\p{L}+)*$/u;

// 4–24 characters, letters and numbers only, with at least one letter AND one number.
const TAG_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{4,24}$/;

// 8–72 characters: at least one lowercase, one uppercase, one number, one special character; no spaces.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,72}$/;

const schema = Yup.object({
  firstname: Yup.string()
    .trim()
    .max(50, "First name must be 50 characters or fewer")
    .matches(NAME_PATTERN, "First name must be letters only (at least 3), no numbers or symbols")
    .required("First name is required"),
  lastname: Yup.string()
    .trim()
    .max(50, "Last name must be 50 characters or fewer")
    .matches(NAME_PATTERN, "Last name must be letters only (at least 3), no numbers or symbols")
    .required("Last name is required"),
  email: Yup.string()
    .trim()
    .max(254, "Email is too long")
    .matches(EMAIL_PATTERN, "Enter a valid email address")
    .required("Email is required"),
  tag: Yup.string()
    .trim()
    .matches(TAG_PATTERN, {
      message: "Tag must be 4–24 characters, letters and numbers only, with at least one letter and one number",
      excludeEmptyString: true,
    })
    .optional(),
  password: Yup.string()
    .matches(
      PASSWORD_PATTERN,
      "Use 8–72 characters with an uppercase letter, a lowercase letter, a number and a special character; no spaces"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

function Brand() {
  return (
    <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <div style={{ fontFamily: "var(--font-serif)", lineHeight: 1 }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "var(--holocene-gold)", fontWeight: 700 }}>
            THE
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "var(--holocene-green)" }}>
            Holocene
          </div>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--holocene-muted)" }}>
            news of our time
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Register() {
  const { register, verifySignupOtp } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview]
  );

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Profile images must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setPhoto(base64);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoError("");
    } catch {
      setPhotoError("Could not read that image. Please choose another.");
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the six-digit code from your email.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");
    try {
      await verifySignupOtp(pendingEmail, otp, photo);
      navigate("/");
    } catch (error) {
      setOtpError(error.message || "Could not verify the code. Request a new code and try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--holocene-offwhite)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <Brand />
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--holocene-line)",
            borderRadius: 14,
            padding: "2.25rem",
            boxShadow: "0 4px 24px rgba(15,61,46,0.06)",
          }}
        >
          {pendingEmail ? (
            <>
              <h2 style={{ fontFamily: "var(--font-serif)", textAlign: "center", marginBottom: "0.35rem", fontSize: "1.6rem" }}>
                Verify your email
              </h2>
              <p className="text-center text-muted mb-4">
                If this address can be registered, a six-digit code was sent to{" "}
                <strong>{pendingEmail}</strong>. The code expires in 10 minutes.
              </p>
              <form onSubmit={handleVerifyOtp}>
                <label htmlFor="registration-otp" className="form-label fw-semibold">
                  Email verification code
                </label>
                <input
                  id="registration-otp"
                  type="text"
                  className="form-control text-center"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setOtpError("");
                  }}
                  aria-describedby={otpError ? "registration-otp-error" : undefined}
                />
                {otpError && (
                  <div id="registration-otp-error" className="text-danger small mt-2" role="alert">
                    {otpError}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn w-100 mt-3"
                  disabled={otpLoading || otp.length !== 6}
                  style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
                >
                  {otpLoading ? "Verifying…" : "Verify email and create account"}
                </button>
                <button
                  type="button"
                  className="btn btn-link w-100 mt-2"
                  onClick={() => {
                    setPendingEmail("");
                    setOtp("");
                    setOtpError("");
                  }}
                >
                  Back to sign-up details
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: "var(--font-serif)", textAlign: "center", marginBottom: "0.35rem", fontSize: "1.6rem" }}>
                Create Your Account
              </h2>
              <p style={{ textAlign: "center", color: "var(--holocene-muted)", marginBottom: "2rem", fontSize: "0.92rem" }}>
                Join THE Holocene community and be part of the conversation.
              </p>

              <Formik
                initialValues={{ firstname: "", lastname: "", email: "", tag: "", password: "", confirmPassword: "" }}
                validationSchema={schema}
                onSubmit={async (values, { setSubmitting, setStatus }) => {
                  setStatus("");
                  try {
                    const payload = {
                      ...values,
                      firstname: values.firstname.trim(),
                      lastname: values.lastname.trim(),
                      tag: values.tag.trim(),
                      email: values.email.trim().toLowerCase(),
                    };
                    delete payload.confirmPassword;
                    await register(payload);
                    setPendingEmail(payload.email);
                  } catch (error) {
                    setStatus(error.message || "Could not request email verification.");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting, status }) => (
                  <Form noValidate>
                    {photoPreview && (
                      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                        <img
                          src={photoPreview}
                          alt="Profile preview"
                          style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--holocene-green)" }}
                        />
                      </div>
                    )}

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="register-firstname" className="form-label fw-semibold">First Name</label>
                        <Field id="register-firstname" name="firstname" className="form-control" autoComplete="given-name" maxLength={50} />
                        <ErrorMessage name="firstname" component="div" className="text-danger small mt-1" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="register-lastname" className="form-label fw-semibold">Last Name</label>
                        <Field id="register-lastname" name="lastname" className="form-control" autoComplete="family-name" maxLength={50} />
                        <ErrorMessage name="lastname" component="div" className="text-danger small mt-1" />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="register-email" className="form-label fw-semibold">Email Address</label>
                      <Field id="register-email" type="email" name="email" className="form-control" autoComplete="email" maxLength={254} />
                      <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="register-tag" className="form-label fw-semibold">
                        Username / Tag <span className="text-muted fw-normal">(optional)</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text" style={{ background: "var(--holocene-cream)", color: "var(--holocene-muted)" }}>@</span>
                        <Field id="register-tag" name="tag" className="form-control" autoComplete="username" maxLength={24} />
                      </div>
                      <div className="form-text"></div>
                      <ErrorMessage name="tag" component="div" className="text-danger small mt-1" />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="register-photo" className="form-label fw-semibold">
                        Profile Picture <span className="text-muted fw-normal">(optional, max 5 MB)</span>
                      </label>
                      <input
                        id="register-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="form-control"
                        onChange={handlePhotoChange}
                      />
                      {photoError && <div className="text-danger small mt-1" role="alert">{photoError}</div>}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="register-password" className="form-label fw-semibold">Password</label>
                      <PasswordInput
                        id="register-password"
                        name="password"
                        autoComplete="new-password"
                        maxLength={72}
                      />
                      <div className="form-text"></div>
                      <ErrorMessage name="password" component="div" className="text-danger small mt-1" />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="register-confirm-password" className="form-label fw-semibold">Confirm Password</label>
                      <PasswordInput
                        id="register-confirm-password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        maxLength={72}
                      />
                      <ErrorMessage name="confirmPassword" component="div" className="text-danger small mt-1" />
                    </div>

                    {status && <div className="alert alert-danger py-2" role="alert">{status}</div>}

                    <button
                      id="register-submit"
                      type="submit"
                      className="btn w-100"
                      disabled={isSubmitting || !!photoError}
                      style={{
                        background: "var(--holocene-green)",
                        color: "var(--holocene-cream)",
                        padding: "0.65rem",
                        fontSize: "1rem",
                        fontWeight: 600,
                        borderRadius: 8,
                      }}
                    >
                      {isSubmitting ? "Sending verification code…" : "Continue"}
                    </button>

                    <SocialAuthButtons actionText="Sign up" />
                    <p style={{ textAlign: "center", marginTop: "1.25rem", marginBottom: 0, fontSize: "0.9rem" }}>
                      Already have an account?{" "}
                      <Link to="/login" style={{ fontWeight: 600 }}>Login</Link>
                    </p>
                  </Form>
                )}
              </Formik>
            </>
          )}
        </div>
      </div>
    </div>
  );
}