import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import http from "http";
import { Server } from "socket.io";

import scanRouter from "./src/routes/scan.js";
import authRouter from "./src/routes/auth.js";
import generateRouter from "./src/routes/generate.js";
import githubWebhookRouter from "./src/routes/githubWebhook.js";
import githubAppRoutes from "./src/routes/githubApp.js";
import installationRoutes from "./src/routes/installation.js";
import settingsRouter from "./src/routes/settings.js";
import sessionRouter from "./src/routes/session.js";
import repoRouter from "./src/routes/repository.js";

import { connectMongo } from "./src/db/mongo.js";

// ===============================
// 🔴 ENV FIRST
// ===============================
dotenv.config();

console.log("ENV CHECK:", {
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? "FOUND" : "MISSING",
  GITHUB_APP_ID: process.env.GITHUB_APP_ID ? "FOUND" : "MISSING",
});

// ===============================
// 🚀 App + HTTP Server
// ===============================
const app = express();
const server = http.createServer(app);

// ===============================
// ⚡ Socket.IO Setup
// ===============================
const io = new Server(server, {
  cors: {
    origin: "http://localhost:2000", // your frontend
    credentials: true,
  },
});

// Make io accessible inside routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ WebSocket client connected");

  socket.on("joinRepo", (repoFullName) => {
    socket.join(repoFullName);
    console.log(`📦 Client joined repo room: ${repoFullName}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ WebSocket client disconnected");
  });
});

// ===============================
// 🔌 Mongo
// ===============================
await connectMongo();

// ===============================
// 🌍 Middleware (ORDER MATTERS)
// ===============================
app.use(
  cors({
    origin: "http://localhost:2000",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    name: "shipiq.sid",
    secret: process.env.SESSION_SECRET || "dev_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ===============================
// 🔐 PASSPORT (AFTER SESSION)
// ===============================
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:7000/auth/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, { profile });
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(passport.initialize());
app.use(passport.session());

// ===============================
// ❤️ Health
// ===============================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ===============================
// 🔐 Routes
// ===============================
app.use("/auth", authRouter);
app.use("/auth/github-app", githubAppRoutes);
app.use("/api/installation", installationRoutes);
app.use("/api", scanRouter);
app.use("/api", generateRouter);
app.use("/api/github", githubWebhookRouter);
app.use("/api/settings", settingsRouter);
app.use("/api", sessionRouter);
app.use("/api/repo", repoRouter);

// ===============================
// 🚀 Start server (IMPORTANT)
// ===============================
const PORT = process.env.PORT ?? 7000;

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
