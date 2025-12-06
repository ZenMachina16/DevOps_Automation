import { Router } from 'express';
import axios from 'axios';

const router = Router();

const DEFAULT_CANDIDATE_PATHS = [
	'Dockerfile',
	'.github/workflows/main.yml',
	'README.md',
];

function getSessionAccessToken(req) {
	// Prefer Passport user token
	if (req.user?.accessToken) return req.user.accessToken;
	// Fallback: session passport
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
	// Encode each path segment but preserve '/'
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

// GET /api/repo/file?owner=&repo=&branch=&file=
router.get('/repo/file', async (req, res) => {
	try {
		const { owner, repo, branch, file } = req.query;
		if (!owner || !repo) {
			return res.status(400).json({ error: 'owner and repo are required' });
		}
		const accessToken = getSessionAccessToken(req);
		const path = file;
		if (!path) {
			return res.status(400).json({ error: 'file is required (path to file)' });
		}
		const result = await fetchGithubFileRaw({ owner, repo, path, branch, accessToken });
		if (!result.ok) {
			return res.status(result.status || 500).json({ error: 'GitHub fetch failed', details: result.error });
		}
		return res.json({ owner, repo, branch: branch || null, file: path, content: result.content });
	} catch (err) {
		return res.status(500).json({ error: 'Failed to fetch file', details: err.message });
	}
});

// GET /api/repo/generated-files?owner=&repo=&branch=
router.get('/repo/generated-files', async (req, res) => {
	try {
		const { owner, repo, branch } = req.query;
		if (!owner || !repo || !branch) {
			return res.status(400).json({ error: 'owner, repo, branch are required' });
		}
		const accessToken = getSessionAccessToken(req);
		const files = [];
		for (const path of DEFAULT_CANDIDATE_PATHS) {
			const result = await fetchGithubFileRaw({ owner, repo, path, branch, accessToken });
			if (result.ok) files.push({ path, content: result.content });
		}
		return res.json({ owner, repo, branch, files });
	} catch (err) {
		return res.status(500).json({ error: 'Failed to fetch generated files', details: err.message });
	}
});

export default router;


