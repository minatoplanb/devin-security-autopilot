const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { notify } = require('./notifier');

const SCAN_RESULTS_FILE = path.join(__dirname, '..', 'data', 'scan-results.json');

function runScan(repoPath) {
  notify('scan_started');
  db.setPipelineStatus('running');
  db.addTimelineEvent({ event: 'scan_started' });

  const vulnerabilities = [];

  // Run pip-audit on Python requirements
  try {
    const pipResult = runPipAudit(repoPath);
    vulnerabilities.push(...pipResult);
  } catch (e) {
    console.error('pip-audit failed:', e.message);
  }

  // Run npm audit on frontend
  try {
    const npmResult = runNpmAudit(repoPath);
    vulnerabilities.push(...npmResult);
  } catch (e) {
    console.error('npm audit failed:', e.message);
  }

  // Set all as queued
  for (const v of vulnerabilities) {
    v.status = 'queued';
    v.issueUrl = null;
    v.issueNumber = null;
    v.sessionId = null;
    v.sessionUrl = null;
    v.prUrl = null;
    v.startedAt = null;
    v.completedAt = null;
    v.acusConsumed = 0;
  }

  db.setVulnerabilities(vulnerabilities);
  db.addTimelineEvent({
    event: 'scan_complete',
    count: vulnerabilities.length
  });

  const state = db.getState();
  notify('scan_complete', {
    total: state.scan.total,
    critical: state.scan.critical,
    high: state.scan.high
  });

  // Cache results for demo mode
  saveScanResults(vulnerabilities);

  return vulnerabilities;
}

function runPipAudit(repoPath) {
  const reqFile = path.join(repoPath, 'requirements', 'base.txt');
  if (!fs.existsSync(reqFile)) return [];

  let raw;
  try {
    raw = execSync(`pip-audit -r "${reqFile}" --format json`, {
      encoding: 'utf8',
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (e) {
    // pip-audit exits non-zero when vulnerabilities found
    raw = e.stdout || '';
  }

  if (!raw) return [];
  const data = JSON.parse(raw);
  const results = [];

  for (const dep of (data.dependencies || [])) {
    if (!dep.vulns || dep.vulns.length === 0) continue;
    for (const vuln of dep.vulns) {
      results.push({
        id: vuln.id,
        package: dep.name,
        version: dep.version,
        fixVersion: vuln.fix_versions?.[0] || null,
        severity: mapPipSeverity(vuln.id),
        cve: vuln.id,
        title: (vuln.description || '').substring(0, 120),
        description: vuln.description || '',
        ecosystem: 'python',
        fixAvailable: (vuln.fix_versions?.length || 0) > 0
      });
    }
  }
  return results;
}

function runNpmAudit(repoPath) {
  const frontendDir = path.join(repoPath, 'superset-frontend');
  if (!fs.existsSync(path.join(frontendDir, 'package.json'))) return [];

  let raw;
  try {
    raw = execSync('npm audit --json 2>/dev/null', {
      encoding: 'utf8',
      cwd: frontendDir,
      timeout: 120000
    });
  } catch (e) {
    // npm audit exits non-zero when vulnerabilities found
    raw = e.stdout || '';
  }

  if (!raw) return [];
  const data = JSON.parse(raw);
  const results = [];

  for (const [name, info] of Object.entries(data.vulnerabilities || {})) {
    const via = info.via || [];
    const firstVia = Array.isArray(via) && via.length > 0 && typeof via[0] === 'object' ? via[0] : null;

    results.push({
      id: firstVia?.cve || firstVia?.url || `npm-${name}`,
      package: name,
      version: info.range || 'unknown',
      fixVersion: info.fixAvailable ? 'latest' : null,
      severity: info.severity || 'moderate',
      cve: firstVia?.cve || `GHSA-${name}`,
      title: firstVia?.title || `Vulnerability in ${name}`,
      description: firstVia?.title || '',
      ecosystem: 'javascript',
      fixAvailable: !!info.fixAvailable
    });
  }
  return results;
}

function mapPipSeverity(cveId) {
  // PyJWT CVEs are high severity, Flask is high, Paramiko is moderate, PyArrow is high
  if (cveId.includes('2026-27205')) return 'high'; // Flask
  if (cveId.includes('PYSEC-2026-17')) return 'high'; // PyJWT
  if (cveId.includes('2026-44405')) return 'moderate'; // Paramiko
  if (cveId.includes('PYSEC-2026-113')) return 'high'; // PyArrow
  return 'moderate';
}

function loadCachedResults() {
  if (fs.existsSync(SCAN_RESULTS_FILE)) {
    return JSON.parse(fs.readFileSync(SCAN_RESULTS_FILE, 'utf8'));
  }
  return null;
}

function saveScanResults(results) {
  const dir = path.dirname(SCAN_RESULTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SCAN_RESULTS_FILE, JSON.stringify(results, null, 2));
}

module.exports = { runScan, loadCachedResults };
