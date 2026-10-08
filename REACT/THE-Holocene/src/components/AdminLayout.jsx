import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/articles", label: "Articles" },
  { to: "/admin/approvals", label: "Approvals" },
  { to: "/admin/comments", label: "Comments" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/profile", label: "My Profile" },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f5" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 230,
          background: "var(--holocene-green)",
          color: "var(--holocene-cream)",
          padding: "1.5rem 0",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 1.5rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontFamily: "var(--font-serif)", lineHeight: 1 }}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.3em", color: "var(--holocene-gold)" }}>THE</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>Holocene</div>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.25em", color: "var(--holocene-gold-soft)" }}>
                admin panel
              </div>
            </div>
          </Link>
        </div>

        <nav style={{ marginTop: "1rem" }}>
          {links.map((l) => {
            const isActive = l.end ? pathname === l.to : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  display: "block",
                  padding: "0.7rem 1.5rem",
                  color: "var(--holocene-cream)",
                  textDecoration: "none",
                  background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--holocene-gold)" : "3px solid transparent",
                  fontSize: "0.92rem",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {l.label}
              </Link>
            );
          })}
          <hr style={{ borderColor: "rgba(255,255,255,0.15)", margin: "1rem 0" }} />
          <Link
            to="/"
            style={{
              display: "block",
              padding: "0.5rem 1.5rem",
              color: "var(--holocene-gold-soft)",
              textDecoration: "none",
              fontSize: "0.85rem",
            }}
          >
            ← View Main Website
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.7rem 1.5rem",
              background: "transparent",
              color: "#ffc107",
              border: "none",
              fontSize: "0.92rem",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
        <div
          style={{
            background: "#fff",
            padding: "1rem 1.5rem",
            borderRadius: 8,
            marginBottom: "1.5rem",
            border: "1px solid var(--holocene-line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 style={{ margin: 0 }}>Admin Portal</h4>
          <Link
            to="/admin/profile"
            style={{ textDecoration: "none", color: "var(--holocene-ink)", fontSize: "0.88rem" }}
          >
            Signed in as{" "}
            <strong style={{ color: "var(--holocene-green)" }}>
              {user?.firstname} {user?.lastname}
            </strong>{" "}
            <span className="badge bg-secondary ms-1">{user?.role}</span>
          </Link>
        </div>
        <Outlet />
      </main>
    </div>
  );
}