import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllCommentsAdmin, deleteComment } from "../API/index.js";

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await getAllCommentsAdmin();
      setComments(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    try {
      await deleteComment(id);
      loadComments();
    } catch (err) {
      alert(err.message || "Failed to delete comment");
    }
  };

  const filteredComments = comments.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const contentMatch = c.content?.toLowerCase().includes(term);
    const authorMatch =
      c.author?.firstname?.toLowerCase().includes(term) ||
      c.author?.lastname?.toLowerCase().includes(term);
    const blogMatch = c.blog?.title?.toLowerCase().includes(term);
    return contentMatch || authorMatch || blogMatch;
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 style={{ margin: 0 }}>All Comments</h4>
        <input
          type="text"
          className="form-control"
          placeholder="Search comments by content, author, or article..."
          style={{ maxWidth: 350 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading comments…</p>
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
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Author</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Comment Content</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Article</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Date</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No comments found
                  </td>
                </tr>
              ) : (
                filteredComments.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600 }}>
                      {c.author ? `${c.author.firstname} ${c.author.lastname}` : "Anonymous"}
                    </td>
                    <td style={{ maxWidth: 300 }}>{c.content}</td>
                    <td style={{ maxWidth: 220 }}>
                      {c.blog ? (
                        <Link to={`/blogs/${c.blog._id}`}>{c.blog.title}</Link>
                      ) : (
                        <span className="text-muted">Deleted Article</span>
                      )}
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(c._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
