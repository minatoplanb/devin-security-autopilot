const { Octokit } = require('@octokit/rest');
const db = require('./db');
const { notify } = require('./notifier');

const REPO_OWNER = process.env.GITHUB_OWNER || 'minatoplanb';
const REPO_NAME = process.env.GITHUB_REPO || 'superset';

async function createIssues(vulnerabilities) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log('GITHUB_TOKEN not set — skipping issue creation');
    return;
  }

  const octokit = new Octokit({ auth: token });
  let created = 0;

  // Ensure required labels exist
  await ensureLabelsExist(octokit);

  // Get existing issues to avoid duplicates
  const existingIssues = await getExistingIssues(octokit);

  for (const vuln of vulnerabilities) {
    const titlePrefix = `[SECURITY] ${vuln.cve}:`;

    // Skip if already exists
    if (existingIssues.some(i => i.title.includes(vuln.cve))) {
      console.log(`  Issue already exists for ${vuln.cve}, skipping`);
      continue;
    }

    try {
      const issue = await octokit.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: `${titlePrefix} ${vuln.package} ${vuln.version} — ${vuln.title}`,
        body: formatIssueBody(vuln),
        labels: getLabels(vuln)
      });

      db.updateVulnerability(vuln.id, {
        issueUrl: issue.data.html_url,
        issueNumber: issue.data.number
      });

      created++;
      console.log(`  Created issue #${issue.data.number}: ${vuln.cve}`);
    } catch (e) {
      console.error(`  Failed to create issue for ${vuln.cve}: ${e.message}`);
    }
  }

  db.addTimelineEvent({ event: 'issues_created', count: created });
  notify('issues_created', { count: created });
}

async function ensureLabelsExist(octokit) {
  const requiredLabels = [
    { name: 'auto-remediate', color: '0075ca', description: 'Automated remediation by Devin' },
    { name: 'security', color: 'e11d48', description: 'Security vulnerability' },
    { name: 'severity:critical', color: 'b91c1c', description: 'Critical severity' },
    { name: 'severity:high', color: 'ea580c', description: 'High severity' },
    { name: 'severity:moderate', color: 'ca8a04', description: 'Moderate severity' },
    { name: 'severity:low', color: '16a34a', description: 'Low severity' },
    { name: 'python', color: '3572a5', description: 'Python ecosystem' },
    { name: 'javascript', color: 'f1e05a', description: 'JavaScript ecosystem' }
  ];

  for (const label of requiredLabels) {
    try {
      await octokit.issues.createLabel({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        name: label.name,
        color: label.color,
        description: label.description
      });
    } catch (e) {
      // 422 = label already exists, which is fine
      if (e.status !== 422) {
        console.error(`  Warning: could not create label ${label.name}: ${e.message}`);
      }
    }
  }
}

async function getExistingIssues(octokit) {
  try {
    const { data } = await octokit.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'all',
      labels: 'auto-remediate',
      per_page: 100
    });
    return data;
  } catch {
    return [];
  }
}

function formatIssueBody(vuln) {
  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    moderate: '🟡',
    low: '🟢'
  };

  return `## ${severityEmoji[vuln.severity] || '⚪'} Security Vulnerability

**Package:** \`${vuln.package}\`
**Current Version:** \`${vuln.version}\`
**Fix Version:** \`${vuln.fixVersion || 'No fix available'}\`
**Severity:** ${vuln.severity.toUpperCase()}
**CVE:** ${vuln.cve}
**Ecosystem:** ${vuln.ecosystem}

### Description

${vuln.description}

### Remediation

${vuln.fixAvailable
  ? `Upgrade \`${vuln.package}\` from \`${vuln.version}\` to \`${vuln.fixVersion}\` in \`${vuln.ecosystem === 'python' ? 'requirements/base.txt' : 'superset-frontend/package.json'}\`.`
  : 'No automated fix available. Manual review required.'}

### Auto-Remediation

This issue is tagged for automatic remediation by Devin. A Devin session will be created to fix this vulnerability and open a PR.

---
*Created by Devin Security Autopilot*`;
}

function getLabels(vuln) {
  const labels = ['auto-remediate', 'security'];
  labels.push(`severity:${vuln.severity}`);
  if (vuln.ecosystem === 'python') labels.push('python');
  if (vuln.ecosystem === 'javascript') labels.push('javascript');
  return labels;
}

async function commentOnIssue(issueNumber, comment) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !issueNumber) return;

  const octokit = new Octokit({ auth: token });
  try {
    await octokit.issues.createComment({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: issueNumber,
      body: comment
    });
  } catch (e) {
    console.error(`Failed to comment on issue #${issueNumber}: ${e.message}`);
  }
}

module.exports = { createIssues, commentOnIssue };
