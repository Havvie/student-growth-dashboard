// Map each skill to a standard code. Codes are templates: {g} becomes the grade.
// Common Core is built in. Many states use it or an adapted version; for states with
// their own standards, users can type their codes in the app (saved in the browser),
// or a new set can be added to STANDARD_SETS below.

export const STANDARD_SETS = {
  ccss: {
    id: 'ccss',
    name: 'Common Core (CCSS)',
    skills: {
      // Math domains
      'Number sense': { code: '{g}.NBT', title: 'Number and Operations in Base Ten' },
      'Algebra and algebraic thinking': { code: '{g}.OA', title: 'Operations and Algebraic Thinking' },
      Fractions: { code: '{g}.NF', title: 'Number and Operations: Fractions', byGrade: { 2: { code: '2.G.A.3', title: 'Partition shapes into equal shares' } } },
      Geometry: { code: '{g}.G', title: 'Geometry' },
      'Data and measurement': { code: '{g}.MD', title: 'Measurement and Data' },
      // Reading foundations
      Phonics: { code: 'RF.{g}.3', title: 'Phonics and word recognition' },
      Fluency: { code: 'RF.{g}.4', title: 'Fluency' },
      Vocabulary: { code: 'L.{g}.4', title: 'Determine the meaning of unknown words' },
      Comprehension: { code: 'RL.{g}.1–3', title: 'Key ideas and details' },
      // ELA clusters
      'Key ideas and details': { code: 'RL.{g}.1–3', title: 'Key ideas and details' },
      'Craft and structure': { code: 'RL.{g}.4–6', title: 'Craft and structure' },
      'Vocabulary in context': { code: 'L.{g}.4–6', title: 'Vocabulary acquisition and use' },
      'Language conventions': { code: 'L.{g}.1–2', title: 'Conventions of standard English' },
    },
  },
};

export const CUSTOM = 'custom';
export const STANDARDS_KEY = 'cycle-check:standards:v1';

export const defaultStandards = () => ({ set: 'ccss', custom: {} });

// Resolve a skill to { code, title } for a grade, or null when nothing is mapped.
export function standardFor(skill, grade, settings = defaultStandards()) {
  if (!skill) return null;
  const fill = (code) => code.replaceAll('{g}', grade ?? '?');
  if (settings.set === CUSTOM) {
    const code = settings.custom?.[skill]?.trim();
    if (code) return { code: fill(code), title: '' };
  }
  const entry = STANDARD_SETS.ccss.skills[skill];
  if (!entry || settings.set === CUSTOM) return null;
  const pick = entry.byGrade?.[grade] ?? entry;
  return { code: fill(pick.code), title: pick.title };
}

export function loadStandards() {
  try {
    const raw = localStorage.getItem(STANDARDS_KEY);
    return raw ? { ...defaultStandards(), ...JSON.parse(raw) } : defaultStandards();
  } catch { return defaultStandards(); }
}

export function saveStandards(s) {
  try { localStorage.setItem(STANDARDS_KEY, JSON.stringify(s)); } catch { /* fine */ }
}
