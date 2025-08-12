import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Demo user credentials
const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'password123';

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};

  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfiguration: missing JWT_SECRET' });
    }
    const token = jwt.sign({ username }, secret, { algorithm: 'HS256', expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

export default router;


