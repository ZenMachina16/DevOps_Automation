import { Router } from "express";
import passport from "passport";
import { GitHubInstallation } from "../models/GitHubInstallation.js";

const router = Router();

/**
 * ▶ Start GitHub OAuth login
 */
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["read:user", "user:email"],
    prompt: "consent",
  })
);

/**
 * ▶ OAuth callback
 */
router.get(
  "/callback",
  passport.authenticate("github", {
    failureRedirect: "http://localhost:2000?error=auth_failed",
  }),
  (req, res) => {
    res.redirect("http://localhost:2000/scan");
  }
);

/**
 * ▶ Logged-in user
 */
router.get("/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const profile = req.user.profile;

  res.json({
    username: profile.username || profile.login,
    name: profile.displayName || profile.login,
    avatar:
      profile.photos?.[0]?.value ||
      profile._json?.avatar_url ||
      null,
  });
});

/**
 * ▶ AUTH STATUS (SOURCE OF TRUTH)
 * 🔑 MUST hydrate req.user.installationId
 */
router.get("/status", async (req, res) => {
  if (!req.user) {
    return res.json({
      loggedIn: false,
      hasInstallation: false,
      installationId: null,
    });
  }

  const username =
    req.user.profile?.username ||
    req.user.profile?.login;

  try {
    const installation = await GitHubInstallation.findOne({
      accountLogin: username,
      suspended: false,
    });

    // 🔥 CRITICAL FIX — SESSION HYDRATION
    if (installation) {
      req.user.installationId = installation.installationId;
    }

    return res.json({
      loggedIn: true,
      hasInstallation: !!installation,
      installationId: installation?.installationId || null,
    });
  } catch (err) {
    console.error("❌ Auth status failed:", err);
    return res.status(500).json({
      loggedIn: true,
      hasInstallation: false,
      installationId: null,
    });
  }
});

/**
 * ▶ Logout
 */
router.post("/logout", (req, res) => {
  req.logout(err => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true });
  });
});

export default router;
