import { Router } from 'express';
import { generateGapReport } from '../services/repoScanner.js';
import { langflowClient } from '../services/langflowClient.js';

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
    const { fetchPackageJson, parseGitHubUrl } = await import('../services/repoScanner.js');
    const parsed = parseGitHubUrl(repoUrl);
    const metadata = await fetchPackageJson({ 
      owner: parsed.owner, 
      repo: parsed.repo 
    });
    console.log('Repository metadata:', metadata);

    // Step 3: Call Langflow agent to generate files
    const generatedFiles = await langflowClient.generateFiles(repoUrl, gapReport, metadata);

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
 * Check if Langflow service is available
 */
router.get('/generate-status', async (req, res) => {
  try {
    const isConfigured = !!(
      process.env.LANGFLOW_API_URL && 
      process.env.LANGFLOW_FLOW_ID
    );

    return res.json({
      configured: isConfigured,
      langflowUrl: process.env.LANGFLOW_API_URL ? 'Set' : 'Missing',
      flowId: process.env.LANGFLOW_FLOW_ID ? 'Set' : 'Missing',
      apiKey: process.env.LANGFLOW_API_KEY ? 'Set' : 'Not required',
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
