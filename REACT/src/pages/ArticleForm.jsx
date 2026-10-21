import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBlog,
  updateBlog,
  getMyBlogs,
  getAdminBlog,
  createAdminBlog,
  updateAdminBlog,
} from "../API/index.js";
import { fileToBase64 } from "../utils/fileToBase64.js";

const CATEGORIES = [
  "headlines",
  "politics",
  "sports",
  "entertainment",
  "technology",
  "education",
  "fintech",
  "business",
  "health",
  "world",
];

const schema = Yup.object({
  title: Yup.string().trim().min(5, "Title is too short").max(180).required("Title is required"),
  snippet: Yup.string().trim().max(300, "Max 300 characters").optional(),
  content: Yup.string().trim().min(50, "Content is too short").required("Content is required"),
  category: Yup.string().oneOf(CATEGORIES, "Choose a category").required("Category is required"),
  tags: Yup.string().optional(),
});

const EMPTY_ARTICLE = {
  title: "",
  snippet: "",
  content: "",
  category: "headlines",
  tags: "",
};

export default function ArticleForm({ edit = false, adminMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(() => (edit ? null : EMPTY_ARTICLE));
  const [cover, setCover] = useState(null);
  const [loadError, setLoadError] = useState("");
  const articlesPath = adminMode ? "/admin/articles" : "/my-articles";

  useEffect(() => {
    if (!edit) return;
    let cancelled = false;

    const loadArticle = async () => {
      try {
        const response = adminMode
          ? await getAdminBlog(id)
          : await getMyBlogs();
        const found = adminMode
          ? response.data?.data
          : (response.data?.data || []).find((blog) => blog._id === id);

        if (!found) throw new Error("Article not found");
        if (!cancelled) {
          setLoadError("");
          setInitial({
            title: found.title || "",
            snippet: found.snippet || "",
            content: found.content || "",
            category: found.category || "headlines",
            tags: (found.tags || []).join(", "),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || "Could not load article");
        }
      }
    };

    loadArticle();
    return () => {
      cancelled = true;
    };
  }, [edit, adminMode, id]);

  if (loadError) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger" role="alert">
          {loadError}
        </div>
        <button
          type="button"
          className="btn btn-outline-dark"
          onClick={() => navigate(articlesPath)}
        >
          Back to Articles
        </button>
      </div>
    );
  }
  if (!initial) return <div className="container my-5">Loading…</div>;

  const buildPayload = (values, saveAsDraft = false) => {
    const payload = {
      title: values.title,
      snippet: values.snippet,
      content: values.content,
      category: values.category,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };
    if (cover) payload.coverImage = cover;
    if (saveAsDraft) payload.saveAsDraft = true;
    return payload;
  };
  const formTitle = adminMode
    ? edit
      ? "Edit Article"
      : "Create Article"
    : edit
      ? "Edit Article"
      : "Create New Article";
  return (
    <div className="container my-5" style={{ maxWidth: 820 }}>
      <div
        className="mb-4"
        style={{ borderBottom: "2px solid var(--holocene-green)", paddingBottom: "0.65rem" }}
      >
        <h2 style={{ fontFamily: "var(--font-serif)", margin: 0 }}>
          {formTitle}
        </h2>
      </div>

      <div className="alert alert-info" style={{ fontSize: "0.9rem" }}>
        {adminMode
          ? edit
            ? "Saving changes preserves the article's current approval status."
            : "New articles created here are submitted as pending approval."
          : "Your article will be reviewed by an editor before it's published."}
      </div>

      <Formik
        initialValues={initial}
        validationSchema={schema}
        enableReinitialize
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            const payload = buildPayload(values, false);
            if (adminMode) {
              if (edit) await updateAdminBlog(id, payload);
              else await createAdminBlog(payload);
            } else if (edit) {
              await updateBlog(id, payload);
            } else {
              await createBlog(payload);
            }
            navigate(articlesPath);
          } catch (err) {
            setStatus(err.message || "Failed to save");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, status, values }) => {
          const submitLabel = isSubmitting
            ? "Saving…"
            : adminMode && edit
              ? "Save Changes"
              : edit
                ? "Save & Resubmit"
                : adminMode
                  ? "Create & Submit for Approval"
                  : "Submit for Approval";

          return (
            <Form>
            <div className="mb-3">
              <label className="form-label">Title</label>
              <Field name="title" className="form-control" placeholder="An engaging headline" />
              <ErrorMessage name="title" component="div" className="text-danger small mt-1" />
            </div>

            <div className="mb-3">
              <label className="form-label">Short Excerpt (optional)</label>
              <Field
                as="textarea"
                name="snippet"
                rows={2}
                className="form-control"
                maxLength={300}
                placeholder="A brief summary that will appear on cards"
              />
              <ErrorMessage name="snippet" component="div" className="text-danger small mt-1" />
            </div>

            <div className="mb-3">
              <label className="form-label">Category</label>
              <Field as="select" name="category" className="form-select">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="category" component="div" className="text-danger small mt-1" />
            </div>

            <div className="mb-3">
              <label className="form-label">Cover Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setCover(await fileToBase64(f));
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Content</label>
              <Field
                as="textarea"
                name="content"
                rows={14}
                className="form-control"
                placeholder="Write your article…"
              />
              <ErrorMessage name="content" component="div" className="text-danger small mt-1" />
            </div>

            <div className="mb-3">
              <label className="form-label">Tags (comma-separated)</label>
              <Field name="tags" className="form-control" placeholder="climate, environment, sustainability" />
              <ErrorMessage name="tags" component="div" className="text-danger small mt-1" />
            </div>

            {status && <div className="alert alert-danger py-2">{status}</div>}

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn"
                style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}
                disabled={isSubmitting}
              >
                {submitLabel}
              </button>

              {!edit && !adminMode && (
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "transparent",
                    color: "var(--holocene-green)",
                    border: "1px solid var(--holocene-green)",
                  }}
                  disabled={isSubmitting}
                  onClick={async () => {
                    try {
                      const payload = buildPayload(values, true);
                      await createBlog(payload);
                      navigate(articlesPath);
                    } catch (err) {
                      alert(err.message || "Failed to save draft");
                    }
                  }}
                >
                  Save as Draft
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => navigate(articlesPath)}
              >
                Cancel
              </button>
            </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}