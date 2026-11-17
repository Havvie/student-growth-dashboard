import Papa from 'papaparse';
import { SOURCES, detectSource, cycleFromDate } from './sources.js';

// Parse one CSV export into normalized records plus a data-quality report.
// A record is: { assessment, subject, studentId, name, grade, teacher, cycle, date, score, benchmark, strands? }
export function parseExport(text, fileName = 'file.csv') {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: 'greedy', transformHeader: (h) => h.trim() });
  const headers = parsed.meta.fields ?? [];
  const source = detectSource(headers);
  const report = {
    fileName, source: source?.label ?? null, rows: parsed.data.length, kept: 0,
    issues: [],
  };
  if (!source) {
    report.issues.push({ level: 'error', text: `Columns not recognized (${headers.slice(0, 4).join(', ')}…). Use a math diagnostic, reading screener or ELA benchmark export, or the custom template.` });
    return { records: [], report };
  }

  const records = [];
  const seen = new Set();
  let dupes = 0; let blanks = 0; let tidied = 0; let noCycle = 0; let noId = 0;
  for (const row of parsed.data) {
    const r = source.toRecord(row);
    if (!r.studentId) { noId++; continue; }
    const nameFields = Object.entries(row).filter(([k]) => /name/i.test(k)).map(([, v]) => String(v ?? ''));
    if (nameFields.some((v) => v !== v.replace(/\s+/g, ' ').trim())) tidied++;
    const cycle = r.cycle ?? cycleFromDate(r.date);
    if (cycle == null) { noCycle++; continue; }
    const assessment = source.id === 'generic' ? `custom:${r.assessmentName || 'Custom'}` : source.id;
    const key = `${assessment}|${r.studentId}|${cycle}`;
    if (seen.has(key)) { dupes++; continue; }
    seen.add(key);
    if (r.score == null) blanks++;
    const benchmark = source.benchmark && r.grade != null ? source.benchmark(r.grade, cycle) : r.benchmark ?? null;
    records.push({
      assessment,
      assessmentLabel: source.id === 'generic' ? r.assessmentName || 'Custom' : source.label,
      subject: source.id === 'generic' ? 'Custom' : source.subject,
      studentId: r.studentId,
      name: r.name || `Student ${r.studentId}`,
      grade: r.grade,
      teacher: r.teacher,
      cycle,
      date: r.date,
      score: r.score,
      benchmark,
      ...(r.strands && Object.keys(r.strands).length ? { strands: r.strands } : {}),
      ...(r.expectedGrowth != null ? { expectedGrowth: r.expectedGrowth } : {}),
      ...(r.unit ? { unit: r.unit } : {}),
    });
  }
  report.kept = records.length;
  if (dupes) report.issues.push({ level: 'warn', text: `Removed ${dupes} duplicate row${dupes > 1 ? 's' : ''} (same student, same cycle).` });
  if (blanks) report.issues.push({ level: 'warn', text: `${blanks} student${blanks > 1 ? 's have' : ' has'} a blank score (absent or not finished). Kept as missing, not zero.` });
  if (tidied) report.issues.push({ level: 'info', text: `Cleaned extra spaces in ${tidied} name${tidied > 1 ? 's' : ''}.` });
  if (noCycle) report.issues.push({ level: 'warn', text: `Skipped ${noCycle} row${noCycle > 1 ? 's' : ''} with a missing or unreadable date.` });
  if (noId) report.issues.push({ level: 'warn', text: `Skipped ${noId} row${noId > 1 ? 's' : ''} without a student ID.` });
  const cycles = [...new Set(records.map((r) => r.cycle))].sort();
  report.cycles = cycles;
  return { records, report };
}

// Merge records from many files. Later files win when the same student/cycle appears twice.
export function mergeRecords(lists) {
  const map = new Map();
  for (const list of lists) for (const r of list) map.set(`${r.assessment}|${r.studentId}|${r.cycle}`, r);
  return [...map.values()];
}

export function assessmentsIn(records) {
  const out = new Map();
  for (const r of records) {
    if (!out.has(r.assessment)) {
      const src = SOURCES[r.assessment] ?? SOURCES.generic;
      out.set(r.assessment, { id: r.assessment, label: r.assessmentLabel, subject: r.subject, source: src });
    }
  }
  const order = ['math', 'reading', 'ela'];
  return [...out.values()].sort((a, b) => {
    const ia = order.indexOf(a.id); const ib = order.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.label.localeCompare(b.label);
  });
}
