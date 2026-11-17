// "Enter your own data": a small gradebook kept in the browser.
// It turns into the same normalized records as an imported CSV, so every chart,
// flag and grouping works on it without special cases.
import { TOTAL_CYCLES } from './sources.js';

export const MANUAL_ID = 'custom:manual';
export const STORAGE_KEY = 'cycle-check:my-data:v1';

let counter = 0;
export const newStudent = (skills = []) => ({
  id: `m${Date.now().toString(36)}${(counter++).toString(36)}`,
  name: '',
  grade: '',
  scores: Array(TOTAL_CYCLES).fill(''),
  skills: Object.fromEntries(skills.map((k) => [k, ''])),
});

export const emptyState = () => ({
  name: 'My assessment',
  unit: 'pts',
  expectedGrowth: '',
  benchmarks: {},
  skills: [],
  students: [],
});

// A filled-in starting point so the form shows how it works. Fake names.
export function exampleState() {
  const skills = ['Phonics', 'Fluency', 'Comprehension'];
  const row = (name, grade, scores, sk) => ({ ...newStudent(skills), name, grade: String(grade), scores: [...scores.map(String), ''], skills: Object.fromEntries(skills.map((k, i) => [k, String(sk[i])])) });
  return {
    name: 'Running Record',
    unit: 'level',
    expectedGrowth: '2',
    benchmarks: { 2: '10', 3: '16' },
    skills,
    students: [
      row('Example Student A', 2, [6, 7, 8], [6, 8, 9]),
      row('Example Student B', 2, [8, 11, 14], [13, 12, 14]),
      row('Example Student C', 2, [9, 10, 10], [11, 10, 7]),
      row('Example Student D', 3, [14, 17, 20], [20, 19, 21]),
      row('Example Student E', 3, [13, 14, 15], [16, 12, 15]),
    ],
  };
}

const num = (v) => {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export function gradesIn(state) {
  return [...new Set(state.students.map((s) => parseInt(s.grade, 10)).filter(Number.isFinite))].sort((a, b) => a - b);
}

// What is missing before the data can be charted, in plain words.
export function problems(state) {
  const out = [];
  if (num(state.expectedGrowth) == null) out.push('Add the expected growth per cycle (use 0 if the goal is to hold steady).');
  for (const g of gradesIn(state)) {
    if (num(state.benchmarks[g]) == null) out.push(`Add a cycle 1 benchmark for grade ${g}.`);
  }
  const unnamed = state.students.filter((s) => !s.name.trim() || !Number.isFinite(parseInt(s.grade, 10))).length;
  if (unnamed) out.push(`${unnamed} row${unnamed > 1 ? 's need' : ' needs'} a name and grade before it shows up.`);
  return out;
}

export function manualToRecords(state) {
  const growth = num(state.expectedGrowth);
  if (growth == null) return [];
  const label = state.name.trim() || 'My assessment';
  const records = [];
  for (const st of state.students) {
    const grade = parseInt(st.grade, 10);
    const bench1 = num(state.benchmarks[grade]);
    if (!st.name.trim() || !Number.isFinite(grade) || bench1 == null) continue;
    const scored = st.scores.map((v, i) => ({ cycle: i + 1, score: num(v) })).filter((x) => x.score != null);
    const lastCycle = scored.length ? scored[scored.length - 1].cycle : null;
    const strands = Object.fromEntries(state.skills.map((k) => [k, num(st.skills?.[k])]).filter(([, v]) => v != null));
    for (const { cycle, score } of scored) {
      records.push({
        assessment: MANUAL_ID,
        assessmentLabel: label,
        subject: 'My data',
        studentId: st.id,
        name: st.name.trim(),
        grade,
        teacher: '',
        cycle,
        date: '',
        score,
        benchmark: bench1 + growth * (cycle - 1),
        expectedGrowth: growth,
        unit: state.unit.trim() || 'pts',
        // Skill scores describe the student's most recent cycle.
        ...(cycle === lastCycle && Object.keys(strands).length ? { strands } : {}),
      });
    }
  }
  return records;
}

// Rows copied from a spreadsheet: name, grade, cycle 1..4, then one column per skill.
// Tabs or commas both work. A header row is skipped if its grade cell is not a number.
export function parsePasted(text, skills = []) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const cells = (line.includes('\t') ? line.split('\t') : line.split(',')).map((c) => c.trim());
    if (cells.length < 2 || !Number.isFinite(parseInt(cells[1], 10))) continue;
    const st = newStudent(skills);
    st.name = cells[0];
    st.grade = String(parseInt(cells[1], 10));
    st.scores = Array.from({ length: TOTAL_CYCLES }, (_, i) => cells[2 + i] ?? '');
    skills.forEach((k, i) => { st.skills[k] = cells[2 + TOTAL_CYCLES + i] ?? ''; });
    rows.push(st);
  }
  return rows;
}

// Export in the custom template format, so the file can be imported again later.
export function manualToCsv(state) {
  const skillCols = state.skills.map((k) => `skill_${k.replace(/\s+/g, '_')}`);
  const header = ['student_id', 'student_name', 'grade', 'teacher', 'assessment', 'cycle', 'date', 'score', 'benchmark', 'expected_growth', 'unit', ...skillCols];
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
  const rows = manualToRecords(state).map((r) => [
    r.studentId, r.name, r.grade, '', r.assessmentLabel, r.cycle, '', r.score, r.benchmark, r.expectedGrowth, r.unit,
    ...state.skills.map((k) => r.strands?.[k] ?? ''),
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(',')).join('\n') + '\n';
}

export function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : null;
  } catch { return null; }
}

export function save(state) {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage blocked: data just won't survive a reload */ }
}
