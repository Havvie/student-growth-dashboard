import { describe, it, expect } from 'vitest';
import { slope, studentSummaries } from './metrics.js';

const rec = (id, grade, cycle, score) => ({ assessment: 'math', studentId: id, name: `S${id}`, grade, cycle, score, benchmark: grade * 100 + 30 * (cycle - 1) });

describe('slope', () => {
  it('is the least-squares growth per cycle', () => {
    expect(slope([{ cycle: 1, score: 100 }, { cycle: 2, score: 130 }, { cycle: 3, score: 160 }])).toBe(30);
    expect(slope([{ cycle: 1, score: 100 }])).toBeNull();
  });
});

describe('studentSummaries', () => {
  const records = [
    // catching up fast: on track
    rec('a', 3, 1, 260), rec('a', 3, 2, 310), rec('a', 3, 3, 360),
    // behind, growing at the normal pace: watch
    rec('b', 3, 1, 250), rec('b', 3, 2, 280), rec('b', 3, 3, 310),
    // behind and growing slowly: off track
    rec('c', 3, 1, 250), rec('c', 3, 2, 255), rec('c', 3, 3, 262),
    // one score so far, below benchmark
    rec('d', 3, 3, 300),
  ];
  const byId = Object.fromEntries(studentSummaries(records, 'math', 3).map((s) => [s.studentId, s]));

  it('labels each student', () => {
    expect(byId.a.status.id).toBe('onTrack');
    expect(byId.b.status.id).toBe('watch');
    expect(byId.c.status.id).toBe('offTrack');
    expect(byId.d.status.id).toBe('baseline');
  });

  it('projects to the end of the year and explains the flag', () => {
    expect(byId.c.projected).toBeCloseTo(262 + 6 * 1, 5);
    expect(byId.c.target).toBe(390);
    expect(byId.c.flags.join(' ')).toMatch(/20% of the expected pace/);
  });

  it('ignores cycles after the as-of cycle', () => {
    const asOf2 = studentSummaries(records, 'math', 2).find((s) => s.studentId === 'a');
    expect(asOf2.latest.cycle).toBe(2);
  });
});
