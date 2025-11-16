#!/usr/bin/env node
/**
 * TS-Plato Summary Script for Supergains Monorepo
 *
 * Reads all ts-plato reports and generates a summary table with:
 * - Files, Avg SLOC, Avg Complexity, Avg Maintainability per package
 * - Delta values compared to previous run (if history exists)
 * - Overall weighted averages
 */
const fs = require('node:fs');
const path = require('node:path');

function readJsonSafe(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(txt);
  } catch {
    return undefined;
  }
}

function toFixed(n, digits = 1) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-';
  return n.toFixed(digits);
}

function pad(str, width) {
  const s = String(str);
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

function printHeader() {
  const cols = [
    pad('Package', 24),
    pad('Files', 6),
    pad('SLOC', 8),
    pad('Avg CC', 8),
    pad('Maint', 8),
    pad('Δ CC', 8),
    pad('Δ Maint', 9)
  ];
  console.log(cols.join(' '));
  console.log('-'.repeat(cols.join(' ').length));
}

function calculateAverageComplexity(reports) {
  if (!Array.isArray(reports) || reports.length === 0) return 0;

  const complexities = reports
    .map(r => r.complexity?.aggregate?.cyclomatic)
    .filter(c => typeof c === 'number');

  if (complexities.length === 0) return 0;
  return complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
}

function getDeltaFromHistory(historyPath) {
  const hist = readJsonSafe(historyPath);
  if (!hist || !Array.isArray(hist) || hist.length < 2) {
    return { cc: undefined, maintainability: undefined };
  }

  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 2];

  if (!last || !prev) return { cc: undefined, maintainability: undefined };

  // For maintainability, it's stored directly in the history
  const maintDelta = typeof last.average?.maintainability === 'string' && typeof prev.average?.maintainability === 'string'
    ? parseFloat(last.average.maintainability) - parseFloat(prev.average.maintainability)
    : undefined;

  // For complexity, we need to calculate from raw data since it's not in history
  // This is a limitation - we can't show CC deltas without storing CC in history
  return {
    cc: undefined, // Not available in current ts-plato history format
    maintainability: maintDelta
  };
}

function main() {
  console.log('TS-PLATO SUMMARY: Code Complexity & Maintainability Report');
  console.log('='.repeat(65));
  console.log();

  const coverageDir = path.resolve('coverage');
  if (!fs.existsSync(coverageDir)) {
    console.error('coverage/ directory not found. Run .\metrics\ts-plato\run-all.ps1 first.');
    process.exit(1);
  }

  const entries = fs.readdirSync(coverageDir, { withFileTypes: true });
  const platoDirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('ts-plato-'))
    .map((e) => path.join(coverageDir, e.name));

  if (platoDirs.length === 0) {
    console.error('No ts-plato reports found under coverage/.');
    console.error('Run .\metrics\ts-plato\run-all.ps1 to generate reports first.');
    process.exit(1);
  }

  printHeader();

  let totalFiles = 0;
  let totalSlocWeighted = 0;
  let totalComplexityWeighted = 0;
  let totalMaintainabilityWeighted = 0;
  const packageData = [];

  for (const dir of platoDirs) {
    const reportPath = path.join(dir, 'report.json');
    const data = readJsonSafe(reportPath);
    if (!data) continue;

    const summary = data.summary || {};
    const reports = data.reports || [];
    const files = reports.length;

    // Get metrics
    const avgSloc = typeof summary.average?.sloc === 'number' ? summary.average.sloc : 0;
    const avgComplexity = calculateAverageComplexity(reports);
    const avgMaintainability = typeof summary.average?.maintainability === 'string'
      ? parseFloat(summary.average.maintainability)
      : 0;

    // Get deltas from history
    const historyPath = path.join(dir, 'report.history.json');
    const deltas = getDeltaFromHistory(historyPath);

    // Accumulate totals (weighted by file count)
    totalFiles += files;
    totalSlocWeighted += avgSloc * files;
    totalComplexityWeighted += avgComplexity * files;
    totalMaintainabilityWeighted += avgMaintainability * files;

    const packageName = path.basename(dir).replace(/^ts-plato-/, '');
    packageData.push({
      name: packageName,
      files,
      avgSloc,
      avgComplexity,
      avgMaintainability,
      deltas
    });
  }

  // Sort by maintainability (worst first for attention)
  packageData.sort((a, b) => a.avgMaintainability - b.avgMaintainability);

  // Print package rows
  for (const pkg of packageData) {
    const row = [
      pad(pkg.name, 24),
      pad(pkg.files, 6),
      pad(toFixed(pkg.avgSloc), 8),
      pad(toFixed(pkg.avgComplexity), 8),
      pad(toFixed(pkg.avgMaintainability), 8),
      pad(pkg.deltas.cc === undefined ? '-' : toFixed(pkg.deltas.cc), 8),
      pad(pkg.deltas.maintainability === undefined ? '-' : toFixed(pkg.deltas.maintainability), 9)
    ];
    console.log(row.join(' '));
  }

  // Calculate and display overall averages
  if (totalFiles > 0) {
    const overallAvgSloc = totalSlocWeighted / totalFiles;
    const overallAvgComplexity = totalComplexityWeighted / totalFiles;
    const overallAvgMaintainability = totalMaintainabilityWeighted / totalFiles;

    console.log();
    console.log('Overall Summary (weighted by file count):');
    console.log(`  Total Files      : ${totalFiles}`);
    console.log(`  Avg SLOC         : ${toFixed(overallAvgSloc)}`);
    console.log(`  Avg Complexity   : ${toFixed(overallAvgComplexity)}`);
    console.log(`  Avg Maintainability: ${toFixed(overallAvgMaintainability)}`);

    console.log();
    console.log('Quality Assessment:');

    // Complexity assessment
    if (overallAvgComplexity <= 10) {
      console.log('  Complexity: GOOD (≤10) - Simple, easy to test');
    } else if (overallAvgComplexity <= 20) {
      console.log('  Complexity: MODERATE (11-20) - Watch for trends');
    } else {
      console.log('  Complexity: HIGH (>20) - Consider refactoring');
    }

    // Maintainability assessment
    if (overallAvgMaintainability >= 85) {
      console.log('  Maintainability: EXCELLENT (≥85) - Highly maintainable');
    } else if (overallAvgMaintainability >= 65) {
      console.log('  Maintainability: GOOD (65-84) - Moderately maintainable');
    } else {
      console.log('  Maintainability: POOR (<65) - Difficult to maintain');
    }
  }

  console.log();
  console.log('For detailed analysis, open any coverage/ts-plato-*/index.html file.');
  console.log('Legend: CC = Cyclomatic Complexity, Maint = Maintainability Index, Δ = Change from previous run');
}

if (require.main === module) {
  main();
}

module.exports = { main };
