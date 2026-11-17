import { useEffect, useState } from 'react';
import { TOTAL_CYCLES } from '../lib/sources.js';
import { emptyState, exampleState, newStudent, gradesIn, problems, parsePasted, manualToCsv } from '../lib/manual.js';
import { downloadText } from '../lib/download.js';

export default function ManualEntry({ data, setData, onView, shownCount }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [skillText, setSkillText] = useState((data?.skills ?? []).join(', '));
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => { setSkillText((data?.skills ?? []).join(', ')); }, [data?.skills]);

  const set = (patch) => setData({ ...data, ...patch });
  const setStudent = (id, patch) => set({ students: data.students.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const commitSkills = () => {
    const skills = [...new Set(skillText.split(',').map((s) => s.trim()).filter(Boolean))];
    if (skills.join('|') === data.skills.join('|')) return;
    set({ skills, students: data.students.map((s) => ({ ...s, skills: Object.fromEntries(skills.map((k) => [k, s.skills?.[k] ?? ''])) })) });
  };

  if (!data) {
    return (
      <section className="card" id="my-data" aria-labelledby="my-data-title">
        <div className="card-head">
          <div>
            <h2 id="my-data-title">Enter your own data</h2>
            <p>No export? Type scores in or paste them from a spreadsheet: running records, a school-made benchmark, anything with a number per data cycle. Your entries get the same growth chart, flags and group suggestions, and they stay in this browser.</p>
          </div>
        </div>
        <div className="empty-start">
          <button className="btn primary" onClick={() => setData(exampleState())}>Start with an example</button>
          <button className="btn" onClick={() => setData({ ...emptyState(), students: [newStudent(), newStudent(), newStudent()] })}>Start blank</button>
        </div>
      </section>
    );
  }

  const grades = gradesIn(data);
  const todo = problems(data);
  const addPasted = () => {
    const rows = parsePasted(pasteText, data.skills);
    if (!rows.length) return;
    const keep = data.students.filter((s) => s.name.trim() || s.grade || s.scores.some(Boolean));
    set({ students: [...keep, ...rows] });
    setPasteText('');
    setPasteOpen(false);
  };

  return (
    <section className="card" id="my-data" aria-labelledby="my-data-title">
      <div className="card-head">
        <div>
          <h2 id="my-data-title">Enter your own data</h2>
          <p>Saved in this browser only. Changes show up on the dashboard as you type, under the <strong>My data</strong> tab.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onView} disabled={!shownCount}>View on dashboard</button>
          <button className="btn" onClick={() => downloadText(manualToCsv(data), `${(data.name || 'my-data').replace(/\W+/g, '-').toLowerCase()}.csv`)} disabled={!shownCount}>Download CSV</button>
          {confirmClear
            ? <><button className="btn danger" onClick={() => { setData(null); setConfirmClear(false); }}>Yes, delete my data</button><button className="btn ghost" onClick={() => setConfirmClear(false)}>Keep it</button></>
            : <button className="btn ghost" onClick={() => setConfirmClear(true)}>Clear</button>}
        </div>
      </div>

      <div className="entry-settings">
        <div className="field">
          <label htmlFor="me-name">Assessment name</label>
          <input id="me-name" className="text-in" value={data.name} onChange={(e) => set({ name: e.target.value })} placeholder="Running Record" />
        </div>
        <div className="field">
          <label htmlFor="me-unit">Unit</label>
          <input id="me-unit" className="text-in short" value={data.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="level" />
        </div>
        <div className="field">
          <label htmlFor="me-growth">Expected growth per cycle</label>
          <input id="me-growth" className="text-in short" inputMode="decimal" value={data.expectedGrowth} onChange={(e) => set({ expectedGrowth: e.target.value })} placeholder="2" />
        </div>
        <div className="field grow">
          <label htmlFor="me-skills">Skills (optional, comma separated)</label>
          <input id="me-skills" className="text-in" value={skillText} onChange={(e) => setSkillText(e.target.value)} onBlur={commitSkills}
            onKeyDown={(e) => e.key === 'Enter' && commitSkills()} placeholder="Phonics, Fluency, Comprehension" />
        </div>
      </div>

      {grades.length > 0 && (
        <div className="entry-bench">
          <span className="eyebrow">Cycle 1 benchmark by grade</span>
          <div className="bench-row">
            {grades.map((g) => (
              <label key={g} className="bench" htmlFor={`me-bench-${g}`}>
                Grade {g}
                <input id={`me-bench-${g}`} className="text-in tiny" inputMode="decimal" value={data.benchmarks[g] ?? ''}
                  onChange={(e) => set({ benchmarks: { ...data.benchmarks, [g]: e.target.value } })} />
              </label>
            ))}
          </div>
          <span className="muted small">Later cycles add the expected growth each time, so the end-of-year goal is the cycle 1 benchmark + {TOTAL_CYCLES - 1} × growth.</span>
        </div>
      )}

      {todo.length > 0 && <ul className="todo">{todo.map((t) => <li key={t}>{t}</li>)}</ul>}

      <div className="table-scroll">
        <table className="entry-table">
          <thead>
            <tr>
              <th>Student</th><th>Grade</th>
              {Array.from({ length: TOTAL_CYCLES }, (_, i) => <th key={i}>Cycle {i + 1}</th>)}
              {data.skills.map((k) => <th key={k} className="skill-col" title="Latest skill score">{k}</th>)}
              <th><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s, idx) => (
              <tr key={s.id}>
                <td><input className="text-in" aria-label={`Student ${idx + 1} name`} value={s.name} onChange={(e) => setStudent(s.id, { name: e.target.value })} placeholder="Name" /></td>
                <td><input className="text-in tiny" aria-label={`Student ${idx + 1} grade`} inputMode="numeric" value={s.grade} onChange={(e) => setStudent(s.id, { grade: e.target.value })} /></td>
                {s.scores.map((v, i) => (
                  <td key={i}><input className="text-in tiny" aria-label={`Student ${idx + 1} cycle ${i + 1} score`} inputMode="decimal" value={v}
                    onChange={(e) => setStudent(s.id, { scores: s.scores.map((x, j) => (j === i ? e.target.value : x)) })} /></td>
                ))}
                {data.skills.map((k) => (
                  <td key={k} className="skill-col"><input className="text-in tiny" aria-label={`Student ${idx + 1} ${k}`} inputMode="decimal" value={s.skills?.[k] ?? ''}
                    onChange={(e) => setStudent(s.id, { skills: { ...s.skills, [k]: e.target.value } })} /></td>
                ))}
                <td><button className="btn ghost icon" aria-label={`Remove ${s.name || `student ${idx + 1}`}`} onClick={() => set({ students: data.students.filter((x) => x.id !== s.id) })}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="entry-foot">
        <button className="btn" onClick={() => set({ students: [...data.students, newStudent(data.skills)] })}>+ Add student</button>
        <button className="btn" aria-expanded={pasteOpen} onClick={() => setPasteOpen(!pasteOpen)}>Paste from a spreadsheet</button>
        <span className="muted small">{shownCount} student{shownCount === 1 ? '' : 's'} on the dashboard</span>
      </div>

      {pasteOpen && (
        <div className="paste-box">
          <label htmlFor="me-paste" className="small">
            Copy rows from Google Sheets or Excel with columns in this order: <strong>Name, Grade, Cycle 1–{TOTAL_CYCLES}{data.skills.length ? `, ${data.skills.join(', ')}` : ''}</strong>. Leave a cell empty for a cycle that hasn't happened.
          </label>
          <textarea id="me-paste" rows={5} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={'Jordan Example\t3\t14\t16\t17'} />
          <div><button className="btn primary" onClick={addPasted} disabled={!pasteText.trim()}>Add rows</button></div>
        </div>
      )}
    </section>
  );
}
