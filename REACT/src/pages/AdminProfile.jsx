import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { getAdminMe, updateAdmin } from "../API/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { fileToBase64 } from "../utils/fileToBase64.js";

const adminSchema = Yup.object({
  firstname: Yup.string().trim().min(2, "Too short").required("Required"),
  lastname: Yup.string().trim().min(2, "Too short").required("Required"),
  tag: Yup.string().trim().optional(),
});

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = async () => {
    try {
      setLoading(true);
      const res = await getAdminMe();
      setAdmin(res.data?.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const handlePhotoChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const base64 = await fileToBase64(f);
    try {
      const res = await updateAdmin(admin._id, { photo: base64 });
      alert("Admin profile picture updated!");
      setAdmin(res.data?.data);
      if (setUser && res.data?.data) {
        setUser((u) => ({ ...u, ...res.data.data }));
      }
    } catch (err) {
      alert(err.message || "Failed to update profile picture");
    }
  };

  if (loading) return <p>Loading Admin Profile…</p>;
  if (!admin) return <p className="text-danger">Could not load admin details.</p>;

  return (
    <div style={{ maxWidth: 850 }}>
      <h4 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>Admin Profile</h4>

      <div className="row g-4">
        {/* Left Column: Picture & Badge */}
        <div className="col-md-4">
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--holocene-line)",
              borderRadius: 8,
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <img
              src={
                admin.profilePicture?.secure_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${admin.firstname} ${admin.lastname}`
                )}&background=0f3d2e&color=fff&size=200`
              }
              alt={admin.firstname}
              style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: "1rem" }}
            />
            <h5 style={{ marginBottom: "0.25rem" }}>
              {admin.firstname} {admin.lastname}
            </h5>
            <div className="badge bg-success mb-2 text-capitalize">{admin.role}</div>
            <p style={{ color: "var(--holocene-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              ID Number: <strong>{admin.idNumber || "CC0001"}</strong>
            </p>

            <label
              className="btn btn-sm w-100"
              style={{
                background: "var(--holocene-green)",
                color: "var(--holocene-cream)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📷 Upload Profile Picture
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="col-md-8">
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--holocene-line)",
              borderRadius: 8,
              padding: "1.5rem",
            }}
          >
            <h6 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>Profile Information</h6>

            <Formik
              initialValues={{
                firstname: admin.firstname || "",
                lastname: admin.lastname || "",
                tag: admin.tag || "",
              }}
              validationSchema={adminSchema}
              onSubmit={async (values, { setSubmitting, setStatus }) => {
                try {
                  const res = await updateAdmin(admin._id, values);
                  setAdmin(res.data?.data);
                  setStatus({ success: "Admin profile updated successfully!" });
                } catch (err) {
                  setStatus({ error: err.message || "Failed to update admin profile" });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, status }) => (
                <Form>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                        First Name
                      </label>
                      <Field name="firstname" className="form-control" />
                      <ErrorMessage name="firstname" component="div" className="text-danger small mt-1" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                        Last Name
                      </label>
                      <Field name="lastname" className="form-control" />
                      <ErrorMessage name="lastname" component="div" className="text-danger small mt-1" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                      Tag / Title
                    </label>
                    <Field name="tag" className="form-control" placeholder="e.g. Senior Editor" />
                    <ErrorMessage name="tag" component="div" className="text-danger small mt-1" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                      Email Address
                    </label>
                    <input className="form-control" value={admin.email} disabled />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                      System ID Number
                    </label>
                    <input className="form-control" value={admin.idNumber || "N/A"} disabled />
                  </div>

                  {status?.success && <div className="alert alert-success py-2">{status.success}</div>}
                  {status?.error && <div className="alert alert-danger py-2">{status.error}</div>}

                  <button
                    type="submit"
                    className="btn"
                    style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)", fontWeight: 600 }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Profile"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
