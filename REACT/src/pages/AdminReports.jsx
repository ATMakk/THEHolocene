import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReportedBlogs } from "../API/index.js";

export default function AdminReports() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getReportedBlogs()
      .then((response) => {
        setBlogs(response.data?.data || []);
      })
      .catch((requestError) => {
        setError(requestError.message || "Failed to load reported articles");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <h4 style={{ marginBottom: "1rem" }}>Reported Articles</h4>
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : loading ? (
        <p>Loading reports…</p>
      ) : blogs.length === 0 ? (
        <div className="alert alert-success">No reported articles. All clear!</div>
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
                <th>Article</th>
                <th>Author</th>
                <th>Reports</th>
                <th>Reasons</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id}>
                  <td>
                    <Link to={`/blogs/${blog._id}`}>{blog.title}</Link>
                    <div className="small text-muted text-capitalize">{blog.category}</div>
                  </td>
                  <td>
                    {blog.author
                      ? `${blog.author.firstname} ${blog.author.lastname}`
                      : "Unknown"}
                  </td>
                  <td>{blog.reports?.length || 0}</td>
                  <td>
                    {blog.reports?.length ? (
                      <ul className="mb-0 ps-3">
                        {blog.reports.map((report, index) => (
                          <li key={`${report.createdAt || "report"}-${index}`}>
                            {report.reason || "No reason given"}
                            {report.createdAt && (
                              <span className="text-muted">
                                {" "}
                                ({new Date(report.createdAt).toLocaleDateString()})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No details provided"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
