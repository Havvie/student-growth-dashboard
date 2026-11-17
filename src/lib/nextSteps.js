// "Next best options" for a student: what to target and how, based on their
// weakest skill and how fast they are growing. Moves are short, classroom-ready ideas.
import { weakestStrand } from './grouping.js';
import { standardFor } from './standards.js';

const MOVES = {
  'Number sense': ['Build and break apart numbers with base-ten blocks or place-value charts.', 'Daily number talks: add and subtract mentally by place value.'],
  'Algebra and algebraic thinking': ['Model word problems with bar diagrams before solving.', 'Practice fact families and finding the unknown number.'],
  Fractions: ['Compare unit fractions with fraction strips.', 'Place fractions on a number line, starting with halves and fourths.'],
  Geometry: ['Sort shapes by attributes and explain the rule.', 'Partition shapes into equal parts and name the parts.'],
  'Data and measurement': ['Measure real objects and record results in a line plot.', 'Read and solve problems from bar and picture graphs.'],
  Phonics: ['Explicit decoding practice with the target pattern, then decodable text.', 'Word building or sorts with letter tiles (5 minutes a day).'],
  Fluency: ['Repeated reading of a short passage with a timed goal.', 'Echo and choral reading to model phrasing and expression.'],
  Vocabulary: ['Pre-teach 3–5 key words with student-friendly definitions.', 'Use context clues and word parts (prefixes, suffixes) to figure out new words.'],
  Comprehension: ['Stop-and-jot: retell who, what and why after each section.', 'Ask and answer questions using evidence from the text.'],
  'Key ideas and details': ['Find the main idea and two supporting details with a graphic organizer.', 'Summarize a short text in one or two sentences.'],
  'Craft and structure': ["Discuss the author's word choice and why it matters.", 'Compare points of view between characters or texts.'],
  'Vocabulary in context': ['Model using context clues to figure out unknown words.', 'Keep a word wall of new words with student-made examples.'],
  'Language conventions': ['Five-minute daily edits of a sentence with grammar or punctuation errors.', 'Mini-lessons on one convention, then apply it in writing.'],
};

const PACE = {
  offTrack: 'Increase intensity: more minutes or a smaller group, and check progress every 2 weeks.',
  watch: 'Growing at a typical pace but still behind: keep the group and add targeted practice.',
  onTrack: 'On pace for the goal: keep going and add on-level or enrichment work.',
  baseline: 'Only one score so far: recheck after the next data cycle.',
};

export function nextSteps(student, { standards, groupName } = {}) {
  const weak = weakestStrand(student);
  const skill = weak?.name ?? null;
  const std = skill ? standardFor(skill, student.grade, standards) : null;
  const moves = (skill && MOVES[skill]) || (skill
    ? [`Reteach ${skill.toLowerCase()} in a small group with a quick check at the end.`, `Give targeted practice on ${skill.toLowerCase()} 3 times a week.`]
    : ['Add skill scores to see a specific focus. Until then, reteach the lowest-scoring standards from the last assessment.']);
  return {
    skill,
    standard: std,
    moves,
    pace: PACE[student.status.id],
    group: groupName ?? null,
  };
}
