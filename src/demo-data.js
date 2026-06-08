const db = require('./db');
const { notify } = require('./notifier');
const { recalculate } = require('./cost-tracker');
const { generateReport } = require('./report-generator');

const DEMO_VULNERABILITIES = [
  {
    id: 'CVE-2026-27205',
    package: 'flask',
    version: '2.3.3',
    fixVersion: '2.3.4',
    severity: 'high',
    cve: 'CVE-2026-27205',
    title: 'Session cookie Vary header not set correctly',
    description: 'When the session object is accessed, Flask should set the Vary: Cookie header to prevent caching issues that could leak session data across users.',
    ecosystem: 'python',
    fixAvailable: true,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/1',
    issueNumber: 1,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  },
  {
    id: 'PYSEC-2026-175',
    package: 'pyjwt',
    version: '2.12.0',
    fixVersion: '2.13.0',
    severity: 'high',
    cve: 'PYSEC-2026-175',
    title: 'JWT validation bypass via algorithm confusion',
    description: 'PyJWT prior to 2.13.0 allows attackers to bypass JWT validation through algorithm confusion when asymmetric keys are used.',
    ecosystem: 'python',
    fixAvailable: true,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/2',
    issueNumber: 2,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  },
  {
    id: 'PYSEC-2026-176',
    package: 'pyjwt',
    version: '2.12.0',
    fixVersion: '2.13.0',
    severity: 'high',
    cve: 'PYSEC-2026-176',
    title: 'JWT key handling vulnerability allows key reuse attacks',
    description: 'PyJWT from 2.9.0 to 2.12 allows key reuse attacks when HMAC and RSA keys are mixed in multi-tenant environments.',
    ecosystem: 'python',
    fixAvailable: true,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/3',
    issueNumber: 3,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  },
  {
    id: 'PYSEC-2026-177',
    package: 'pyjwt',
    version: '2.12.0',
    fixVersion: '2.13.0',
    severity: 'high',
    cve: 'PYSEC-2026-177',
    title: 'JWT claim validation can be bypassed with crafted tokens',
    description: 'PyJWT prior to 2.13.0 does not properly validate required claims, allowing tokens with missing claims to pass validation.',
    ecosystem: 'python',
    fixAvailable: true,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/4',
    issueNumber: 4,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  },
  {
    id: 'PYSEC-2026-178',
    package: 'pyjwt',
    version: '2.12.0',
    fixVersion: '2.13.0',
    severity: 'high',
    cve: 'PYSEC-2026-178',
    title: 'JWT token parsing allows header injection',
    description: 'PyJWT from 2.8.0 to 2.12 allows header injection through specially crafted JWK sets, potentially leading to token forgery.',
    ecosystem: 'python',
    fixAvailable: true,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/5',
    issueNumber: 5,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  },
  {
    id: 'PYSEC-2026-179',
    package: 'pyjwt',
    version: '2.12.0',
    fixVersion: '2.13.0',
    severity: 'high',
    cve: 'PYSEC-2026-179',
    title: 'JWT token verification timing attack on HMAC signatures',
    description: 'PyJWT prior to 2.13.0 uses non-constant-time comparison for HMAC signature verification, enabling timing-based attacks.',
    ecosystem: 'python',
    fixAvailable: true,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/6',
    issueNumber: 6,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  },
  {
    id: 'CVE-2026-44405',
    package: 'paramiko',
    version: '3.5.1',
    fixVersion: null,
    severity: 'moderate',
    cve: 'CVE-2026-44405',
    title: 'SHA-1 RSA signature algorithm still accepted by default',
    description: 'Paramiko through 4.0.0 allows the SHA-1 algorithm for RSA signatures, which is considered weak and could be exploited in MITM attacks.',
    ecosystem: 'python',
    fixAvailable: false,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/7',
    issueNumber: 7,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  },
  {
    id: 'PYSEC-2026-113',
    package: 'pyarrow',
    version: '20.0.0',
    fixVersion: '20.0.1',
    severity: 'high',
    cve: 'PYSEC-2026-113',
    title: 'Use-after-free in Apache Arrow C++ IPC reader',
    description: 'Use After Free vulnerability in Apache Arrow C++ allows crafted IPC messages to cause memory corruption and potential code execution.',
    ecosystem: 'python',
    fixAvailable: true,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/8',
    issueNumber: 8,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  },
  {
    id: 'GHSA-eslint-i18n',
    package: 'eslint-plugin-i18n-strings',
    version: '*',
    fixVersion: null,
    severity: 'critical',
    cve: 'GHSA-eslint-i18n-strings',
    title: 'Malware in eslint-plugin-i18n-strings',
    description: 'The eslint-plugin-i18n-strings package contains malicious code that exfiltrates environment variables and credentials.',
    ecosystem: 'javascript',
    fixAvailable: false,
    status: 'queued',
    issueUrl: 'https://github.com/minatoplanb/superset/issues/9',
    issueNumber: 9,
    sessionId: null, sessionUrl: null, prUrl: null,
    startedAt: null, completedAt: null, acusConsumed: 0
  }
];

