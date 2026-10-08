import { useEffect, useState } from "react";
import { getAllUsers } from "../api/index.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllUsers({ limit: 50 });
        setUsers(res.data?.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <h4 style={{ marginBottom: "1rem" }}>Users</h4>
      {loading ? (
        <p>Loading…</p>
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
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Name</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Email</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Tag</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Role</th>
                <th style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No users
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      {u.firstname} {u.lastname}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.tag ? `@${u.tag}` : "—"}</td>
                    <td>
                      <span className="badge bg-secondary">{u.role}</span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
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