#!/usr/bin/env node
/**
 * Turns the Playwright JSON results into a feature-by-feature markdown report.
 *
 * Written for the GitHub Actions job summary and the PR comment, so it is
 * meant to be readable by someone who did not write the tests: it says which
 * feature areas were checked, whether each one passed, and what broke.
 *
 * Usage: node .github/scripts/e2e-report.js [resultsPath] [outputPath]
 */

const fs = require('fs');
const path = require('path');

const RESULTS_PATH = process.argv[2] || path.join(__dirname, '../../e2e/test-results/results.json');
const OUTPUT_PATH = process.argv[3] || path.join(__dirname, 'e2e-report.md');

// Friendly names, so the report reads as features rather than filenames.
// Anything not listed falls back to a tidied-up file name.
const FEATURE_AREAS = [
  { match: 'global.setup', name: 'Test sign-in setup' },
  { match: 'public/leaderboard-visibility', name: 'Leaderboard privacy (signed-out visitors)' },
  { match: 'public/events-teaser', name: 'Events teaser (signed-out visitors)' },
  { match: 'public/public-pages', name: 'Public pages (home, about, contact)' },
  { match: 'api/api', name: 'API & backend endpoints' },
  { match: 'auth/authentication', name: 'Sign up, sign in, sessions' },
  { match: 'dashboard/logtrip', name: 'Log a fishing trip' },
  { match: 'dashboard/multi-fishing-types', name: 'Several fishing types per trip' },
  { match: 'dashboard/events', name: 'Fishing events (create, join, leave)' },
  { match: 'dashboard/leaderboard-member', name: 'Leaderboard (members)' },
  { match: 'dashboard/dashboard', name: 'Dashboard (reports, predictions, data)' },
  { match: 'admin/leaderboard-share', name: 'Facebook share tool (admin only)' },
  { match: 'admin/admin', name: 'Admin screens' }
];

const areaFor = (file) => {
  const normalised = file.replace(/\\/g, '/');
  const known = FEATURE_AREAS.find(a => normalised.includes(a.match));
  if (known) return known.name;
  return path.basename(normalised).replace(/\.spec\.js$/, '').replace(/[-_]/g, ' ');
};

/** Walks Playwright's nested suites and flattens every spec into one list. */
const collectSpecs = (suites, file, out) => {
  for (const suite of suites || []) {
    const suiteFile = suite.file || file;
    for (const spec of suite.specs || []) {
      for (const testCase of spec.tests || []) {
        out.push({
          file: suiteFile,
          suite: suite.title !== suiteFile ? suite.title : '',
          title: spec.title,
          status: testCase.status,
          error: (testCase.results || [])
            .map(r => r.error && (r.error.message || r.error.value))
            .filter(Boolean)[0]
        });
      }
    }
    collectSpecs(suite.suites, suiteFile, out);
  }
  return out;
};

const formatDuration = (ms) => {
  if (!ms) return 'n/a';
  const total = Math.round(ms / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

// Playwright error output is full of ANSI colour codes, which render as noise
const stripAnsi = (text) => String(text).replace(/\u001b\[[0-9;]*m/g, '');

const buildReport = () => {
  if (!fs.existsSync(RESULTS_PATH)) {
    return {
      failed: true,
      markdown: [
        '## 🎣 Fishing Tracker — feature test report',
        '',
        '> ❌ **The test run produced no results file.**',
        '',
        'This usually means the app or the database did not start, so the suite never ran.',
        'Check the "Start backend" and "Wait for services" steps in the job log.'
      ].join('\n')
    };
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
  const specs = collectSpecs(results.suites, '', []);

  const areas = new Map();
  for (const spec of specs) {
    const area = areaFor(spec.file);
    if (!areas.has(area)) areas.set(area, { passed: 0, failed: 0, skipped: 0, flaky: 0, failures: [] });
    const bucket = areas.get(area);

    if (spec.status === 'expected') bucket.passed++;
    else if (spec.status === 'skipped') bucket.skipped++;
    else if (spec.status === 'flaky') { bucket.flaky++; bucket.passed++; }
    else {
      bucket.failed++;
      bucket.failures.push(spec);
    }
  }

  const totals = [...areas.values()].reduce(
    (acc, a) => ({
      passed: acc.passed + a.passed,
      failed: acc.failed + a.failed,
      skipped: acc.skipped + a.skipped,
      flaky: acc.flaky + a.flaky
    }),
    { passed: 0, failed: 0, skipped: 0, flaky: 0 }
  );

  const total = totals.passed + totals.failed + totals.skipped;
  const duration = formatDuration(results.stats && results.stats.duration);
  const allGood = totals.failed === 0 && total > 0;

  const lines = [];
  lines.push('## 🎣 Fishing Tracker — feature test report');
  lines.push('');

  if (total === 0) {
    lines.push('> ❌ **No tests ran.** The suite produced a results file but it was empty.');
  } else if (allGood) {
    lines.push(`> ✅ **All good — ${totals.passed} checks passed** across ${areas.size} feature areas in ${duration}.`);
    if (totals.flaky > 0) {
      lines.push('>');
      lines.push(`> ⚠️ ${totals.flaky} test${totals.flaky === 1 ? '' : 's'} only passed on a retry — worth a look if it keeps happening.`);
    }
  } else {
    lines.push(`> ❌ **${totals.failed} check${totals.failed === 1 ? '' : 's'} failed** out of ${total}, in ${duration}. Details below.`);
  }

  lines.push('');
  lines.push('| Feature area | Passed | Failed | Skipped | |');
  lines.push('|---|---:|---:|---:|:--|');

  for (const [name, a] of [...areas.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
    const mark = a.failed > 0 ? '❌' : a.passed === 0 ? '⏭️' : '✅';
    lines.push(`| ${name} | ${a.passed} | ${a.failed} | ${a.skipped} | ${mark} |`);
  }

  lines.push(`| **Total** | **${totals.passed}** | **${totals.failed}** | **${totals.skipped}** | ${allGood ? '✅' : '❌'} |`);
  lines.push('');

  if (totals.failed > 0) {
    lines.push('### What failed');
    lines.push('');
    for (const [name, a] of areas.entries()) {
      if (a.failed === 0) continue;
      lines.push(`#### ${name}`);
      lines.push('');
      for (const failure of a.failures) {
        const where = failure.suite ? `${failure.suite} → ` : '';
        lines.push(`<details><summary>❌ ${where}${failure.title}</summary>`);
        lines.push('');
        lines.push('```');
        lines.push(stripAnsi(failure.error || 'No error message captured').split('\n').slice(0, 15).join('\n'));
        lines.push('```');
        lines.push('</details>');
        lines.push('');
      }
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('<sub>Full run with screenshots, traces and videos of any failure is attached to this run as the **playwright-report** artifact.</sub>');

  return { failed: !allGood, markdown: lines.join('\n') };
};

const { failed, markdown } = buildReport();
fs.writeFileSync(OUTPUT_PATH, markdown);
console.log(markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n');
}

// The report itself always publishes; the workflow decides whether to fail.
process.exit(failed ? 1 : 0);
