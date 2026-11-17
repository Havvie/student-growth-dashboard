import { describe, it, expect } from 'vitest';
import { standardFor, CUSTOM } from './standards.js';
import { nextSteps } from './nextSteps.js';

describe('standardFor', () => {
  it('fills in the grade for Common Core codes', () => {
    expect(standardFor('Fractions', 4)).toEqual({ code: '4.NF', title: 'Number and Operations: Fractions' });
    expect(standardFor('Phonics', 3).code).toBe('RF.3.3');
  });
  it('uses grade-specific codes where Common Core differs', () => {
    expect(standardFor('Fractions', 2).code).toBe('2.G.A.3');
  });
  it('uses custom codes when chosen', () => {
    const s = { set: CUSTOM, custom: { Fractions: '{g}.NR.4' } };
    expect(standardFor('Fractions', 3, s).code).toBe('3.NR.4');
    expect(standardFor('Geometry', 3, s)).toBeNull();
  });
});

describe('nextSteps', () => {
  it('targets the weakest skill and matches the pace', () => {
    const student = { grade: 3, status: { id: 'offTrack' }, latest: { score: 250 }, strands: { Fractions: 190, Geometry: 260 } };
    const n = nextSteps(student, { groupName: 'Group C' });
    expect(n.skill).toBe('Fractions');
    expect(n.standard.code).toBe('3.NF');
    expect(n.moves.length).toBeGreaterThan(0);
    expect(n.pace).toMatch(/Increase intensity/);
    expect(n.group).toBe('Group C');
  });
});
