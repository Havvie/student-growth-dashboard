import { SOURCES, TOTAL_CYCLES } from './sources.js';

export const STATUS = {
  onTrack: { id: 'onTrack', label: 'On track', rank: 3 },
  watch: { id: 'watch', label: 'Watch', rank: 2 },
  offTrack: { id: 'offTrack', label: 'Off track', rank: 1 },
  baseline: { id: 'baseline', label: 'Baseline only', rank: 0 },
};

// Least-squares slope of score against cycle number.
export function slope(points) {
  if (points.length < 2) return null;
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.cycle, 0) / n;
  const my = points.reduce((a, p) => a + p.score, 0) / n;
  let num = 0; let den = 0;
  for (const p of points) { num += (p.cycle - mx) * (p.score - my); den += (p.cycle - mx) ** 2; }
  return den === 0 ? null : num / den;
}

export function settingsFor(assessment, records) {
  const src = SOURCES[assessment] ?? SOURCES.generic;
  if (src.id !== 'generic') return src;
  const mine = records.filter((x) => x.assessment === assessment);
  const expectedGrowth = mine.find((x) => x.expectedGrowth != null)?.expectedGrowth ?? 0;
  const unit = mine.find((x) => x.unit)?.unit || src.unit;
  return {
    ...src,
    label: mine[0]?.assessmentLabel ?? 'Custom',
    unit,
    unitLong: unit,
    unitPlural: unit,
    expectedGrowth,
    gapUnit: expectedGrowth || 5,
  };
}

// Build one summary per student for an assessment, using data up to and including `asOfCycle`.
export function studentSummaries(records, assessment, asOfCycle = TOTAL_CYCLES) {
  const src = settingsFor(assessment, records);
  const byStudent = new Map();
  for (const r of records) {
    if (r.assessment !== assessment || r.cycle > asOfCycle) continue;
    if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, []);
    byStudent.get(r.studentId).push(r);
  }
  const out = [];
  for (const [studentId, rows] of byStudent) {
    rows.sort((a, b) => a.cycle - b.cycle);
    const latestRow = rows[rows.length - 1];
    const points = rows.filter((r) => r.score != null).map((r) => ({ cycle: r.cycle, score: r.score, benchmark: r.benchmark }));
    out.push(summarize({ studentId, name: latestRow.name, grade: latestRow.grade, teacher: rows.find((r) => r.teacher)?.teacher ?? '', rows, points, src, asOfCycle }));
  }
  return out.sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0) || a.name.localeCompare(b.name));
}

function summarize({ points, src, rows, asOfCycle, ...base }) {
  const flags = [];
  const latest = points[points.length - 1] ?? null;
  const missedCycle = rows.some((r) => r.cycle === asOfCycle && r.score == null);
  if (missedCycle) flags.push(`No score for cycle ${asOfCycle} (absent or unfinished).`);
  const strands = [...rows].reverse().find((r) => r.strands)?.strands ?? null;

  if (!latest) {
    return { ...base, points, latest: null, status: STATUS.baseline, flags, strands, src };
  }
  const growth = slope(points);
  const expected = src.expectedGrowth;
  const gap = latest.score - latest.benchmark; // in the assessment's own units
  const gapCycles = gap / src.gapUnit; // how many cycles of typical growth the student is ahead/behind
  const remaining = Math.max(0, TOTAL_CYCLES - latest.cycle);
  const target = latest.benchmark + expected * remaining;
  const projected = growth == null ? null : latest.score + growth * remaining;
  const pace = growth != null && expected > 0 ? growth / expected : null;

  let status;
  if (growth == null) status = gap >= 0 ? STATUS.onTrack : STATUS.baseline;
  else if (projected >= target) status = STATUS.onTrack;
  else if (growth >= expected && growth > 0) status = STATUS.watch;
  else if (gap >= 0 && growth > 0) status = STATUS.watch; // at benchmark now, but pace may let them slip
  else status = STATUS.offTrack;

  // Explain the call in plain words.
  const fmt = (v) => formatScore(v, src);
  for (let i = 1; i < points.length; i++) {
    const drop = points[i - 1].score - points[i].score;
    if (drop > src.gapUnit * 0.5) flags.push(`Dropped ${fmt(drop)} ${src.unitPlural} from cycle ${points[i - 1].cycle} to ${points[i].cycle}.`);
  }
  if (pace != null && pace < 0.75) flags.push(`Growing at ${Math.round(Math.max(0, pace) * 100)}% of the expected pace.`);
  if (expected === 0 && growth != null && growth < 0 && gap < 0) flags.push('Scores are trending down while below the benchmark.');
  if (projected != null && projected < target) flags.push(`Projected to end the year at ${fmt(projected)} vs. a goal of ${fmt(target)}.`);
  if (growth == null && gap < 0) flags.push('Only one score so far. Status is set after the next cycle.');

  return { ...base, points, latest, growth, pace, gap, gapCycles, projected, target, remaining, status, flags, strands, src };
}

export function formatScore(v, src) {
  if (v == null || Number.isNaN(v)) return '–';
  return Number(v).toFixed(src.decimals);
}

export function signed(v, src) {
  if (v == null) return '–';
  const s = formatScore(Math.abs(v), src);
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : s;
}

const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Median distance from benchmark per cycle, split by grade, for the class growth chart.
export function gapTrend(records, assessment, grades) {
  const cycles = [...new Set(records.filter((r) => r.assessment === assessment).map((r) => r.cycle))].sort();
  return cycles.map((cycle) => {
    const row = { cycle, label: `Cycle ${cycle}` };
    for (const g of grades) {
      const gaps = records
        .filter((r) => r.assessment === assessment && r.cycle === cycle && r.grade === g && r.score != null && r.benchmark != null)
        .map((r) => r.score - r.benchmark);
      row[`g${g}`] = median(gaps);
      row[`n${g}`] = gaps.length;
    }
    return row;
  });
}

export function kpis(summaries) {
  const scored = summaries.filter((s) => s.latest);
  const count = (id) => scored.filter((s) => s.status.id === id).length;
  return {
    students: summaries.length,
    scored: scored.length,
    onTrack: count('onTrack'),
    watch: count('watch'),
    offTrack: count('offTrack'),
    baseline: count('baseline'),
    medianPace: median(scored.map((s) => s.pace)),
  };
}
