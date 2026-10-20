import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { getAllBlogs, approveBlog, rejectBlog } from "../api/index.js";

const rejectSchema = Yup.object({
  reason: Yup.string().trim().min(3, "Give a reason").required("Reason is required"),
});

export default function AdminApprovals() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllBlogs({ status: "pending", limit: 50 });
      setBlogs(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveBlog(id);
      load();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  return (
    <>
      <h4 style={{ marginBottom: "1rem" }}>Pending Approvals ({blogs.length})</h4>

      {loading ? (
        <p>Loading…</p>
      ) : blogs.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--holocene-line)",
            borderRadius: 8,
            padding: "3rem",
            textAlign: "center",
            color: "var(--holocene-muted)",
          }}
        >
          No pending articles. All clear! ✓
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--holocene-line)",
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          <table className="table mb-0 align-middle">
            <thead style={{ background: "var(--holocene-cream)" }}>
              <tr>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Title</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Author</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Category</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Submitted</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b._id}>
                  <td style={{ maxWidth: 340 }}>{b.title}</td>
                  <td>
                    {b.author?.firstname} {b.author?.lastname}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{b.category}</td>
                  <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      <button className="btn btn-sm btn-success" onClick={() => handleApprove(b._id)}>
                        Approve
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setRejecting(b)}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setRejecting(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: 8,
              maxWidth: 480,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 style={{ marginBottom: "0.75rem" }}>Reject: {rejecting.title}</h5>
            <Formik
              initialValues={{ reason: "" }}
              validationSchema={rejectSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  await rejectBlog(rejecting._id, values);
                  setRejecting(null);
                  load();
                } catch (err) {
                  alert(err.message || "Failed");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <label className="form-label">Reason for rejection</label>
                  <Field
                    as="textarea"
                    name="reason"
                    rows={4}
                    className="form-control"
                    placeholder="Explain why this article is being rejected…"
                  />
                  <ErrorMessage name="reason" component="div" className="text-danger small mt-1" />
                  <div className="d-flex gap-2 justify-content-end mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => setRejecting(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                      {isSubmitting ? "Rejecting…" : "Confirm Reject"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </>
  );
}