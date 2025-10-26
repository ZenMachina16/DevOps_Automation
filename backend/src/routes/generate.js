import { Router } from 'express';
import { generateGapReport, fetchPackageJson, parseGitHubUrl } from '../services/repoScanner.js';
import { n8nClient } from '../services/langflowClient.js';

const router = Router();

/**
 * POST /api/generate-files
 * Generate missing DevOps files using Langflow agent
 */
router.post('/generate-files', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    
    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    console.log(`Starting file generation for repo: ${repoUrl}`);

    // Step 1: Get gap report (what's missing)
    const gapReport = await generateGapReport(repoUrl);
    console.log('Gap report:', gapReport);

    // Step 2: Get repository metadata (package.json, etc.)
    const parsed = parseGitHubUrl(repoUrl);
    const metadata = await fetchPackageJson({ 
      owner: parsed.owner, 
      repo: parsed.repo 
    });
    console.log('Repository metadata:', metadata);

    // Step 3: Call n8n agent to generate files
    const generatedFiles = await n8nClient.generateFiles(repoUrl, gapReport, metadata);

    // Step 4: Return combined results
    return res.json({
      success: true,
      repository: {
        url: repoUrl,
        owner: parsed.owner,
        name: parsed.repo
      },
      gapReport,
      generatedFiles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('File generation error:', error);
    
    // Return detailed error information for debugging
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/generate-status
 * Check if n8n service is available
 */
router.get('/generate-status', async (req, res) => {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL ;
    const isConfigured = !!webhookUrl;

    return res.json({
      configured: isConfigured,
      webhookUrl: webhookUrl,
      service: 'n8n',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      configured: false,
      error: error.message
    });
  }
});

export default router;
