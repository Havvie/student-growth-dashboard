// Generates FAKE student assessment exports for the demo.
// Every name, ID, teacher and score here is invented. No real student data is used.
// Run: npm run sample-data   (seeded, so the output is the same every time)

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'public', 'sample-data');
mkdirSync(OUT, { recursive: true });

// Small seeded PRNG (mulberry32) so the sample files are reproducible.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20250825);
const between = (a, b) => a + (b - a) * rand();
const noise = (size) => (rand() + rand() + rand() - 1.5) * size;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const FIRST = ['Amari', 'Bella', 'Carlos', 'Dami', 'Elena', 'Femi', 'Gia', 'Hassan', 'Imani', 'Jonah', 'Kiara', 'Leo',
  'Maya', 'Nico', 'Olu', 'Priya', 'Quinn', 'Rosa', 'Sami', 'Tariq', 'Uma', 'Vince', 'Willa', 'Xavi', 'Yara', 'Zion'];
const LAST = ['Abara', 'Brightwater', 'Castellan', 'Dunmore', 'Eskew', 'Farrow', 'Galloway', 'Hollis', 'Ingram', 'Juarez',
  'Kettering', 'Lindqvist', 'Marlowe', 'Nakashima', 'Okonkwo', 'Pembrook', 'Quill', 'Ravenel', 'Stroud', 'Thibodeaux',
  'Underhill', 'Vance', 'Whitlock', 'Yarbrough'];
const TEACHERS = { 2: 'Ms. Fairbanks', 3: 'Mr. Delacroix', 4: 'Mrs. Ambrose', 5: 'Ms. Kincaid' };

// 2025-26 school year: 4 data cycles, the first 3 have happened.
const CYCLES = [
  { n: 1, date: '2025-08-27' },
  { n: 2, date: '2025-10-22' },
  { n: 3, date: '2026-01-14' },
];

const STRANDS = ['Number sense', 'Algebra and algebraic thinking', 'Fractions', 'Geometry', 'Data and measurement'];

const students = [];
let id = 410201;
const lastNames = [...LAST];
for (const grade of [2, 3, 4, 5]) {
  for (let i = 0; i < 6; i++) {
    const first = FIRST[students.length];
    const last = lastNames.splice(Math.floor(rand() * lastNames.length), 1)[0];
    const base = between(-1.0, 0.1); // years behind/ahead of grade level at the start of the year
    students.push({
      id: String(id++), first, last, grade, teacher: TEACHERS[grade],
      math: { offset: base + noise(0.25), pace: between(0.35, 1.9) },
      read: { offset: base + noise(0.25), pace: between(0.35, 1.9) },
      weakStrand: pick(STRANDS),
      strandShift: Object.fromEntries(STRANDS.map((s) => [s, noise(18)])),
    });
  }
}
// One student enrolls after cycle 1 (shows up in cycle 2+ only).
students[students.length - 1].enrolledCycle = 2;

