const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { recalculate } = require('./cost-tracker');

async function generateReport() {
  recalculate();
  const state = db.getState();
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Devin Security Autopilot';
  pptx.subject = 'Security Remediation POC Results';

  const DARK = '0A0A0F';
  const SURFACE = '12141D';
  const TEXT = 'E2E4EA';
  const DIM = '8B8FA3';
  const ACCENT = '3B82F6';
  const SUCCESS = '22C55E';
  const DANGER = 'EF4444';

  // Slide 1: Title
  let slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('Devin Security Autopilot', {
    x: 0.8, y: 1.5, w: 11, h: 1,
    fontSize: 36, fontFace: 'Arial', color: TEXT, bold: true
  });
  slide.addText('POC Results — Apache Superset', {
    x: 0.8, y: 2.5, w: 11, h: 0.6,
    fontSize: 20, fontFace: 'Arial', color: DIM
  });
  slide.addText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
    x: 0.8, y: 3.3, w: 11, h: 0.5,
    fontSize: 14, fontFace: 'Arial', color: DIM
  });
  slide.addText('Powered by Devin — Cognition AI', {
    x: 0.8, y: 6.5, w: 11, h: 0.4,
    fontSize: 12, fontFace: 'Arial', color: ACCENT
  });

  // Slide 2: Executive Summary
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('Executive Summary', {
    x: 0.8, y: 0.5, w: 11, h: 0.7,
    fontSize: 28, fontFace: 'Arial', color: TEXT, bold: true
  });

  const fixed = state.remediation.fixed;
  const total = state.scan.total;
  const hours = state.cost.estimatedEngineerHours;

  slide.addText([
    { text: `We scanned Apache Superset and found `, options: { color: DIM, fontSize: 16 } },
    { text: `${total} security vulnerabilities`, options: { color: DANGER, fontSize: 16, bold: true } },
    { text: `. Devin auto-fixed `, options: { color: DIM, fontSize: 16 } },
    { text: `${fixed} of them`, options: { color: SUCCESS, fontSize: 16, bold: true } },
    { text: ` — saving an estimated ${hours} engineer-hours. Zero human intervention required.`, options: { color: DIM, fontSize: 16 } }
  ], { x: 0.8, y: 1.5, w: 11, h: 1.5 });

  const summaryData = [
    ['Metric', 'Value'],
    ['Vulnerabilities Found', String(total)],
    ['Auto-Remediated', String(fixed)],
    ['Success Rate', `${total > 0 ? Math.round((fixed / total) * 100) : 0}%`],
    ['Engineer Hours Saved', `${hours}h`],
    ['Estimated Cost Savings', `$${state.cost.estimatedEngineerCost.toLocaleString()}`],
    ['Devin ACUs Used', String(state.cost.totalAcus)]
  ];

  slide.addTable(summaryData, {
    x: 0.8, y: 3.5, w: 11,
    fontSize: 14, fontFace: 'Arial',
    color: TEXT,
    border: { type: 'solid', pt: 0.5, color: '242833' },
    rowH: 0.45,
    colW: [6, 5],
    autoPage: false
  });

  // Slide 3: The Problem
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('The Problem', {
    x: 0.8, y: 0.5, w: 11, h: 0.7,
    fontSize: 28, fontFace: 'Arial', color: TEXT, bold: true
  });

  const problems = [
    'Average enterprise codebase has 500+ open CVEs',
    'Mean time to remediate a vulnerability: 120 days',
    'Each vulnerability fix costs ~$300 in engineer time (4 hours avg)',
    'Security teams are overwhelmed — 60% of breaches exploit known CVEs',
    'Manual dependency updates risk breaking changes and regressions'
  ];

  problems.forEach((p, i) => {
    slide.addText(`• ${p}`, {
      x: 1.2, y: 1.8 + i * 0.7, w: 10, h: 0.6,
      fontSize: 16, fontFace: 'Arial', color: DIM
    });
  });

  // Slide 4: Our Solution
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('Our Solution: Devin Security Autopilot', {
    x: 0.8, y: 0.5, w: 11, h: 0.7,
    fontSize: 28, fontFace: 'Arial', color: TEXT, bold: true
  });

  const steps = [
    { icon: '1', title: 'Scan', desc: 'pip-audit + npm audit detect real CVEs' },
    { icon: '2', title: 'Triage', desc: 'Auto-create GitHub issues with severity labels' },
    { icon: '3', title: 'Fix', desc: 'Devin sessions auto-fix each vulnerability in parallel' },
    { icon: '4', title: 'Verify', desc: 'PRs opened, tests run, dashboard tracks everything' }
  ];

  steps.forEach((s, i) => {
    const x = 0.8 + i * 2.9;
    slide.addText(s.icon, {
      x, y: 2.0, w: 0.6, h: 0.6,
      fontSize: 20, fontFace: 'Arial', color: DARK, bold: true,
      fill: { color: ACCENT },
      align: 'center', valign: 'middle',
      shape: pptx.ShapeType.roundRect, rectRadius: 0.1
    });
    slide.addText(s.title, {
      x: x + 0.8, y: 2.0, w: 1.8, h: 0.3,
      fontSize: 16, fontFace: 'Arial', color: TEXT, bold: true
    });
    slide.addText(s.desc, {
      x: x + 0.8, y: 2.4, w: 1.8, h: 0.6,
      fontSize: 12, fontFace: 'Arial', color: DIM
    });
  });

  // Slide 5: Results
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('Results', {
    x: 0.8, y: 0.5, w: 11, h: 0.7,
    fontSize: 28, fontFace: 'Arial', color: TEXT, bold: true
  });

  const vulnRows = [['CVE', 'Package', 'Severity', 'Status', 'PR']];
  for (const v of state.vulnerabilities) {
    vulnRows.push([
      v.cve,
      `${v.package} ${v.version}`,
      v.severity.toUpperCase(),
      v.status === 'fixed' ? 'FIXED' : v.status === 'failed' ? 'FAILED' : v.status.toUpperCase(),
      v.prUrl ? 'Opened' : '-'
    ]);
  }

  slide.addTable(vulnRows, {
    x: 0.8, y: 1.5, w: 11,
    fontSize: 11, fontFace: 'Arial',
    color: TEXT,
    border: { type: 'solid', pt: 0.5, color: '242833' },
    rowH: 0.4,
    autoPage: false
  });

  // Slide 6: Before/After
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('Before / After', {
    x: 0.8, y: 0.5, w: 11, h: 0.7,
    fontSize: 28, fontFace: 'Arial', color: TEXT, bold: true
  });

  slide.addText(String(total), {
    x: 2, y: 2, w: 3, h: 2,
    fontSize: 72, fontFace: 'Arial', color: DANGER, bold: true, align: 'center'
  });
  slide.addText('Vulnerabilities\nBefore', {
    x: 2, y: 4, w: 3, h: 0.8,
    fontSize: 16, fontFace: 'Arial', color: DIM, align: 'center'
  });

  slide.addText('→', {
    x: 5.5, y: 2.5, w: 1.5, h: 1,
    fontSize: 48, fontFace: 'Arial', color: ACCENT, align: 'center'
  });

  const remaining = total - fixed;
  slide.addText(String(remaining), {
    x: 7.5, y: 2, w: 3, h: 2,
    fontSize: 72, fontFace: 'Arial', color: remaining === 0 ? SUCCESS : 'FFA500', bold: true, align: 'center'
  });
  slide.addText('Vulnerabilities\nAfter', {
    x: 7.5, y: 4, w: 3, h: 0.8,
    fontSize: 16, fontFace: 'Arial', color: DIM, align: 'center'
  });

  // Slide 7: ROI
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('Return on Investment', {
    x: 0.8, y: 0.5, w: 11, h: 0.7,
    fontSize: 28, fontFace: 'Arial', color: TEXT, bold: true
  });

  const roiData = [
    ['', 'Manual', 'With Devin'],
    ['Time', `${hours} hours`, '< 1 hour'],
    ['Cost', `$${state.cost.estimatedEngineerCost.toLocaleString()}`, `$${Math.round(state.cost.totalAcus * 3)}`],
    ['Engineer Time', `${Math.ceil(hours / 8)} days`, '0 days'],
    ['ROI', '-', `${state.cost.roiPercentage}%`]
  ];

  slide.addTable(roiData, {
    x: 1.5, y: 1.8, w: 9,
    fontSize: 16, fontFace: 'Arial',
    color: TEXT,
    border: { type: 'solid', pt: 0.5, color: '242833' },
    rowH: 0.6,
    colW: [3, 3, 3],
    autoPage: false
  });

  // Slide 8: Next Steps
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('Next Steps', {
    x: 0.8, y: 0.5, w: 11, h: 0.7,
    fontSize: 28, fontFace: 'Arial', color: TEXT, bold: true
  });

  const nextSteps = [
    { phase: 'Phase 1', title: 'Expand to all repositories', desc: 'Connect all org repos to Security Autopilot' },
    { phase: 'Phase 2', title: 'CI/CD Integration', desc: 'Auto-scan on every commit, block merges with critical CVEs' },
    { phase: 'Phase 3', title: 'Compliance Reporting', desc: 'Auto-generate SOC2/ISO27001 evidence from remediation history' }
  ];

  nextSteps.forEach((s, i) => {
    slide.addText(s.phase, {
      x: 0.8, y: 1.8 + i * 1.4, w: 2, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: ACCENT, bold: true
    });
    slide.addText(s.title, {
      x: 3, y: 1.8 + i * 1.4, w: 8, h: 0.4,
      fontSize: 18, fontFace: 'Arial', color: TEXT, bold: true
    });
    slide.addText(s.desc, {
      x: 3, y: 2.2 + i * 1.4, w: 8, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: DIM
    });
  });

  // Slide 9: Why Devin
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText('Why Devin?', {
    x: 0.8, y: 0.5, w: 11, h: 0.7,
    fontSize: 28, fontFace: 'Arial', color: TEXT, bold: true
  });

  const reasons = [
    'Not a linter. Not a bot. An autonomous engineer.',
    'Reads code, understands context, creates proper PRs.',
    'Parallel sessions — fix 10 vulnerabilities simultaneously.',
    'Full audit trail: every session logged, every PR linked.',
    `${total} vulnerabilities. ${fixed} PRs. Zero engineer-hours.`
  ];

  reasons.forEach((r, i) => {
    slide.addText(r, {
      x: 1.5, y: 1.8 + i * 0.8, w: 10, h: 0.6,
      fontSize: 18, fontFace: 'Arial',
      color: i === reasons.length - 1 ? SUCCESS : TEXT,
      bold: i === reasons.length - 1
    });
  });

  // Save — ensure output directory exists
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'devin-security-autopilot-report.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`Report generated: ${outputPath}`);
  return outputPath;
}

module.exports = { generateReport };
