import axios from "axios";
import cookies from "../utils/cookies.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach token from cookie to every request
api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize errors + auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message || "Something went wrong";
    const url = err.config?.url || "";

    const isAuthEndpoint =
      url.includes("/users/login") ||
      url.includes("/users/register") ||
      url.includes("/admins/login") ||
      url.includes("/admins/register") ||
      url.includes("/users/forgot-password") ||
      url.includes("/users/reset-password");

    if (status === 401 && !isAuthEndpoint) {
      cookies.remove("token", { path: "/" });
      cookies.remove("user", { path: "/" });

      const path = window.location.pathname;
      if (path.startsWith("/admin")) {
        window.location.href = "/admin/login";
      } else if (path.startsWith("/profile") || path.startsWith("/my-articles")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject({ status, message, raw: err });
  }
);

export default api;