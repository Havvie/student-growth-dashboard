// Map each skill to a standard code for a grade.
//
// Built-in sets: Common Core (default) plus states that wrote their own standards.
// State codes were read from the official standards text (or a school district's
// copy of it); see "Standards sources" in the README. A cell is left out when it
// could not be confirmed, rather than guessed. Teachers can fill any gap, or
// replace any code, in the app: those overrides use {g} for the grade.

const G = [2, 3, 4, 5];
// Same pattern every grade: grades('RF.{g}.3') -> { 2: 'RF.2.3', 3: 'RF.3.3', ... }
const grades = (template, except = {}) =>
  Object.fromEntries(G.map((g) => [g, except[g] !== undefined ? except[g] : template.replaceAll('{g}', g)]).filter(([, v]) => v));

export const STANDARD_SETS = {
  ccss: {
    id: 'ccss',
    name: 'Common Core (CCSS)',
    note: 'Used or adapted by most states.',
    template: true,
    skills: {
      'Number sense': { code: '{g}.NBT', title: 'Number and Operations in Base Ten' },
      'Algebra and algebraic thinking': { code: '{g}.OA', title: 'Operations and Algebraic Thinking' },
      Fractions: { code: '{g}.NF', title: 'Number and Operations: Fractions', byGrade: { 2: { code: '2.G.A.3', title: 'Partition shapes into equal shares' } } },
      Geometry: { code: '{g}.G', title: 'Geometry' },
      'Data and measurement': { code: '{g}.MD', title: 'Measurement and Data' },
      Phonics: { code: 'RF.{g}.3', title: 'Phonics and word recognition' },
      Fluency: { code: 'RF.{g}.4', title: 'Fluency' },
      Vocabulary: { code: 'L.{g}.4', title: 'Determine the meaning of unknown words' },
      Comprehension: { code: 'RL.{g}.1–3', title: 'Key ideas and details' },
      'Key ideas and details': { code: 'RL.{g}.1–3', title: 'Key ideas and details' },
      'Craft and structure': { code: 'RL.{g}.4–6', title: 'Craft and structure' },
      'Vocabulary in context': { code: 'L.{g}.4–6', title: 'Vocabulary acquisition and use' },
      'Language conventions': { code: 'L.{g}.1–2', title: 'Conventions of standard English' },
    },
  },
  ga: {
    id: 'ga',
    name: 'Georgia',
    note: "Georgia's K-12 Mathematics Standards and K-12 ELA Standards (2023). Grade 2 ELA not built in yet.",
    skills: {
      'Number sense': { title: 'Numerical Reasoning: place value', codes: grades('{g}.NR.1') },
      'Algebra and algebraic thinking': { title: 'Patterning & Algebraic Reasoning', codes: { 2: '2.PAR.4', 3: '3.PAR.2–3', 4: '4.PAR.3', 5: '5.PAR.6' } },
      Fractions: { title: 'Numerical Reasoning: fractions', codes: { 2: '2.GSR.7.3', 3: '3.NR.4', 4: '4.NR.4', 5: '5.NR.3' } },
      Geometry: { title: 'Geometric & Spatial Reasoning', codes: { 2: '2.GSR.7', 3: '3.GSR.6', 4: '4.GSR.7–8', 5: '5.GSR.8' } },
      'Data and measurement': { title: 'Measurement & Data Reasoning', codes: { 2: '2.MDR.5–6', 3: '3.MDR.5', 4: '4.MDR.6', 5: '5.MDR.7' } },
      Phonics: { title: 'Decoding & encoding with phonics', codes: grades('{g}.F.P.4', { 2: null }) },
      Fluency: { title: 'Oral & silent reading fluency', codes: grades('{g}.F.F.1', { 2: null }) },
      Vocabulary: { title: 'General, academic & specialized vocabulary', codes: grades('{g}.L.V.1', { 2: null }) },
      Comprehension: { title: 'Texts: literary elements', codes: grades('{g}.T.T.1', { 2: null }) },
      'Key ideas and details': { title: 'Texts: literary elements', codes: grades('{g}.T.T.1', { 2: null }) },
      'Craft and structure': { title: 'Texts: craft', codes: grades('{g}.T.SS.2', { 2: null }) },
      'Vocabulary in context': { title: 'Vocabulary: meaning & purpose', codes: grades('{g}.L.V.3', { 2: null }) },
      'Language conventions': { title: 'Grammar, usage & mechanics', codes: grades('{g}.L.GC.1', { 2: null }) },
    },
  },
  tx: {
    id: 'tx',
    name: 'Texas (TEKS)',
    note: 'Mathematics TEKS (19 TAC §111.4–111.7) and ELAR TEKS (19 TAC §110.4–110.7).',
    skills: {
      'Number sense': { title: 'Number and operations: place value', codes: grades('{g}.2') },
      'Algebra and algebraic thinking': { title: 'Algebraic reasoning', codes: { 2: '2.7', 3: '3.5', 4: '4.5', 5: '5.4' } },
      Fractions: { title: 'Number and operations: fractions', codes: grades('{g}.3') },
      Geometry: { title: 'Geometry', codes: { 2: '2.8', 3: '3.6', 4: '4.6–4.7', 5: '5.5' } },
      'Data and measurement': { title: 'Measurement and data analysis', codes: { 2: '2.9–2.10', 3: '3.7–3.8', 4: '4.8–4.9', 5: '5.7, 5.9' } },
      Phonics: { title: 'Beginning reading: decoding', codes: grades('{g}.2(A)', { 2: '2.2(B)' }) },
      Fluency: { title: 'Fluency', codes: grades('{g}.4') },
      Vocabulary: { title: 'Vocabulary', codes: grades('{g}.3') },
      Comprehension: { title: 'Comprehension skills', codes: grades('{g}.6') },
      'Key ideas and details': { title: 'Comprehension skills', codes: grades('{g}.6') },
      'Craft and structure': { title: "Author's purpose and craft", codes: grades('{g}.10') },
      'Vocabulary in context': { title: 'Vocabulary', codes: grades('{g}.3') },
      'Language conventions': { title: 'Composition: conventions', codes: grades('{g}.11(D)') },
    },
  },
  va: {
    id: 'va',
    name: 'Virginia (SOL)',
    note: '2024 English Standards of Learning. Math SOL codes not built in yet.',
    skills: {
      Phonics: { title: 'Phonics and word analysis', codes: grades('{g}.FFR.3') },
      Fluency: { title: 'Developing skilled readers: fluency', codes: grades('{g}.DSR (A)') },
      Vocabulary: { title: 'Vocabulary development and word analysis', codes: grades('{g}.RV.1') },
      Comprehension: { title: 'Key ideas and plot details', codes: grades('{g}.RL.1') },
      'Key ideas and details': { title: 'Key ideas and plot details', codes: grades('{g}.RL.1') },
      'Craft and structure': { title: 'Craft and style', codes: grades('{g}.RL.2', { 2: '2.RI.2' }) },
      'Vocabulary in context': { title: 'Vocabulary development and word analysis', codes: grades('{g}.RV.1') },
      'Language conventions': { title: 'Language usage: grammar and mechanics', codes: grades('{g}.LU.1–2') },
    },
  },
};

