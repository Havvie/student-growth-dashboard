import { describe, it, expect } from 'vitest';
import { exampleState, manualToRecords, parsePasted, problems, manualToCsv, emptyState, MANUAL_ID } from './manual.js';
import { parseExport } from './parsers.js';
import { studentSummaries } from './metrics.js';
import { suggestGroups } from './grouping.js';

describe('manual entry', () => {
  it('turns typed scores into records with per-grade benchmarks', () => {
    const recs = manualToRecords(exampleState());
    const a = recs.filter((r) => r.name === 'Example Student A');
    expect(a.map((r) => [r.cycle, r.score, r.benchmark])).toEqual([[1, 6, 10], [2, 7, 12], [3, 8, 14]]);
    expect(a[2].strands).toEqual({ Phonics: 6, Fluency: 8, Comprehension: 9 });
    expect(a[0].strands).toBeUndefined();
  });

  it('feeds the same growth and grouping logic as imports', () => {
    const recs = manualToRecords(exampleState());
    const sums = studentSummaries(recs, MANUAL_ID, 3);
    expect(sums).toHaveLength(5);
    const groups = suggestGroups(sums, { mode: 'skill', maxSize: 3 });
    expect(groups.length).toBeGreaterThan(0);
  });

  it('explains what is missing', () => {
    const st = emptyState();
    st.students = parsePasted('Kid One\t4\t20\t22');
    expect(problems(st)).toEqual([
      'Add the expected growth per cycle (use 0 if the goal is to hold steady).',
      'Add a cycle 1 benchmark for grade 4.',
    ]);
    expect(manualToRecords(st)).toEqual([]);
  });

  it('reads rows pasted from a spreadsheet and skips a header row', () => {
    const rows = parsePasted('Name\tGrade\tC1\nKid One\t3\t10\t12\t\t\t9\nKid Two, 3, 11', ['Phonics']);
    expect(rows.map((r) => [r.name, r.grade, r.scores, r.skills.Phonics])).toEqual([
      ['Kid One', '3', ['10', '12', '', ''], '9'],
      ['Kid Two', '3', ['11', '', '', ''], ''],
    ]);
  });

  it('exports a CSV the importer can read back', () => {
    const { records, report } = parseExport(manualToCsv(exampleState()), 'mine.csv');
    expect(report.source).toBe('Custom CSV');
    expect(records).toHaveLength(15);
    expect(records.find((r) => r.name === 'Example Student C' && r.cycle === 3).strands).toEqual({ Phonics: 11, Fluency: 10, Comprehension: 7 });
  });
});
