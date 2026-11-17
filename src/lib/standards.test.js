import { describe, it, expect } from 'vitest';
import { standardFor, OWN } from './standards.js';
import { nextSteps } from './nextSteps.js';

describe('standardFor', () => {
  it('fills in the grade for Common Core codes', () => {
    expect(standardFor('Fractions', 4)).toEqual({ code: '4.NF', title: 'Number and Operations: Fractions' });
    expect(standardFor('Phonics', 3).code).toBe('RF.3.3');
    expect(standardFor('Fractions', 2).code).toBe('2.G.A.3');
  });

  it('fills in state codes automatically when a state is picked', () => {
    expect(standardFor('Fractions', 3, { set: 'ga', overrides: {} }).code).toBe('3.NR.4');
    expect(standardFor('Fractions', 5, { set: 'ga', overrides: {} }).code).toBe('5.NR.3');
    expect(standardFor('Fractions', 4, { set: 'tx', overrides: {} }).code).toBe('4.3');
    expect(standardFor('Phonics', 2, { set: 'tx', overrides: {} }).code).toBe('2.2(B)');
    expect(standardFor('Language conventions', 5, { set: 'va', overrides: {} }).code).toBe('5.LU.1–2');
  });

  it('leaves unconfirmed cells empty instead of guessing', () => {
    expect(standardFor('Phonics', 2, { set: 'ga', overrides: {} })).toBeNull();
    expect(standardFor('Fractions', 3, { set: 'va', overrides: {} })).toBeNull();
  });

  it('lets a teacher fill gaps or replace codes', () => {
    expect(standardFor('Fractions', 3, { set: 'va', overrides: { Fractions: '{g}.NS.3' } }).code).toBe('3.NS.3');
    expect(standardFor('Geometry', 3, { set: OWN, overrides: {} })).toBeNull();
  });
});

describe('nextSteps', () => {
  it('targets the weakest skill and matches the pace', () => {
    const student = { grade: 3, status: { id: 'offTrack' }, latest: { score: 250 }, strands: { Fractions: 190, Geometry: 260 } };
    const n = nextSteps(student, { groupName: 'Group C' });
    expect(n.skill).toBe('Fractions');
    expect(n.standard.code).toBe('3.NF');
    expect(n.pace).toMatch(/Increase intensity/);
    expect(n.group).toBe('Group C');
  });
});
