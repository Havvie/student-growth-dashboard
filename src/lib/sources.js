// Assessment formats the dashboard understands.
// Each source knows how to recognize its CSV export, turn a row into a normalized
// record, and what "on grade level" means for that assessment at each data cycle.
//
// Column layouts are simplified approximations of common K-12 exports, built for
// made-up demo data. This project is not affiliated with IXL, Amira or Illuminate.

export const TOTAL_CYCLES = 4;

// Data cycle windows for a school year (month is 1-12). A date falls into the
// first window whose start it is on or after, counting from the start of the year.
export const CYCLE_WINDOWS = [
  { cycle: 1, label: 'Cycle 1 (Aug–Sep)', start: [8, 1] },
  { cycle: 2, label: 'Cycle 2 (Oct–Dec)', start: [10, 1] },
  { cycle: 3, label: 'Cycle 3 (Jan–Feb)', start: [12, 16] },
  { cycle: 4, label: 'Cycle 4 (Mar–May)', start: [3, 1] },
];

export function cycleFromDate(value) {
  if (!value) return null;
  const d = new Date(String(value).trim());
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  // Shift months so the school year starts in August: Aug=0 ... Jul=11.
  const pos = (mm, dd) => ((mm - 8 + 12) % 12) * 100 + dd;
  const p = pos(m, day);
  let found = null;
  for (const w of CYCLE_WINDOWS) if (p >= pos(...w.start)) found = w.cycle;
  return found;
}

const num = (v) => {
  if (v == null) return null;
  const s = String(v).trim().replace('%', '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const grade = (v) => {
  const s = String(v ?? '').trim().toUpperCase();
  if (s === 'K' || s === 'KG') return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const has = (headers, ...names) => names.every((n) => headers.includes(n.toLowerCase()));
const get = (row, name) => {
  const key = Object.keys(row).find((k) => k.trim().toLowerCase() === name.toLowerCase());
  return key == null ? undefined : row[key];
};

export const IXL_STRANDS = ['Number sense', 'Algebra and algebraic thinking', 'Fractions', 'Geometry', 'Data and measurement'];

export const SOURCES = {
  ixl: {
    id: 'ixl',
    label: 'IXL Diagnostic',
    subject: 'Math',
    unit: 'level',
    unitLong: 'diagnostic level',
    unitPlural: 'points',
    decimals: 0,
    expectedGrowth: 30, // points per cycle for a year of growth across 4 cycles (~90-100/yr)
    gapUnit: 30,
    // 300 = ready for the start of 3rd grade; +30 each cycle.
    benchmark: (g, c) => g * 100 + 30 * (c - 1),
    detect: (h) => has(h, 'overall level', 'diagnostic date'),
    toRecord: (row) => ({
      studentId: clean(get(row, 'Student ID')),
      name: clean(get(row, 'Student name')),
      grade: grade(get(row, 'Grade')),
      teacher: clean(get(row, 'Teacher')),
      date: clean(get(row, 'Diagnostic date')),
      score: num(get(row, 'Overall level')),
      strands: Object.fromEntries(
        IXL_STRANDS.map((s) => [s, num(get(row, s))]).filter(([, v]) => v != null),
      ),
    }),
  },
  amira: {
    id: 'amira',
    label: 'Amira ARM',
    subject: 'Reading',
    unit: 'GE',
    unitLong: 'grade-level equivalent',
    unitPlural: 'grade levels',
    decimals: 1,
    expectedGrowth: 0.3,
    gapUnit: 0.3,
    benchmark: (g, c) => g + 0.3 * (c - 1),
    detect: (h) => has(h, 'arm (grade level)'),
    toRecord: (row) => ({
      studentId: clean(get(row, 'Student ID')),
      name: clean(`${get(row, 'Student First Name') ?? ''} ${get(row, 'Student Last Name') ?? ''}`),
      grade: grade(get(row, 'Grade')),
      teacher: clean(get(row, 'Class')),
      date: clean(get(row, 'Assessment Date')),
      score: num(get(row, 'ARM (Grade Level)')),
      extra: { WCPM: num(get(row, 'WCPM')) },
    }),
  },
  illuminate: {
    id: 'illuminate',
    label: 'Illuminate Benchmark',
    subject: 'ELA',
    unit: '%',
    unitLong: 'percent correct',
    unitPlural: 'percentage points',
    decimals: 0,
    expectedGrowth: 0, // each benchmark covers new standards, so the goal is to hold at 70%+
    gapUnit: 8,
    benchmark: () => 70,
    detect: (h) => has(h, 'local student id', 'percent correct'),
    toRecord: (row) => {
      const title = clean(get(row, 'Test Title'));
      const m = title.match(/benchmark\s*(\d)/i);
      return {
        studentId: clean(get(row, 'Local Student ID')),
        name: clean(`${get(row, 'First Name') ?? ''} ${get(row, 'Last Name') ?? ''}`),
        grade: grade(get(row, 'Grade Level')),
        teacher: '',
        date: clean(get(row, 'Date Taken')),
        cycle: m ? Number(m[1]) : null,
        score: num(get(row, 'Percent Correct')),
        testTitle: title,
      };
    },
  },
  // Bring-your-own-data format. See public/sample-data/template.csv.
  generic: {
    id: 'generic',
    label: 'Custom CSV',
    subject: 'Custom',
    unit: 'pts',
    unitLong: 'points',
    unitPlural: 'points',
    decimals: 1,
    expectedGrowth: null, // read from the file
    gapUnit: null,
    benchmark: null,
    detect: (h) => has(h, 'student_id', 'assessment', 'cycle', 'score', 'benchmark'),
    toRecord: (row) => ({
      studentId: clean(get(row, 'student_id')),
      name: clean(get(row, 'student_name')),
      grade: grade(get(row, 'grade')),
      teacher: clean(get(row, 'teacher')),
      date: clean(get(row, 'date')),
      cycle: num(get(row, 'cycle')),
      score: num(get(row, 'score')),
      benchmark: num(get(row, 'benchmark')),
      expectedGrowth: num(get(row, 'expected_growth')),
      assessmentName: clean(get(row, 'assessment')),
    }),
  },
};

export function detectSource(headers) {
  const h = headers.map((x) => String(x).trim().toLowerCase());
  return Object.values(SOURCES).find((s) => s.detect(h)) ?? null;
}
