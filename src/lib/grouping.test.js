import { describe, it, expect } from 'vitest';
import { chunkEvenly, suggestGroups, tierFor } from './grouping.js';

const s = (id, grade, gapCycles, strands) => ({
  studentId: id, name: id, grade, gapCycles, latest: { score: 300 + gapCycles * 30, benchmark: 300, cycle: 3 }, strands, status: { label: 'x' },
});

describe('chunkEvenly', () => {
  it('makes groups whose sizes differ by at most one', () => {
    expect(chunkEvenly([1, 2, 3, 4, 5, 6, 7], 5).map((g) => g.length)).toEqual([4, 3]);
    expect(chunkEvenly([], 5)).toEqual([]);
  });
});

describe('suggestGroups', () => {
  const students = [s('a', 3, -4), s('b', 3, -3.5), s('c', 3, -2), s('d', 3, 0), s('e', 4, -1.5)];

  it('keeps grades separate and respects the max size', () => {
    const groups = suggestGroups(students, { maxSize: 2, sameGrade: true });
    expect(groups.every((g) => g.members.length <= 2)).toBe(true);
    expect(groups.find((g) => g.members.some((m) => m.studentId === 'e')).members).toHaveLength(1);
    expect(groups[0].members.map((m) => m.studentId)).toEqual(['a', 'b']);
    expect(groups[0].tier.id).toBe('intensive');
  });

  it('marks tier moves against the previous cycle', () => {
    const previous = [s('c', 3, -3.5)];
    const groups = suggestGroups(students, { maxSize: 5, previous });
    const c = groups.flatMap((g) => g.members).find((m) => m.studentId === 'c');
    expect(c.move).toBe('up');
    expect(tierFor(-3.5).id).toBe('intensive');
  });

  it('pools by weakest strand in skill mode', () => {
    const withStrands = [
      s('a', 3, -2, { Fractions: 200, Geometry: 260 }),
      s('b', 3, -2, { Fractions: 210, Geometry: 255 }),
      s('c', 3, -2, { Fractions: 270, Geometry: 220 }),
      s('d', 3, -2, { Fractions: 265, Geometry: 215 }),
    ];
    const groups = suggestGroups(withStrands, { mode: 'skill' });
    expect(groups.map((g) => g.focus).sort()).toEqual(['Fractions', 'Geometry']);
  });
});
