import { Router } from 'express';
import passport from 'passport';
import axios from 'axios';

const router = Router();

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

router.get('/callback', 
  passport.authenticate('github', { failureRedirect: 'http://localhost:2000?error=auth_failed' }),
  (req, res) => {
    // Successful authentication, redirect to scan page
    res.redirect('http://localhost:2000/scan?connected=true');
  }
);

// Get current user info
router.get('/user', (req, res) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Handle the user data structure safely
    const profile = req.user.profile || req.user;
    const photos = profile.photos || profile._json?.avatar_url ? [{ value: profile._json.avatar_url }] : [];
    
    res.json({
      username: profile.username || profile.login,
      avatar: photos[0]?.value || profile._json?.avatar_url,
      name: profile.displayName || profile.name || profile.login
    });
  } catch (error) {
    console.error('Error in /user route:', error);
    console.error('User object:', JSON.stringify(req.user, null, 2));
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's repositories
router.get('/repos', async (req, res) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: { 
        Authorization: `token ${req.user.accessToken}`,
        'Accept': 'application/vnd.github+json'
      },
      params: {
        sort: 'updated',
        per_page: 100
      }
    });

    const repos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
      url: repo.html_url,
      updatedAt: repo.updated_at
    }));

    res.json(repos);
  } catch (error) {
    console.error('Failed to fetch repos:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

export default router;
