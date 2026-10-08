const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const dns = require("dns");

// Fix for Windows DNS querySrv ECONNREFUSED on mongodb+srv URIs
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

dotenv.config();

const app = express();

// CORS: allow frontend dev server and any localhost origins
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin.startsWith(o.replace(/\/$/, "")))) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));

const UserRouter = require("./routers/user.routes");
const AdminRouter = require("./routers/admin.routes");
const BlogRouter = require("./routers/blog.routes");
const CommentRouter = require("./routers/comment.routes");
const AdminBlogRouter = require("./routers/adminBlog.routes");

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/admins", AdminRouter);
app.use("/api/v1/blogs", BlogRouter);
app.use("/api/v1/comments", CommentRouter);
app.use("/api/v1/admin/blogs", AdminBlogRouter);

// Health check
app.get("/", (req, res) => res.send("THE Holocene API — working fine"));

const DB_URI = process.env.DataBase_URI || process.env.DB_URI || process.env.MONGODB_URI;

if (!DB_URI) {
  console.error("FATAL: No database URI found. Set DataBase_URI in .env");
  process.exit(1);
}

mongoose
  .connect(DB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ DB connected successfully");
    // Start news auto-scheduler AFTER DB is connected
    require("./utils/newsScheduler");
  })
  .catch((err) => {
    console.error("❌ Cannot connect to DB:", err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 4000;
app.listen(PORT, (err) => {
  if (err) console.log("Cannot start server", err);
  else console.log(`🚀 Server started on port ${PORT}`);
});