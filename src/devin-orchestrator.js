const db = require('./db');
const { notify } = require('./notifier');
const { updateSessionCost } = require('./cost-tracker');
const { commentOnIssue } = require('./issue-creator');
const { generateReport } = require('./report-generator');

const DEVIN_API_BASE = 'https://api.devin.ai/v3';
const MAX_CONCURRENT = 5;
const POLL_INTERVAL_MS = 10000;

function getOrgId() {
  return process.env.DEVIN_ORG_ID || 'org-12365332ff5c4f688d3ef42dc1b0d8e2';
}

function getApiKey() {
  return process.env.DEVIN_API_KEY;
}

async function remediate(vulnerabilities) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('DEVIN_API_KEY not set — cannot start remediation');
    return;
  }

  // Mark unfixable vulnerabilities as skipped
  const unfixable = vulnerabilities.filter(v => !v.fixAvailable && v.status === 'queued');
  for (const v of unfixable) {
    db.updateVulnerability(v.id, {
      status: 'failed',
      completedAt: new Date().toISOString()
    });
    db.addTimelineEvent({ event: 'session_failed', cve: v.cve, reason: 'No fix version available — skipped' });
    notify('session_failed', { cve: v.cve, reason: 'No fix version available' });
  }

  const fixable = vulnerabilities.filter(v => v.fixAvailable && v.status === 'queued');
  if (fixable.length === 0) {
    console.log('No fixable vulnerabilities to remediate');
    db.setPipelineStatus('completed');
    return;
  }

  db.setPipelineStatus('running');
  db.addTimelineEvent({ event: 'remediation_started', count: fixable.length });

  // Process in batches of MAX_CONCURRENT
  const batches = [];
  for (let i = 0; i < fixable.length; i += MAX_CONCURRENT) {
    batches.push(fixable.slice(i, i + MAX_CONCURRENT));
  }

  for (const batch of batches) {
    const promises = batch.map(vuln => processVulnerability(vuln));
    await Promise.allSettled(promises);
  }

  // Pipeline complete
  const state = db.getState();
  const fixed = state.remediation.fixed;
  const total = state.scan.total;
  const successRate = total > 0 ? Math.round((fixed / total) * 100) : 0;

  db.setPipelineStatus('completed');
  db.addTimelineEvent({
    event: 'pipeline_complete',
    fixed,
    total,
    successRate
  });

  notify('pipeline_complete', { fixed, total, successRate });

  // Auto-generate executive report
  try {
    await generateReport();
  } catch (e) {
    console.error('Report generation failed:', e.message);
  }
}

async function processVulnerability(vuln) {
  try {
    // Create Devin session
    db.updateVulnerability(vuln.id, { status: 'in_progress', startedAt: new Date().toISOString() });

    notify('session_started', { cve: vuln.cve, package: vuln.package });
    db.addTimelineEvent({ event: 'session_started', cve: vuln.cve, package: vuln.package });

    const session = await createDevinSession(vuln);
    if (!session) {
      throw new Error('Failed to create Devin session');
    }

    db.updateVulnerability(vuln.id, {
      sessionId: session.session_id,
      sessionUrl: session.url
    });

    // Poll until complete
    const result = await pollSession(session.session_id, vuln);

    if (result.success) {
      db.updateVulnerability(vuln.id, {
        status: 'fixed',
        completedAt: new Date().toISOString(),
        prUrl: result.prUrl
      });

      notify('session_complete', { cve: vuln.cve, prUrl: result.prUrl });
      db.addTimelineEvent({ event: 'session_complete', cve: vuln.cve, prUrl: result.prUrl });

      // Comment on GitHub issue
      if (vuln.issueNumber) {
        await commentOnIssue(vuln.issueNumber,
          `✅ **Devin has fixed this vulnerability!**\n\nPR: ${result.prUrl || 'Check Devin session'}\nSession: ${session.url}\nACUs consumed: ${result.acus || 0}`
        );
      }
    } else {
      throw new Error(result.reason || 'Session did not complete successfully');
    }
  } catch (e) {
    db.updateVulnerability(vuln.id, {
      status: 'failed',
      completedAt: new Date().toISOString()
    });

    notify('session_failed', { cve: vuln.cve, reason: e.message });
    db.addTimelineEvent({ event: 'session_failed', cve: vuln.cve, reason: e.message });
  }
}

async function createDevinSession(vuln) {
  const orgId = getOrgId();
  const prompt = buildPrompt(vuln);

  const response = await fetch(`${DEVIN_API_BASE}/organizations/${orgId}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      title: `[Security Fix] ${vuln.cve}: ${vuln.package}`,
      tags: ['security-autopilot', vuln.cve, vuln.severity]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Devin API error ${response.status}: ${error}`);
  }

  return response.json();
}

function buildPrompt(vuln) {
  const depFile = vuln.ecosystem === 'python' ? 'requirements/base.txt' : 'superset-frontend/package.json';
  const fixInstruction = vuln.fixVersion
    ? `Upgrade \`${vuln.package}\` from \`${vuln.version}\` to \`${vuln.fixVersion}\``
    : `Investigate and apply the recommended fix for ${vuln.cve}`;

  return `Fix a security vulnerability in the Apache Superset fork at https://github.com/minatoplanb/superset

## Vulnerability Details
- **CVE/Advisory:** ${vuln.cve}
- **Package:** ${vuln.package}
- **Current Version:** ${vuln.version}
- **Fix Version:** ${vuln.fixVersion || 'See advisory'}
- **Severity:** ${vuln.severity.toUpperCase()}
- **Ecosystem:** ${vuln.ecosystem}

## Description
${vuln.description}

## Instructions
1. Clone the repository: https://github.com/minatoplanb/superset
2. ${fixInstruction} in \`${depFile}\`
3. If the package has a pinned version constraint (e.g., \`==\` or \`~=\`), update it to allow the fix version
4. Check for any breaking changes in the changelog of ${vuln.package}
5. Run a quick sanity check that imports still work
6. Create a pull request with:
   - Title: "[Security Fix] ${vuln.cve}: Upgrade ${vuln.package} to ${vuln.fixVersion || 'latest safe version'}"
   - Description explaining the vulnerability and the fix
   - Reference this CVE: ${vuln.cve}

## Important
- Only modify the dependency version, do not refactor other code
- If the upgrade requires code changes, make minimal necessary changes
- The PR should be focused and reviewable`;
}

async function pollSession(sessionId, vuln) {
  const orgId = getOrgId();
  const maxPollTime = 10 * 60 * 1000; // 10 minutes max
  const startTime = Date.now();

  while (Date.now() - startTime < maxPollTime) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const response = await fetch(`${DEVIN_API_BASE}/organizations/${orgId}/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${getApiKey()}` }
      });

      if (!response.ok) continue;

      const session = await response.json();
      const status = session.status;
      const acus = session.acus_consumed || 0;

      // Update cost tracking
      updateSessionCost(vuln.id, acus);

      if (status === 'exit') {
        const prUrl = session.pull_requests?.[0]?.pr_url || null;
        if (!prUrl) {
          return { success: false, reason: 'Session exited without creating a PR', acus };
        }
        return { success: true, prUrl, acus };
      }

      if (status === 'error') {
        return { success: false, reason: session.status_detail || 'Session errored', acus };
      }

      if (status === 'suspended') {
        return { success: false, reason: 'Session suspended', acus };
      }

      // Still running — continue polling
    } catch (e) {
      console.error(`Poll error for ${vuln.cve}: ${e.message}`);
    }
  }

  return { success: false, reason: 'Timeout — session took too long', acus: 0 };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { remediate };
