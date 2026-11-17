import { describe, it, expect } from 'vitest';
import { parseExport, mergeRecords } from './parsers.js';
import { cycleFromDate } from './sources.js';

const IXL = `Student name,Student ID,Grade,Teacher,Subject,Diagnostic date,Overall level,Number sense,Fractions
  Ana   Test ,1001,3,Room 1,Math,2025-08-27,250,240,190
Ben Test,1002,3,Room 1,Math,2025-08-27,,,
Ben Test,1002,3,Room 1,Math,2025-08-28,260,250,255`;

describe('parseExport', () => {
  it('detects an IXL-style export and normalizes rows', () => {
    const { records, report } = parseExport(IXL, 'ixl.csv');
    expect(report.source).toBe('IXL Diagnostic');
    expect(records[0]).toMatchObject({ assessment: 'ixl', name: 'Ana Test', grade: 3, cycle: 1, score: 250, benchmark: 300 });
    expect(records[0].strands).toEqual({ 'Number sense': 240, Fractions: 190 });
  });

  it('drops duplicates, keeps blank scores as missing, and reports name cleanup', () => {
    const { records, report } = parseExport(IXL, 'ixl.csv');
    expect(records).toHaveLength(2);
    expect(records[1].score).toBeNull();
    const text = report.issues.map((i) => i.text).join(' ');
    expect(text).toMatch(/1 duplicate row/);
    expect(text).toMatch(/blank score/);
    expect(text).toMatch(/extra spaces in 1 name/);
  });

  it('reads Illuminate grade levels with leading zeros and cycle from the test title', () => {
    const csv = `Local Student ID,Last Name,First Name,Grade Level,Test Title,Date Taken,Percent Correct
77,Lee,Kim,04,Gr 4 ELA Benchmark 2,2025-10-22,64`;
    const { records } = parseExport(csv, 'ill.csv');
    expect(records[0]).toMatchObject({ grade: 4, cycle: 2, score: 64, benchmark: 70, name: 'Kim Lee' });
  });

  it('rejects files it does not recognize', () => {
    const { records, report } = parseExport('a,b\n1,2', 'x.csv');
    expect(records).toHaveLength(0);
    expect(report.issues[0].level).toBe('error');
  });

  it('merges files with later files winning', () => {
    const a = [{ assessment: 'ixl', studentId: '1', cycle: 1, score: 1 }];
    const b = [{ assessment: 'ixl', studentId: '1', cycle: 1, score: 2 }];
    expect(mergeRecords([a, b])).toEqual(b);
  });
});

describe('skill columns', () => {
  it('reads reading and ELA skill scores so weakest-skill groups work for every subject', () => {
    const amira = `Student First Name,Student Last Name,Student ID,Grade,Class,Assessment Date,ARM (Grade Level),WCPM,Phonics (Grade Level),Fluency (Grade Level),Vocabulary (Grade Level),Comprehension (Grade Level)
Kim,Lee,5,3,Room 1,2025-10-22,2.6,80,2.9,2.8,2.7,1.9`;
    expect(parseExport(amira).records[0].strands).toEqual({ Phonics: 2.9, Fluency: 2.8, Vocabulary: 2.7, Comprehension: 1.9 });
    const ill = `Local Student ID,Last Name,First Name,Grade Level,Test Title,Date Taken,Percent Correct,Key ideas and details (% correct),Language conventions (% correct)
5,Lee,Kim,3,Gr 3 ELA Benchmark 1,2025-08-27,61,70,38`;
    expect(parseExport(ill).records[0].strands).toEqual({ 'Key ideas and details': 70, 'Language conventions': 38 });
  });

  it('reads skill_ columns from the custom template', () => {
    const csv = `student_id,student_name,grade,assessment,cycle,score,benchmark,expected_growth,unit,skill_Word_Study
1,Kim,3,Spelling,1,40,50,5,words,32`;
    const r = parseExport(csv).records[0];
    expect(r.strands).toEqual({ 'Word Study': 32 });
    expect(r.unit).toBe('words');
  });
});

describe('cycleFromDate', () => {
  it('maps school-year dates into data cycles', () => {
    expect(cycleFromDate('2025-08-27')).toBe(1);
    expect(cycleFromDate('2025-10-22')).toBe(2);
    expect(cycleFromDate('2026-01-14')).toBe(3);
    expect(cycleFromDate('2026-03-10')).toBe(4);
    expect(cycleFromDate('not a date')).toBeNull();
  });
});
