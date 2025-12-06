import { Router } from 'express';
import axios from 'axios';
import { generateGapReport, fetchPackageJson, parseGitHubUrl } from '../services/repoScanner.js';
import { n8nClient } from '../services/langflowClient.js';

const router = Router();

function getSessionAccessToken(req) {
  if (req.user?.accessToken) return req.user.accessToken;
  const token = req.session?.passport?.user?.accessToken;
  return token || null;
}

async function fetchGithubFileRaw({ owner, repo, path, branch, accessToken }) {
  const headers = {
    'Accept': 'application/vnd.github.v3.raw',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : '';
  // Encode each path segment and preserve '/'
  const encodedPath = String(path)
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}${refQuery}`;
  const resp = await axios.get(url, {
    headers,
    validateStatus: () => true,
    responseType: 'text',
  });
  if (resp.status !== 200) {
    return { ok: false, status: resp.status, error: resp.data };
  }
  return { ok: true, content: resp.data };
}

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
    const n8nResult = await n8nClient.generateFiles(repoUrl, gapReport, metadata);

    // Step 4: Optionally fetch committed files from GitHub using OAuth token
    let fetchedFiles = undefined;
    try {
      if (n8nResult?.branch) {
        const accessToken = getSessionAccessToken(req);
        const owner = parsed.owner;
        const repo = parsed.repo;
        const branch = n8nResult.branch;
        const candidates = Array.isArray(n8nResult.files) && n8nResult.files.length > 0
          ? n8nResult.files.map((f) => (typeof f === 'string' ? f : f.path)).filter(Boolean)
          : (n8nResult.file ? [n8nResult.file] : ['Dockerfile', '.github/workflows/main.yml', 'README.md']);

        const results = [];
        for (const path of candidates) {
          const r = await fetchGithubFileRaw({ owner, repo, path, branch, accessToken });
          if (r.ok) results.push({ path, content: r.content });
        }
        fetchedFiles = results;
      }
    } catch (_err) {
      // Ignore fetch errors; frontend can call dedicated endpoints
    }

    // Step 5: Return combined results
    return res.json({
      success: true,
      repository: {
        url: repoUrl,
        owner: parsed.owner,
        name: parsed.repo
      },
      gapReport,
      ...n8nResult,
      files: fetchedFiles,
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
