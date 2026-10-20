import api from "./axios.js";

/* ---------------- AUTH / USERS ---------------- */
export const registerUser = (data) => api.post("/users/register", data);
export const loginUser = (data) => api.post("/users/login", data);
export const socialLogin = (data) => api.post("/users/social-login", data);
export const loginAdmin = (data) => api.post("/admins/login", data);
export const forgotPassword = (data) => api.post("/users/forgot-password", data);
export const resetPassword = (token, data) =>
  api.post(`/users/reset-password/${token}`, data);

export const getMe = () => api.get("/users/me");
export const updateMe = (id, data) => api.patch(`/users/${id}`, data);
export const updateProfilePicture = (data) => api.patch("/users/me/picture", data);
export const changePassword = (data) => api.patch("/users/me/password", data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

/* ---------------- BLOGS (public) ---------------- */
export const getBlogs = (params) => api.get("/blogs", { params });
export const getTrendingBlogs = (params) => api.get("/blogs/trending", { params });
export const getBlog = (id) => api.get(`/blogs/${id}`);
export const getRelatedBlogs = (id) => api.get(`/blogs/${id}/related`);
export const getBlogsByAuthor = (authorId, params) =>
  api.get(`/blogs/author/${authorId}`, { params });
export const shareBlog = (id) => api.post(`/blogs/${id}/share`);

/* ---------------- BLOGS (user) ---------------- */
export const createBlog = (data) => api.post("/blogs", data);
export const updateBlog = (id, data) => api.patch(`/blogs/${id}`, data);
export const deleteBlog = (id) => api.delete(`/blogs/${id}`);
export const getMyBlogs = (params) => api.get("/blogs/me/list", { params });
export const getMyBookmarks = () => api.get("/blogs/me/bookmarks");
export const toggleLike = (id) => api.post(`/blogs/${id}/like`);
export const toggleBookmark = (id) => api.post(`/blogs/${id}/bookmark`);
export const reportBlog = (id, data) => api.post(`/blogs/${id}/report`, data);

/* ---------------- COMMENTS ---------------- */
export const getComments = (blogId) => api.get(`/comments/blog/${blogId}`);
export const addComment = (blogId, data) =>
  api.post(`/comments/blog/${blogId}`, data);
export const updateComment = (commentId, data) =>
  api.patch(`/comments/${commentId}`, data);
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);
export const likeComment = (commentId) =>
  api.post(`/comments/${commentId}/like`);
export const getAllCommentsAdmin = () => api.get("/comments/admin/all");

/* ---------------- ADMIN ---------------- */
export const getAdminMe = () => api.get("/admins/me");
export const updateAdmin = (id, data) => api.patch(`/admins/${id}`, data);
export const getStats = () => api.get("/admins/dashboard/stats");
export const getAllUsers = (params) => api.get("/admins/users", { params });
export const getReportedBlogs = () => api.get("/admins/reports");
export const createOperator = (data) => api.post("/admins/operators", data);

/* ---------------- ADMIN BLOG MODERATION ---------------- */
export const getAllBlogs = (params) => api.get("/admin/blogs", { params });
export const approveBlog = (id) => api.patch(`/admin/blogs/${id}/approve`);
export const rejectBlog = (id, data) =>
  api.patch(`/admin/blogs/${id}/reject`, data);
export const featureBlog = (id, data) =>
  api.patch(`/admin/blogs/${id}/feature`, data);
export const adminDeleteBlog = (id) => api.delete(`/admin/blogs/${id}`);
export const ingestNews = (data) => api.post("/admin/blogs/ingest-news", data);
export const cleanupOldBlogsAPI = (days = 30) =>
  api.delete("/admin/blogs/cleanup", { params: { days } });