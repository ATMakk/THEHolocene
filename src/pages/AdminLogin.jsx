import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function AdminLogin() {
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container my-5" style={{ maxWidth: 420 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--holocene-line)",
          borderRadius: 12,
          padding: "2rem",
        }}
      >
        <h3 style={{ fontFamily: "var(--font-serif)", textAlign: "center" }}>Admin Login</h3>
        <p style={{ textAlign: "center", color: "var(--holocene-muted)", marginBottom: "2rem" }}>
          Restricted access
        </p>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              const u = await loginAsAdmin(values.email, values.password);
              if (u.role !== "admin" && u.role !== "operator") {
                throw new Error("You do not have admin access");
              }
              navigate("/admin");
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
                <label className="form-label">Email</label>
                <Field type="email" name="email" className="form-control" />
                <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <Field type="password" name="password" className="form-control" />
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
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}