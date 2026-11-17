import { standardFor } from './standards.js';

// Suggest small intervention groups from the latest cycle's results.
// Two modes:
//   level - sort students by distance from benchmark and cut into even groups
//   skill - group students who share the same weakest skill (needs skill scores)

export const TIERS = [
  { id: 'intensive', label: 'Intensive', focus: 'Intensive support', rank: 1, test: (g) => g < -3 },
  { id: 'strategic', label: 'Strategic', focus: 'Strategic support', rank: 2, test: (g) => g < -1 },
  { id: 'onLevel', label: 'On level', focus: 'On-level practice', rank: 3, test: () => true },
];

export const tierFor = (gapCycles) => (gapCycles == null ? null : TIERS.find((t) => t.test(gapCycles)));

export function weakestStrand(summary) {
  if (!summary.strands || !summary.latest) return null;
  let best = null;
  for (const [name, value] of Object.entries(summary.strands)) {
    const diff = value - summary.latest.score;
    if (!best || diff < best.diff) best = { name, value, diff };
  }
  return best;
}

// Split a sorted list into ceil(n / max) groups whose sizes differ by at most one.
export function chunkEvenly(list, max) {
  if (!list.length) return [];
  const k = Math.ceil(list.length / max);
  const base = Math.floor(list.length / k);
  let extra = list.length % k;
  const out = [];
  let i = 0;
  for (let g = 0; g < k; g++) {
    const size = base + (extra-- > 0 ? 1 : 0);
    out.push(list.slice(i, i + size));
    i += size;
  }
  return out;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function suggestGroups(summaries, { maxSize = 5, sameGrade = true, mode = 'level', previous = [] } = {}) {
  const scored = summaries.filter((s) => s.latest && s.gapCycles != null);
  const prevTier = new Map(previous.filter((p) => p.gapCycles != null).map((p) => [p.studentId, tierFor(p.gapCycles)]));

  const pools = new Map();
  for (const s of scored) {
    const key = sameGrade ? `Grade ${s.grade}` : 'All grades';
    if (!pools.has(key)) pools.set(key, []);
    pools.get(key).push(s);
  }

  const groups = [];
  for (const [poolName, pool] of [...pools.entries()].sort()) {
    let buckets;
    if (mode === 'skill') {
      const bySkill = new Map();
      for (const s of pool) {
        const w = weakestStrand(s)?.name ?? 'No strand data';
        if (!bySkill.has(w)) bySkill.set(w, []);
        bySkill.get(w).push(s);
      }
      // Fold single-student skill buckets together so nobody is grouped alone.
      const singles = [...bySkill.entries()].filter(([, v]) => v.length < 2);
      if (singles.length > 1) {
        for (const [k] of singles) bySkill.delete(k);
        bySkill.set('Mixed skills', singles.flatMap(([, v]) => v));
      } else if (singles.length === 1 && bySkill.size > 1) {
        // One student alone: join the smallest other group.
        const [k, [student]] = singles[0];
        bySkill.delete(k);
        const smallest = [...bySkill.values()].sort((a, b) => a.length - b.length)[0];
        smallest.push(student);
      }
      buckets = [...bySkill.entries()].map(([focus, list]) => ({ focus, list }));
    } else {
      buckets = [{ focus: null, list: pool }];
    }

    for (const { focus, list } of buckets) {
      const sorted = [...list].sort((a, b) => a.gapCycles - b.gapCycles);
      for (const members of chunkEvenly(sorted, maxSize)) {
        const med = median(members.map((m) => m.gapCycles));
        const tier = tierFor(med);
        groups.push({
          pool: poolName,
          tier,
          focus: focus ?? tier.focus,
          medianGapCycles: med,
          members: members.map((m) => {
            const now = tierFor(m.gapCycles);
            const before = prevTier.get(m.studentId);
            const move = !before ? 'new' : now.rank > before.rank ? 'up' : now.rank < before.rank ? 'down' : 'same';
            return { ...m, tierNow: now, tierBefore: before ?? null, move, weakest: weakestStrand(m) };
          }),
        });
      }
    }
  }
  return groups.map((g, i) => ({ ...g, name: `Group ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}` }));
}

export function groupsToCsv(groups, src, standards) {
  const header = ['Group', 'Focus', 'Focus standard', 'Pool', 'Student ID', 'Student', 'Grade', `Latest (${src.unit})`, 'Benchmark', 'Status', 'Change since last cycle'];
  const rows = groups.flatMap((g) => g.members.map((m) => [
    g.name, g.focus, standardFor(g.focus, m.grade, standards)?.code ?? '', g.pool, m.studentId, m.name, m.grade, m.latest.score, m.latest.benchmark, m.status.label,
    m.move === 'up' ? `Up from ${m.tierBefore.label}` : m.move === 'down' ? `Down from ${m.tierBefore.label}` : m.move === 'new' ? 'New' : 'Same tier',
  ]));
  return [header, ...rows].map((r) => r.map((v) => (/[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',')).join('\n');
}