const csv = (rows) => rows.map((r) => r.map((v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(',')).join('\n') + '\n';

const present = (s, c) => !s.enrolledCycle || c.n >= s.enrolledCycle;

// ---------- IXL-style diagnostic export (math) ----------
for (const c of CYCLES) {
  const rows = [['Student name', 'Student ID', 'Grade', 'Teacher', 'Subject', 'Diagnostic date', 'Overall level', ...STRANDS]];
  for (const s of students.filter((s) => present(s, c))) {
    const overall = Math.round(s.grade * 100 + s.math.offset * 100 + 30 * s.math.pace * (c.n - 1) + noise(14));
    const strands = STRANDS.map((st) =>
      Math.round(overall + s.strandShift[st] + (st === s.weakStrand ? -between(45, 75) : 12)));
    // Data quirk: one export has extra spaces in a name.
    const name = c.n === 1 && s.id === '410204' ? `  ${s.first}   ${s.last} ` : `${s.first} ${s.last}`;
    rows.push([name, s.id, s.grade, s.teacher, 'Math', c.date, overall, ...strands]);
  }
  writeFileSync(join(OUT, `ixl-diagnostic-math_cycle${c.n}.csv`), csv(rows));
}

// Reading and ELA skill profiles use their own seeded stream, so adding them
// did not change any of the overall scores above.
const skillRand = rng(1117);
const skillNoise = (size) => (skillRand() + skillRand() + skillRand() - 1.5) * size;
const READING_SKILLS = ['Phonics', 'Fluency', 'Vocabulary', 'Comprehension'];
const ELA_SKILLS = ['Key ideas and details', 'Craft and structure', 'Vocabulary in context', 'Language conventions'];
for (const s of students) {
  s.weakReading = READING_SKILLS[Math.floor(skillRand() * READING_SKILLS.length)];
  s.weakEla = ELA_SKILLS[Math.floor(skillRand() * ELA_SKILLS.length)];
}

// ---------- Amira-style reading export ----------
for (const c of CYCLES) {
  const rows = [['Student First Name', 'Student Last Name', 'Student ID', 'Grade', 'Class', 'Assessment Date', 'ARM (Grade Level)', 'WCPM', ...READING_SKILLS.map((k) => `${k} (Grade Level)`)]];
  for (const s of students.filter((s) => present(s, c))) {
    let arm = s.grade + s.read.offset + 0.3 * s.read.pace * (c.n - 1) + noise(0.14);
    arm = Math.max(0.1, Math.round(arm * 10) / 10);
    const wcpm = Math.round(Math.max(12, 18 + arm * 32 + noise(10)));
    // Data quirk: one student was absent for cycle 3 (blank score).
    const absent = c.n === 3 && s.id === '410210';
    const skills = READING_SKILLS.map((k) => {
      const v = arm + skillNoise(0.25) + (k === s.weakReading ? -(0.5 + skillRand() * 0.5) : 0.15);
      return absent ? '' : Math.max(0.1, v).toFixed(1);
    });
    rows.push([s.first, s.last, s.id, s.grade, s.teacher, c.date, absent ? '' : arm.toFixed(1), absent ? '' : wcpm, ...skills]);
  }
  writeFileSync(join(OUT, `amira-reading_cycle${c.n}.csv`), csv(rows));
}

// ---------- Illuminate-style benchmark export (ELA) ----------
for (const c of CYCLES) {
  const rows = [['Local Student ID', 'Last Name', 'First Name', 'Grade Level', 'Test Title', 'Date Taken', 'Percent Correct', 'Performance Band', ...ELA_SKILLS.map((k) => `${k} (% correct)`)]];
  for (const s of students.filter((s) => present(s, c))) {
    let pct = 70 + s.read.offset * 22 + 5 * (s.read.pace - 0.8) * (c.n - 1) + noise(7);
    pct = Math.round(Math.min(98, Math.max(12, pct)));
    const band = pct >= 80 ? 'Exceeds' : pct >= 70 ? 'Meets' : pct >= 55 ? 'Approaching' : 'Beginning';
    // Data quirk: grade written with a leading zero.
    const skills = ELA_SKILLS.map((k) => {
      const v = pct + skillNoise(8) + (k === s.weakEla ? -(14 + skillRand() * 14) : 5);
      return Math.round(Math.min(100, Math.max(0, v)));
    });
    rows.push([s.id, s.last, s.first, `0${s.grade}`, `Gr ${s.grade} ELA Benchmark ${c.n}`, c.date, pct, band, ...skills]);
  }
  // Data quirk: a duplicated row in the cycle 2 export.
  if (c.n === 2) rows.push(rows[3]);
  writeFileSync(join(OUT, `illuminate-ela-benchmark_cycle${c.n}.csv`), csv(rows));
}

console.log(`Wrote ${CYCLES.length * 3} files for ${students.length} made-up students to ${OUT}`);