function loadDemoData() {
  console.log('\n🎭 DEMO MODE — Loading simulated pipeline data\n');

  db.setVulnerabilities(JSON.parse(JSON.stringify(DEMO_VULNERABILITIES)));
  db.setPipelineStatus('running');
  db.addTimelineEvent({ event: 'scan_started' });
  db.addTimelineEvent({ event: 'scan_complete', count: DEMO_VULNERABILITIES.length });
  db.addTimelineEvent({ event: 'issues_created', count: DEMO_VULNERABILITIES.length });

  notify('pipeline_started');
  notify('scan_complete', { total: 9, critical: 1, high: 6 });
  notify('issues_created', { count: 9 });

  // Simulate progression over time
  simulateProgression();
}

function simulateProgression() {
  const vulns = DEMO_VULNERABILITIES;
  let index = 0;

  const interval = setInterval(() => {
    if (index >= vulns.length) {
      clearInterval(interval);
      db.setPipelineStatus('completed');

      const state = db.getState();
      const fixed = state.remediation.fixed;
      const total = state.scan.total;
      const successRate = total > 0 ? Math.round((fixed / total) * 100) : 0;

      db.addTimelineEvent({ event: 'pipeline_complete', fixed, total, successRate });
      notify('pipeline_complete', { fixed, total, successRate });
      recalculate();

      // Auto-generate executive report
      generateReport().catch(e => console.error('Report generation failed:', e.message));
      return;
    }

    const vuln = vulns[index];
    const vulnId = vuln.id;

    // Start session
    db.updateVulnerability(vulnId, {
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      sessionId: `devin-demo-${index + 1}`,
      sessionUrl: `https://app.devin.ai/sessions/demo-${index + 1}`
    });

    notify('session_started', { cve: vuln.cve, package: vuln.package });
    db.addTimelineEvent({ event: 'session_started', cve: vuln.cve });

    // Complete after a delay
    const delay = 3000 + Math.random() * 4000;
    setTimeout(() => {
      // Paramiko and eslint-plugin-i18n have no fix — simulate failure
      const willFail = !vuln.fixAvailable;

      if (willFail) {
        db.updateVulnerability(vulnId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          acusConsumed: Math.round((0.3 + Math.random() * 0.5) * 100) / 100
        });
        notify('session_failed', { cve: vuln.cve, reason: 'No fix version available' });
        db.addTimelineEvent({ event: 'session_failed', cve: vuln.cve });
      } else {
        const prNum = index + 10;
        const prUrl = `https://github.com/minatoplanb/superset/pull/${prNum}`;
        db.updateVulnerability(vulnId, {
          status: 'fixed',
          completedAt: new Date().toISOString(),
          prUrl,
          acusConsumed: Math.round((0.8 + Math.random() * 2) * 100) / 100
        });
        notify('session_complete', { cve: vuln.cve, prUrl });
        db.addTimelineEvent({ event: 'session_complete', cve: vuln.cve, prUrl });
      }
      recalculate();
    }, delay);

    index++;
  }, 5000); // New session every 5 seconds
}

module.exports = { loadDemoData };
