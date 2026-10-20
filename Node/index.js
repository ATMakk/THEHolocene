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

// ---------------------------------------------------------------------------
// CORS
// Origins must match exactly: protocol + host (+ port), no trailing slash.
// FRONTEND_URL may hold one URL or several separated by commas.
// ---------------------------------------------------------------------------
const normalize = (url) => url.trim().replace(/\/$/, "");

const allowedOrigins = [
  // Local development
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  // Production (Vercel)
  "https://theholocene.vercel.app",
  "https://theholocene-vc8o.vercel.app",
  // Anything extra set in the environment
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
]
  .map(normalize)
  .filter(Boolean);

// Any port on localhost / 127.0.0.1 (dev servers can change ports)
const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || localhostPattern.test(origin)) {
        return callback(null, true);
      }

      // Log the blocked origin so it's easy to spot in Vercel logs,
      // and reject without throwing (avoids a 500 for a CORS rejection).
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
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

const PORT = process.env.PORT || 4001;
app.listen(PORT, (err) => {
  if (err) console.log("Cannot start server", err);
  else console.log(`🚀 Server started on port ${PORT}`);
});
