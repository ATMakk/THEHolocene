import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function ProtectedRoute({ adminOnly = false }) {
  const { isAuth, canAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "var(--holocene-green)" }} />
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} replace />;
  }

  if (adminOnly && !canAdmin) {
    return (
      <div className="container my-5 text-center">
        <h1 style={{ fontSize: "4rem", color: "var(--holocene-gold)" }}>403</h1>
        <p>You don't have permission to view this page.</p>
        <a href="/" className="btn" style={{ background: "var(--holocene-green)", color: "var(--holocene-cream)" }}>
          Back to Home
        </a>
      </div>
    );
  }

  return <Outlet />;
}