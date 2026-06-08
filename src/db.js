const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'data', 'state.json');

const initialState = {
  pipeline: { status: 'idle', startedAt: null, completedAt: null },
  scan: { total: 0, critical: 0, high: 0, moderate: 0, low: 0, results: [] },
  remediation: { queued: 0, inProgress: 0, fixed: 0, failed: 0 },
  vulnerabilities: [],
  timeline: [],
  cost: { totalAcus: 0, estimatedEngineerHours: 0, estimatedEngineerCost: 0, roiPercentage: 0 }
};

let state = JSON.parse(JSON.stringify(initialState));

function getState() {
  const s = { ...state };
  s.remediation = computeRemediationCounts();
  s.scan = computeScanCounts();
  return s;
}

function computeRemediationCounts() {
  const vulns = state.vulnerabilities;
  return {
    queued: vulns.filter(v => v.status === 'queued').length,
    inProgress: vulns.filter(v => v.status === 'in_progress').length,
    fixed: vulns.filter(v => v.status === 'fixed').length,
    failed: vulns.filter(v => v.status === 'failed').length
  };
}

function computeScanCounts() {
  const vulns = state.vulnerabilities;
  return {
    total: vulns.length,
    critical: vulns.filter(v => v.severity === 'critical').length,
    high: vulns.filter(v => v.severity === 'high').length,
    moderate: vulns.filter(v => v.severity === 'moderate').length,
    low: vulns.filter(v => v.severity === 'low').length,
    results: state.scan.results
  };
}

function setVulnerabilities(vulns) {
  state.vulnerabilities = vulns;
}

function updateVulnerability(id, data) {
  const vuln = state.vulnerabilities.find(v => v.id === id);
  if (vuln) {
    Object.assign(vuln, data);
    persist();
  }
}

function addTimelineEvent(event) {
  state.timeline.push({
    ...event,
    timestamp: new Date().toISOString()
  });
  persist();
}

function setPipelineStatus(status) {
  state.pipeline.status = status;
  if (status === 'running' && !state.pipeline.startedAt) {
    state.pipeline.startedAt = new Date().toISOString();
  }
  if (status === 'completed') {
    state.pipeline.completedAt = new Date().toISOString();
  }
  persist();
}

function updateCost(costData) {
  Object.assign(state.cost, costData);
  persist();
}

function resetState() {
  state = JSON.parse(JSON.stringify(initialState));
}

function persist() {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    // Non-critical — state lives in memory
  }
}

function load() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    // Start fresh
  }
}

module.exports = {
  getState,
  setVulnerabilities,
  updateVulnerability,
  addTimelineEvent,
  setPipelineStatus,
  updateCost,
  resetState,
  persist,
  load
};
