import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { fileToBase64 } from "../utils/fileToBase64.js";
import SocialAuthButtons from "../components/SocialAuthButtons.jsx";

const schema = Yup.object({
  firstname: Yup.string().trim().min(2, "At least 2 characters").required("First name is required"),
  lastname: Yup.string().trim().min(2, "At least 2 characters").required("Last name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  tag: Yup.string().trim().optional(),
  password: Yup.string().min(6, "At least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const b64 = await fileToBase64(f);
    setPhoto(b64);
    setPhotoPreview(URL.createObjectURL(f));
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
        {/* Brand */}
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

        {/* Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--holocene-line)",
            borderRadius: 14,
            padding: "2.25rem",
            boxShadow: "0 4px 24px rgba(15,61,46,0.06)",
          }}
        >
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
              try {
                const { confirmPassword, ...payload } = values;
                if (photo) payload.photo = photo;
                await register(payload);
                navigate("/");
              } catch (err) {
                setStatus(err.message || "Registration failed. Please try again.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, status }) => (
              <Form>
                {/* Profile photo preview */}
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
                    <label className="form-label fw-semibold">First Name</label>
                    <Field name="firstname" className="form-control" />
                    <ErrorMessage name="firstname" component="div" className="text-danger small mt-1" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Last Name</label>
                    <Field name="lastname" className="form-control" />
                    <ErrorMessage name="lastname" component="div" className="text-danger small mt-1" />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <Field type="email" name="email" className="form-control" />
                  <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Username / Tag <span style={{ color: "var(--holocene-muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ background: "var(--holocene-cream)", color: "var(--holocene-muted)", border: "1px solid #ced4da" }}>@</span>
                    <Field name="tag" className="form-control" />
                  </div>
                  <ErrorMessage name="tag" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Profile Picture <span style={{ color: "var(--holocene-muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handlePhotoChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <Field type="password" name="password" className="form-control" />
                  <ErrorMessage name="password" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Confirm Password</label>
                  <Field type="password" name="confirmPassword" className="form-control" />
                  <ErrorMessage name="confirmPassword" component="div" className="text-danger small mt-1" />
                </div>

                {status && (
                  <div className="alert alert-danger py-2" style={{ fontSize: "0.9rem" }}>
                    {status}
                  </div>
                )}

                <button
                  id="register-submit"
                  type="submit"
                  className="btn w-100"
                  style={{
                    background: "var(--holocene-green)",
                    color: "var(--holocene-cream)",
                    padding: "0.65rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: 8,
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Creating account…
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </button>

                <SocialAuthButtons actionText="Sign up" />

                <p style={{ textAlign: "center", marginTop: "1.25rem", marginBottom: 0, fontSize: "0.9rem" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ fontWeight: 600 }}>Login</Link>
                </p>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}