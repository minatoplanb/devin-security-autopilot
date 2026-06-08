const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const ICONS = {
  scan_started: '🔍',
  scan_complete: '📋',
  issues_created: '📝',
  session_started: '🤖',
  session_complete: '✅',
  session_failed: '❌',
  pipeline_complete: '🎉',
  pipeline_started: '🚀'
};

function notify(event, data = {}) {
  const icon = ICONS[event] || '📌';
  const message = formatMessage(event, data);

  // Console output
  const color = event.includes('fail') || event.includes('error')
    ? COLORS.red
    : event.includes('complete') || event.includes('fixed')
    ? COLORS.green
    : COLORS.cyan;

  console.log(`${COLORS.gray}[${new Date().toISOString()}]${COLORS.reset} ${color}${COLORS.bright}[SECURITY AUTOPILOT]${COLORS.reset} ${icon} ${message}`);

  // Slack webhook (if configured)
  if (SLACK_WEBHOOK_URL) {
    sendSlack(`${icon} *[Security Autopilot]* ${message}`).catch(() => {});
  }
}

function formatMessage(event, data) {
  switch (event) {
    case 'pipeline_started':
      return 'Pipeline initiated — scanning for vulnerabilities...';
    case 'scan_started':
      return 'Security scan started on Apache Superset';
    case 'scan_complete':
      return `Scan complete: ${data.total} vulnerabilities found (${data.critical} critical, ${data.high} high)`;
    case 'issues_created':
      return `Created ${data.count} GitHub issues for auto-remediation`;
    case 'session_started':
      return `Devin session started for ${data.cve} (${data.package})`;
    case 'session_complete':
      return `${data.cve} fixed — PR opened: ${data.prUrl || 'pending'}`;
    case 'session_failed':
      return `${data.cve} remediation failed: ${data.reason || 'unknown error'}`;
    case 'pipeline_complete':
      return `Pipeline complete! ${data.fixed}/${data.total} vulnerabilities remediated. Success rate: ${data.successRate}%`;
    default:
      return JSON.stringify(data);
  }
}

async function sendSlack(text) {
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
}

module.exports = { notify };
