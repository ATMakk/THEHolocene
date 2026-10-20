import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLayout from "./components/AdminLayout.jsx";

// Public
import Home from "./pages/Home.jsx";
import Blogs from "./pages/Blogs.jsx";
import BlogDetail from "./pages/BlogDetail.jsx";
import About from "./pages/About.jsx";

// Auth
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

// User
import Profile from "./pages/Profile.jsx";
import MyArticles from "./pages/MyArticles.jsx";
import ArticleForm from "./pages/ArticleForm.jsx";

// Admin
import AdminHome from "./pages/AdminHome.jsx";
import AdminArticles from "./pages/AdminArticles.jsx";
import AdminApprovals from "./pages/AdminApprovals.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";
import AdminComments from "./pages/AdminComments.jsx";

function PublicShell({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "60vh" }}>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicShell><Home /></PublicShell>} />
      <Route path="/blogs" element={<PublicShell><Blogs /></PublicShell>} />
      <Route path="/blogs/:id" element={<PublicShell><BlogDetail /></PublicShell>} />
      <Route path="/about" element={<PublicShell><About /></PublicShell>} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected (any authenticated user) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<PublicShell><Profile /></PublicShell>} />
        <Route path="/my-articles" element={<PublicShell><MyArticles /></PublicShell>} />
        <Route path="/my-articles/new" element={<PublicShell><ArticleForm /></PublicShell>} />
        <Route path="/my-articles/edit/:id" element={<PublicShell><ArticleForm edit /></PublicShell>} />
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Route>
    </Routes>
  );
}