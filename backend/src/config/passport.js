import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";

/**
 * =====================================
 * Sanity check (fail fast if env missing)
 * =====================================
 */
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.error("❌ Missing GitHub OAuth environment variables");
  console.error("Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env");
  process.exit(1); // stop server early, avoid confusing runtime errors
}

/**
 * =====================================
 * GitHub OAuth Strategy (LOGIN ONLY)
 * =====================================
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:7000/auth/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      /**
       * IMPORTANT:
       * - OAuth is used ONLY for identity
       * - We do NOT fetch repos here
       * - We do NOT use accessToken for permissions
       */

      return done(null, {
        profile, // GitHub user profile
      });
    }
  )
);

/**
 * =====================================
 * Session handling
 * =====================================
 * For now, we store the full user object in session.
 * Later (production), you will store only userId.
 */

// Store user into session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Restore user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});
