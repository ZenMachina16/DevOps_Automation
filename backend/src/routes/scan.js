import { Router } from 'express';
import { authMiddleware } from '../utils/authMiddleware.js';
import { generateGapReport } from '../services/repoScanner.js';

const router = Router();

router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { repoUrl } = req.body ?? {};
    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    const report = await generateGapReport(repoUrl);
    return res.json(report);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Scan error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


