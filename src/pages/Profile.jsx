import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { getMe, updateMe, updateProfilePicture, changePassword, deleteUser } from "../API/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { fileToBase64 } from "../utils/fileToBase64.js";

const profileSchema = Yup.object({
  firstname: Yup.string().trim().min(2, "Too short").required("Required"),
  lastname: Yup.string().trim().min(2, "Too short").required("Required"),
  tag: Yup.string().trim().optional(),
});

const passwordSchema = Yup.object({
  oldPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string().min(6, "At least 6 characters").required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your password"),
});

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getMe();
      setMe(res.data?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePhotoChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const base64 = await fileToBase64(f);
    try {
      const res = await updateProfilePicture({ photo: base64 });
      alert("Profile picture updated");
      setMe((m) => ({ ...m, profilePicture: { secure_url: res.data?.data?.photo } }));
      setUser((u) => ({ ...u, profilePicture: { secure_url: res.data?.data?.photo } }));
    } catch (err) {
      alert(err.message || "Cannot update picture");
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete your account? All your posts and comments will be permanently removed. This action cannot be undone."
      )
    ) {
      try {
        await deleteUser(me._id);
        alert("Your account has been deleted.");
        logout();
        window.location.href = "/";
      } catch (err) {
        alert(err.message || "Failed to delete account");
      }
    }
  };

  if (loading) return <div className="container my-5">Loading…</div>;
  if (!me) return <div className="container my-5">Not logged in</div>;

  return (
    <div className="container my-5" style={{ maxWidth: 900 }}>
      <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>My Profile</h2>

      <div className="row g-4">
        <div className="col-lg-4">
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
                me.profilePicture?.secure_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${me.firstname} ${me.lastname}`
                )}&background=0f3d2e&color=fff&size=200`
              }
              alt={me.firstname}
              style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", marginBottom: "1rem" }}
            />
            <h4 style={{ marginBottom: "0.25rem" }}>
              {me.firstname} {me.lastname}
            </h4>
            <p style={{ color: "var(--holocene-muted)", marginBottom: "1rem" }}>
              {me.tag ? `@${me.tag}` : me.email}
            </p>

            <label
              className="btn w-100"
              style={{
                background: "transparent",
                color: "var(--holocene-green)",
                border: "1px solid var(--holocene-green)",
                cursor: "pointer",
              }}
            >
              Change Profile Picture
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>
            <button
              className="btn w-100 mt-2"
              style={{
                background: "transparent",
                color: "#6c757d",
                border: "1px solid #6c757d",
              }}
              onClick={logout}
            >
              Logout
            </button>

            <hr className="my-3" />
            <button
              className="btn w-100 btn-outline-danger"
              style={{ fontSize: "0.85rem", fontWeight: 600 }}
              onClick={handleDeleteAccount}
            >
              🗑 Delete Account
            </button>
          </div>
        </div>

        <div className="col-lg-8">
          {/* Account info */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--holocene-line)",
              borderRadius: 8,
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <h5 style={{ marginBottom: "1rem" }}>Account Information</h5>
            <Formik
              initialValues={{
                firstname: me.firstname || "",
                lastname: me.lastname || "",
                tag: me.tag || "",
              }}
              validationSchema={profileSchema}
              onSubmit={async (values, { setSubmitting, setStatus }) => {
                try {
                  const res = await updateMe(me._id, values);
                  setMe(res.data?.data);
                  setUser({ ...user, ...res.data?.data });
                  setStatus({ success: "Profile updated" });
                } catch (err) {
                  setStatus({ error: err.message || "Update failed" });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, status }) => (
                <Form>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name</label>
                      <Field name="firstname" className="form-control" />
                      <ErrorMessage name="firstname" component="div" className="text-danger small mt-1" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name</label>
                      <Field name="lastname" className="form-control" />
                      <ErrorMessage name="lastname" component="div" className="text-danger small mt-1" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Username / Tag</label>
                    <Field name="tag" className="form-control" />
                    <ErrorMessage name="tag" component="div" className="text-danger small mt-1" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={me.email} disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <input className="form-control" value={me.role} disabled />
                  </div>
                  {status?.success && <div className="alert alert-success py-2">{status.success}</div>}
                  {status?.error && <div className="alert alert-danger py-2">{status.error}</div>}
                  <button
                    type="submit"
                    className="btn"
                    style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
                    disabled={isSubmitting}
                  >
                    Save Changes
                  </button>
                </Form>
              )}
            </Formik>
          </div>

          {/* Change password */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--holocene-line)",
              borderRadius: 8,
              padding: "1.5rem",
            }}
          >
            <h5 style={{ marginBottom: "1rem" }}>Change Password</h5>
            <Formik
              initialValues={{ oldPassword: "", newPassword: "", confirmPassword: "" }}
              validationSchema={passwordSchema}
              onSubmit={async (values, { setSubmitting, resetForm, setStatus }) => {
                try {
                  await changePassword({
                    oldPassword: values.oldPassword,
                    newPassword: values.newPassword,
                  });
                  resetForm();
                  setStatus({ success: "Password changed" });
                } catch (err) {
                  setStatus({ error: err.message || "Change failed" });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, status }) => (
                <Form>
                  <div className="mb-3">
                    <label className="form-label">Current Password</label>
                    <Field type="password" name="oldPassword" className="form-control" />
                    <ErrorMessage name="oldPassword" component="div" className="text-danger small mt-1" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <Field type="password" name="newPassword" className="form-control" />
                    <ErrorMessage name="newPassword" component="div" className="text-danger small mt-1" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm New Password</label>
                    <Field type="password" name="confirmPassword" className="form-control" />
                    <ErrorMessage name="confirmPassword" component="div" className="text-danger small mt-1" />
                  </div>
                  {status?.success && <div className="alert alert-success py-2">{status.success}</div>}
                  {status?.error && <div className="alert alert-danger py-2">{status.error}</div>}
                  <button
                    type="submit"
                    className="btn"
                    style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
                    disabled={isSubmitting}
                  >
                    Update Password
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