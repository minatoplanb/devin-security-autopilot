const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

// Preset B: Clean Tech
const BG = 'FFFFFF';
const BG_ALT = 'F8FAFC';
const CARD_BG = 'F1F5F9';
const CARD_BORDER = 'E2E8F0';
const ACCENT = '2563EB';
const ACCENT2 = '0891B2';
const SUCCESS = '16A34A';
const DANGER = 'DC2626';
const WARNING = 'D97706';
const TEXT = '1E293B';
const TEXT2 = '64748B';
const TITLE_BG = '0F172A';
const TITLE_TEXT = 'F8FAFC';
const TITLE_DIM = '94A3B8';

const TOTAL_SLIDES = 9;

async function generate() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'David Hsu';
  pres.title = 'Devin Security Autopilot — POC Results';

  // Helper: add footer to content slides
  function addFooter(slide, num) {
    slide.addText('Devin Security Autopilot', {
      x: 0.5, y: 5.2, w: 3, h: 0.3,
      fontSize: 10, fontFace: 'Calibri', color: TEXT2
    });
    slide.addText(`${num} / ${TOTAL_SLIDES}`, {
      x: 8.5, y: 5.2, w: 1.2, h: 0.3,
      fontSize: 10, fontFace: 'Calibri', color: TEXT2, align: 'right'
    });
  }

  // Helper: card with accent bar
  function addCard(slide, x, y, w, h, title, body, accentColor) {
    accentColor = accentColor || ACCENT;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h, fill: { color: CARD_BG }, rectRadius: 0.05,
      line: { color: CARD_BORDER, width: 0.5 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h, fill: { color: accentColor }, rectRadius: 0.02
    });
    if (title) {
      slide.addText(title, {
        x: x + 0.25, y: y + 0.15, w: w - 0.4, h: 0.35,
        fontSize: 16, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
      });
    }
    if (body) {
      slide.addText(body, {
        x: x + 0.25, y: y + 0.5, w: w - 0.4, h: h - 0.65,
        fontSize: 13, fontFace: 'Calibri', color: TEXT2, margin: 0, lineSpacingMultiple: 1.3
      });
    }
  }

  // Helper: stat callout
  function addStat(slide, x, y, w, number, label, color) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 1.4, fill: { color: CARD_BG }, rectRadius: 0.05,
      line: { color: CARD_BORDER, width: 0.5 }
    });
    slide.addText(String(number), {
      x, y: y + 0.1, w, h: 0.8,
      fontSize: 48, fontFace: 'Calibri', bold: true, color: color || ACCENT,
      align: 'center', margin: 0
    });
    slide.addText(label, {
      x, y: y + 0.9, w, h: 0.4,
      fontSize: 12, fontFace: 'Calibri', color: TEXT2,
      align: 'center', margin: 0
    });
  }

  // ========== SLIDE 1: Title ==========
  let slide = pres.addSlide();
  slide.background = { color: TITLE_BG };
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.0, w: 0.08, h: 1.6, fill: { color: ACCENT }
  });
  slide.addText('Devin Security Autopilot', {
    x: 0.9, y: 1.8, w: 8.5, h: 0.9,
    fontSize: 40, fontFace: 'Calibri', bold: true, color: TITLE_TEXT, margin: 0
  });
  slide.addText('Automated CVE Remediation — POC Results', {
    x: 0.9, y: 2.7, w: 8.5, h: 0.5,
    fontSize: 20, fontFace: 'Calibri', color: TITLE_DIM, margin: 0
  });
  slide.addText('Apache Superset  |  June 2026', {
    x: 0.9, y: 3.4, w: 8.5, h: 0.4,
    fontSize: 14, fontFace: 'Calibri', color: TITLE_DIM, margin: 0
  });
  slide.addText('David Hsu  |  Powered by Devin — Cognition AI', {
    x: 0.5, y: 5.0, w: 9, h: 0.4,
    fontSize: 12, fontFace: 'Calibri', color: TITLE_DIM, margin: 0
  });

  // ========== SLIDE 2: Executive Summary ==========
  slide = pres.addSlide();
  slide.background = { color: BG };
  addFooter(slide, 2);
  slide.addText('Executive Summary', {
    x: 0.5, y: 0.4, w: 9, h: 0.6,
    fontSize: 32, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
  });

  // Stats row
  addStat(slide, 0.5, 1.3, 2.1, '9', 'CVEs Found', DANGER);
  addStat(slide, 2.8, 1.3, 2.1, '7', 'Auto-Fixed', SUCCESS);
  addStat(slide, 5.1, 1.3, 2.1, '3', 'PRs Opened', ACCENT);
  addStat(slide, 7.4, 1.3, 2.1, '0', 'Engineer Hours', ACCENT2);

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.0, w: 9, h: 0.02, fill: { color: CARD_BORDER }
  });

  slide.addText('We scanned Apache Superset — 73K stars, one of the most popular BI platforms. Found 9 real security vulnerabilities in core dependencies (Flask, PyJWT, PyArrow, Paramiko). Devin auto-fixed 7 of them by opening 3 pull requests. Zero human intervention. Total Devin cost: ~$9. Manual equivalent: $2,700.', {
    x: 0.5, y: 3.3, w: 9, h: 1.5,
    fontSize: 15, fontFace: 'Calibri', color: TEXT2, lineSpacingMultiple: 1.5, margin: 0
  });

  // ========== SLIDE 3: The Problem ==========
  slide = pres.addSlide();
  slide.background = { color: BG };
  addFooter(slide, 3);
  slide.addText('The Problem', {
    x: 0.5, y: 0.4, w: 9, h: 0.6,
    fontSize: 32, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
  });

  addCard(slide, 0.5, 1.2, 4.3, 1.0, '500+', 'Average open CVEs per enterprise codebase', DANGER);
  addCard(slide, 5.2, 1.2, 4.3, 1.0, '120 days', 'Mean time to remediate a vulnerability', WARNING);
  addCard(slide, 0.5, 2.4, 4.3, 1.0, '$300 / fix', 'Average cost per vulnerability (4 engineer-hours)', DANGER);
  addCard(slide, 5.2, 2.4, 4.3, 1.0, '60%', 'Of breaches exploit known, unpatched CVEs', WARNING);

  slide.addText('Security teams are overwhelmed. Vulnerabilities accumulate faster than teams can fix them. Manual dependency updates risk breaking changes and regressions.', {
    x: 0.5, y: 3.7, w: 9, h: 0.8,
    fontSize: 14, fontFace: 'Calibri', color: TEXT2, lineSpacingMultiple: 1.4, margin: 0
  });

  // ========== SLIDE 4: Our Solution ==========
  slide = pres.addSlide();
  slide.background = { color: BG };
  addFooter(slide, 4);
  slide.addText('Our Solution', {
    x: 0.5, y: 0.4, w: 9, h: 0.6,
    fontSize: 32, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
  });

  const steps = [
    { num: '1', title: 'Scan', desc: 'pip-audit + npm audit detect real CVEs with advisory numbers' },
    { num: '2', title: 'Triage', desc: 'Auto-create GitHub issues tagged by severity' },
    { num: '3', title: 'Fix', desc: 'Parallel Devin sessions fix each vulnerability autonomously' },
    { num: '4', title: 'Verify', desc: 'PRs opened, dashboard tracks progress + cost in real-time' }
  ];

  steps.forEach((s, i) => {
    const x = 0.5 + i * 2.35;
    // Number circle
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.6, y: 1.3, w: 0.55, h: 0.55, fill: { color: ACCENT }
    });
    slide.addText(s.num, {
      x: x + 0.6, y: 1.3, w: 0.55, h: 0.55,
      fontSize: 22, fontFace: 'Calibri', bold: true, color: 'FFFFFF',
      align: 'center', valign: 'middle', margin: 0
    });
    slide.addText(s.title, {
      x, y: 2.05, w: 2.15, h: 0.35,
      fontSize: 18, fontFace: 'Calibri', bold: true, color: TEXT, align: 'center', margin: 0
    });
    slide.addText(s.desc, {
      x, y: 2.4, w: 2.15, h: 0.9,
      fontSize: 12, fontFace: 'Calibri', color: TEXT2, align: 'center',
      lineSpacingMultiple: 1.3, margin: 0
    });
  });

  // Arrow connectors
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + (i + 1) * 2.35 - 0.15;
    slide.addText('\u2192', {
      x, y: 1.35, w: 0.3, h: 0.5,
      fontSize: 24, color: ACCENT, align: 'center', valign: 'middle'
    });
  }

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.6, w: 9, h: 1.4, fill: { color: CARD_BG }, rectRadius: 0.05,
    line: { color: CARD_BORDER, width: 0.5 }
  });
  slide.addText('Event-Driven Architecture', {
    x: 0.7, y: 3.7, w: 8.6, h: 0.35,
    fontSize: 16, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
  });
  slide.addText('Scanner  \u2192  Issue Creator  \u2192  Devin Orchestrator (v3 API, 5 parallel)  \u2192  Trust Dashboard (real-time polling)\n\nNode.js + Express  |  Docker  |  Single docker-compose up', {
    x: 0.7, y: 4.1, w: 8.6, h: 0.8,
    fontSize: 13, fontFace: 'Calibri', color: TEXT2, lineSpacingMultiple: 1.3, margin: 0
  });

  // ========== SLIDE 5: Results ==========
  slide = pres.addSlide();
  slide.background = { color: BG };
  addFooter(slide, 5);
  slide.addText('Results', {
    x: 0.5, y: 0.4, w: 9, h: 0.6,
    fontSize: 32, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
  });

  const tableRows = [
    [
      { text: 'CVE', options: { bold: true, color: 'FFFFFF', fill: { color: ACCENT } } },
      { text: 'Package', options: { bold: true, color: 'FFFFFF', fill: { color: ACCENT } } },
      { text: 'Severity', options: { bold: true, color: 'FFFFFF', fill: { color: ACCENT } } },
      { text: 'Status', options: { bold: true, color: 'FFFFFF', fill: { color: ACCENT } } },
      { text: 'PR', options: { bold: true, color: 'FFFFFF', fill: { color: ACCENT } } }
    ],
    ['CVE-2026-27205', 'flask 2.3.3', 'HIGH', 'FIXED', '#10'],
    ['PYSEC-2026-175..179', 'pyjwt 2.12.0 (5 CVEs)', 'HIGH', 'FIXED', '#11'],
    ['PYSEC-2026-113', 'pyarrow 20.0.0', 'HIGH', 'FIXED', '#12'],
    ['CVE-2026-44405', 'paramiko 3.5.1', 'MODERATE', 'NO FIX AVAIL', '-'],
    ['GHSA-eslint-i18n', 'eslint-plugin-i18n-strings', 'CRITICAL', 'MALWARE', '-']
  ];

  slide.addTable(tableRows, {
    x: 0.5, y: 1.2, w: 9,
    fontSize: 12, fontFace: 'Calibri',
    color: TEXT,
    border: { type: 'solid', pt: 0.5, color: CARD_BORDER },
    rowH: 0.45,
    colW: [2.5, 2.5, 1.2, 1.5, 1.3],
    autoPage: false,
    fill: { color: BG }
  });

  slide.addText('All vulnerabilities are real — discovered via pip-audit and npm audit on Apache Superset\'s dependency tree. Every PR was created autonomously by Devin.', {
    x: 0.5, y: 4.2, w: 9, h: 0.6,
    fontSize: 13, fontFace: 'Calibri', color: TEXT2, margin: 0
  });

  // ========== SLIDE 6: Before / After ==========
  slide = pres.addSlide();
  slide.background = { color: BG };
  addFooter(slide, 6);
  slide.addText('Before / After', {
    x: 0.5, y: 0.4, w: 9, h: 0.6,
    fontSize: 32, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
  });

  // Before card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.5, w: 3.5, h: 2.5, fill: { color: CARD_BG }, rectRadius: 0.1,
    line: { color: DANGER, width: 1.5 }
  });
  slide.addText('BEFORE', {
    x: 0.8, y: 1.6, w: 3.5, h: 0.4,
    fontSize: 14, fontFace: 'Calibri', bold: true, color: DANGER, align: 'center', margin: 0
  });
  slide.addText('9', {
    x: 0.8, y: 2.1, w: 3.5, h: 1.2,
    fontSize: 72, fontFace: 'Calibri', bold: true, color: DANGER, align: 'center', margin: 0
  });
  slide.addText('Open Vulnerabilities', {
    x: 0.8, y: 3.3, w: 3.5, h: 0.4,
    fontSize: 14, fontFace: 'Calibri', color: TEXT2, align: 'center', margin: 0
  });

  // Arrow
  slide.addText('\u2192', {
    x: 4.3, y: 2.2, w: 1.4, h: 1,
    fontSize: 48, fontFace: 'Calibri', color: ACCENT, align: 'center', valign: 'middle'
  });

  // After card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.7, y: 1.5, w: 3.5, h: 2.5, fill: { color: CARD_BG }, rectRadius: 0.1,
    line: { color: SUCCESS, width: 1.5 }
  });
  slide.addText('AFTER', {
    x: 5.7, y: 1.6, w: 3.5, h: 0.4,
    fontSize: 14, fontFace: 'Calibri', bold: true, color: SUCCESS, align: 'center', margin: 0
  });
  slide.addText('2', {
    x: 5.7, y: 2.1, w: 3.5, h: 1.2,
    fontSize: 72, fontFace: 'Calibri', bold: true, color: SUCCESS, align: 'center', margin: 0
  });
  slide.addText('Remaining (no fix available)', {
    x: 5.7, y: 3.3, w: 3.5, h: 0.4,
    fontSize: 14, fontFace: 'Calibri', color: TEXT2, align: 'center', margin: 0
  });

  slide.addText('78% reduction in open vulnerabilities — automatically', {
    x: 0.5, y: 4.4, w: 9, h: 0.4,
    fontSize: 16, fontFace: 'Calibri', bold: true, color: ACCENT, align: 'center', margin: 0
  });

  // ========== SLIDE 7: ROI ==========
  slide = pres.addSlide();
  slide.background = { color: BG };
  addFooter(slide, 7);
  slide.addText('Return on Investment', {
    x: 0.5, y: 0.4, w: 9, h: 0.6,
    fontSize: 32, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
  });

  const roiRows = [
    [
      { text: '', options: { bold: true, fill: { color: ACCENT }, color: 'FFFFFF' } },
      { text: 'Manual', options: { bold: true, fill: { color: ACCENT }, color: 'FFFFFF' } },
      { text: 'With Devin', options: { bold: true, fill: { color: ACCENT }, color: 'FFFFFF' } }
    ],
    ['Time', '36 hours', '< 1 hour'],
    ['Cost', '$2,700', '$9'],
    ['Engineer Days', '4.5 days', '0 days'],
    ['Parallel Fixes', '1 at a time', '5 simultaneous']
  ];

  slide.addTable(roiRows, {
    x: 1.0, y: 1.3, w: 8,
    fontSize: 15, fontFace: 'Calibri',
    color: TEXT,
    border: { type: 'solid', pt: 0.5, color: CARD_BORDER },
    rowH: 0.55,
    colW: [2.5, 2.75, 2.75],
    autoPage: false,
    fill: { color: BG }
  });

  // ROI callout
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 2.5, y: 4.0, w: 5, h: 1.2, fill: { color: CARD_BG }, rectRadius: 0.1,
    line: { color: SUCCESS, width: 1.5 }
  });
  slide.addText('99%', {
    x: 2.5, y: 4.0, w: 5, h: 0.8,
    fontSize: 48, fontFace: 'Calibri', bold: true, color: SUCCESS, align: 'center', margin: 0
  });
  slide.addText('Cost Reduction', {
    x: 2.5, y: 4.7, w: 5, h: 0.4,
    fontSize: 14, fontFace: 'Calibri', color: TEXT2, align: 'center', margin: 0
  });

  // ========== SLIDE 8: Next Steps ==========
  slide = pres.addSlide();
  slide.background = { color: BG };
  addFooter(slide, 8);
  slide.addText('Next Steps', {
    x: 0.5, y: 0.4, w: 9, h: 0.6,
    fontSize: 32, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
  });

  const phases = [
    { phase: 'Phase 1', title: 'Expand to All Repositories', desc: 'Connect every repo in the organization to Security Autopilot. One scan covers everything.' },
    { phase: 'Phase 2', title: 'CI/CD Integration', desc: 'Auto-scan on every commit. Block merges with critical CVEs. Devin fixes in the background.' },
    { phase: 'Phase 3', title: 'Compliance Reporting', desc: 'Auto-generate SOC2 and ISO 27001 evidence from remediation history. Audit-ready at all times.' }
  ];

  phases.forEach((p, i) => {
    const y = 1.2 + i * 1.3;
    // Phase badge
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 1.2, h: 0.35, fill: { color: ACCENT }, rectRadius: 0.05
    });
    slide.addText(p.phase, {
      x: 0.5, y, w: 1.2, h: 0.35,
      fontSize: 12, fontFace: 'Calibri', bold: true, color: 'FFFFFF',
      align: 'center', valign: 'middle', margin: 0
    });
    slide.addText(p.title, {
      x: 1.9, y, w: 7.5, h: 0.35,
      fontSize: 18, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0
    });
    slide.addText(p.desc, {
      x: 1.9, y: y + 0.4, w: 7.5, h: 0.6,
      fontSize: 13, fontFace: 'Calibri', color: TEXT2, margin: 0
    });
  });

  // ========== SLIDE 9: Closing ==========
  slide = pres.addSlide();
  slide.background = { color: TITLE_BG };
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 3.0, y: 1.5, w: 0.08, h: 2.5, fill: { color: ACCENT }
  });
  slide.addText('9 vulnerabilities.\n3 pull requests.\n0 engineer-hours.', {
    x: 3.4, y: 1.5, w: 6, h: 1.8,
    fontSize: 30, fontFace: 'Calibri', bold: true, color: TITLE_TEXT,
    lineSpacingMultiple: 1.5, margin: 0
  });
  slide.addText("That's Devin.", {
    x: 3.4, y: 3.3, w: 6, h: 0.6,
    fontSize: 24, fontFace: 'Calibri', color: ACCENT, margin: 0
  });
  slide.addText('David Hsu  |  devin.ai', {
    x: 0.5, y: 5.0, w: 9, h: 0.4,
    fontSize: 12, fontFace: 'Calibri', color: TITLE_DIM, margin: 0
  });

  // Save
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'devin-security-autopilot-report.pptx');
  await pres.writeFile({ fileName: outputPath });
  console.log('Done:', outputPath);
}

generate().catch(e => { console.error(e); process.exit(1); });
