const path = require('path');
const fs = require('fs');

// Load env from .env file BEFORE any other requires that read process.env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Now safe to require modules that read process.env at load time
const express = require('express');
const db = require('./db');
const apiRoutes = require('./api');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

// CORS for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// API routes
app.use('/api', apiRoutes);

// Serve dashboard
app.use(express.static(path.join(__dirname, '..', 'dashboard')));

// Fallback to dashboard for non-API routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard', 'index.html'));
});

// Load state
db.load();

// Demo mode
if (process.env.DEMO_MODE === 'true') {
  const { loadDemoData } = require('./demo-data');
  loadDemoData();
}

app.listen(PORT, () => {
  const mode = process.env.DEMO_MODE === 'true' ? '🎭 DEMO' : '🔴 LIVE';
  console.log(`
╔══════════════════════════════════════════════════╗
║     Devin Security Autopilot  ${mode}            ║
║                                                  ║
║     Dashboard:  http://localhost:${PORT}            ║
║     API:        http://localhost:${PORT}/api/status  ║
╠══════════════════════════════════════════════════╣
║     POST /api/scan       — Trigger scan          ║
║     POST /api/remediate  — Start Devin sessions  ║
║     GET  /api/status     — Pipeline status        ║
║     GET  /api/report     — Report data           ║
╚══════════════════════════════════════════════════╝
`);
});