export const OWN = 'own'; // no built-in set: only the teacher's own codes
export const STANDARDS_KEY = 'cycle-check:standards:v2';

export const defaultStandards = () => ({ set: 'ccss', overrides: {} });

function builtIn(setId, skill, grade) {
  const set = STANDARD_SETS[setId];
  const entry = set?.skills[skill];
  if (!entry) return null;
  if (set.template) {
    const pick = entry.byGrade?.[grade] ?? entry;
    return { code: pick.code.replaceAll('{g}', grade ?? '?'), title: pick.title };
  }
  const code = entry.codes?.[grade];
  return code ? { code, title: entry.title } : null;
}

// Resolve a skill to { code, title, own } for a grade, or null when nothing is mapped.
export function standardFor(skill, grade, settings = defaultStandards()) {
  if (!skill) return null;
  const own = settings.overrides?.[skill]?.trim();
  if (own) return { code: own.replaceAll('{g}', grade ?? '?'), title: '', own: true };
  return settings.set === OWN ? null : builtIn(settings.set, skill, grade);
}

export function loadStandards() {
  try {
    const raw = localStorage.getItem(STANDARDS_KEY);
    if (raw) return { ...defaultStandards(), ...JSON.parse(raw) };
  } catch { /* fall through */ }
  return defaultStandards();
}

export function saveStandards(s) {
  try { localStorage.setItem(STANDARDS_KEY, JSON.stringify(s)); } catch { /* fine */ }
}
