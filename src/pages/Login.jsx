import { Formik, Form, Field, ErrorMessage } from "formik";
import SocialAuthButtons from "../components/SocialAuthButtons.jsx";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const schema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container my-5" style={{ maxWidth: 420 }}>
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
        }}
      >
        <h3 style={{ fontFamily: "var(--font-serif)", textAlign: "center", marginBottom: "0.25rem" }}>
          Welcome Back
        </h3>
        <p style={{ textAlign: "center", color: "var(--holocene-muted)", marginBottom: "2rem" }}>
          Sign in to your account
        </p>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              await login(values.email, values.password);
              navigate("/");
            } catch (err) {
              setStatus(err.message || "Invalid credentials");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form>
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <Field type="email" name="email" className="form-control" placeholder="you@example.com" />
                <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label mb-0">Password</label>
                  <Link to="/forgot-password" style={{ fontSize: "0.82rem", color: "var(--holocene-green)", fontWeight: 600 }}>
                    Forgot Password?
                  </Link>
                </div>
                <Field type="password" name="password" className="form-control" placeholder="Your password" />
                <ErrorMessage name="password" component="div" className="text-danger small mt-1" />
              </div>

              {status && <div className="alert alert-danger py-2">{status}</div>}

              <button
                type="submit"
                className="btn w-100"
                style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in…" : "Login"}
              </button>

              <SocialAuthButtons actionText="Sign in" />

              <p className="text-center mt-3 mb-0" style={{ fontSize: "0.9rem" }}>
                Don't have an account? <Link to="/register">Sign Up</Link>
              </p>
              <p className="text-center mt-2 mb-0" style={{ fontSize: "0.82rem", color: "var(--holocene-muted)" }}>
                Are you an admin? <Link to="/admin/login">Admin Login</Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}