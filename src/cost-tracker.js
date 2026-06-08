const db = require('./db');

const ENGINEER_HOURLY_RATE = 75;
const AVG_HOURS_PER_MANUAL_FIX = 4;

function updateSessionCost(vulnId, acusConsumed) {
  db.updateVulnerability(vulnId, { acusConsumed });
  recalculate();
}

function recalculate() {
  const state = db.getState();
  const vulns = state.vulnerabilities;

  const totalAcus = vulns.reduce((sum, v) => sum + (v.acusConsumed || 0), 0);
  const fixedCount = vulns.filter(v => v.status === 'fixed').length;
  const totalCount = vulns.length;

  const estimatedEngineerHours = totalCount * AVG_HOURS_PER_MANUAL_FIX;
  const estimatedEngineerCost = estimatedEngineerHours * ENGINEER_HOURLY_RATE;

  // Devin cost estimate: ~$3 per ACU (rough estimate for display)
  const devinCost = totalAcus * 3;
  const savings = estimatedEngineerCost - devinCost;
  const roiPercentage = estimatedEngineerCost > 0
    ? Math.round((savings / estimatedEngineerCost) * 100)
    : 0;

  db.updateCost({
    totalAcus: Math.round(totalAcus * 100) / 100,
    estimatedEngineerHours,
    estimatedEngineerCost,
    roiPercentage: Math.max(0, roiPercentage)
  });
}

module.exports = { updateSessionCost, recalculate };
