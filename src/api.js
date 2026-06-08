const express = require('express');
const db = require('./db');
const { runScan, loadCachedResults } = require('./scanner');
const { createIssues } = require('./issue-creator');
const { remediate } = require('./devin-orchestrator');
const { recalculate } = require('./cost-tracker');

const router = express.Router();

// GET /api/status — full pipeline state
router.get('/status', (req, res) => {
  const state = db.getState();
  recalculate();
  res.json(db.getState());
});

// POST /api/scan — trigger vulnerability scan
router.post('/scan', async (req, res) => {
  const isDemo = process.env.DEMO_MODE === 'true';

  if (isDemo) {
    res.json({ status: 'demo_mode', message: 'Using cached scan results' });
    return;
  }

  // Use a controlled path — never accept repoPath from user input
  const repoPath = process.env.SUPERSET_REPO_PATH || '/tmp/superset';

  // Clone Superset if repo path doesn't exist
  if (!require('fs').existsSync(repoPath)) {
    try {
      const owner = process.env.GITHUB_OWNER || 'minatoplanb';
      const repo = process.env.GITHUB_REPO || 'superset';
      console.log(`Cloning ${owner}/${repo} to ${repoPath}...`);
      require('child_process').execFileSync('git', [
        'clone', '--depth=1',
        `https://github.com/${owner}/${repo}.git`,
        repoPath
      ], { timeout: 120000, stdio: 'pipe' });
    } catch (e) {
      res.json({ status: 'error', message: 'Failed to clone Superset: ' + e.message });
      return;
    }
  }

  res.json({ status: 'started', message: 'Scan initiated' });

  // Run async
  try {
    const vulns = runScan(repoPath);
    await createIssues(vulns);
  } catch (e) {
    console.error('Scan failed:', e.message);
  }
});

// POST /api/remediate — trigger Devin sessions
router.post('/remediate', async (req, res) => {
  const isDemo = process.env.DEMO_MODE === 'true';

  if (isDemo) {
    res.json({ status: 'demo_mode', message: 'Demo remediation running' });
    return;
  }

  const state = db.getState();
  if (state.vulnerabilities.length === 0) {
    res.json({ status: 'error', message: 'No vulnerabilities found. Run /api/scan first.' });
    return;
  }

  res.json({ status: 'started', message: 'Remediation initiated' });

  // Run async
  remediate(state.vulnerabilities).catch(e => {
    console.error('Remediation failed:', e.message);
  });
});

// GET /api/report — report data for PowerPoint generation
router.get('/report', (req, res) => {
  recalculate();
  const state = db.getState();
  res.json({
    generatedAt: new Date().toISOString(),
    ...state
  });
});

module.exports = router;
