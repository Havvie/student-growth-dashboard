import { useState } from 'react';
import { STANDARD_SETS, OWN, standardFor } from '../lib/standards.js';

// Pick a state and its codes fill in automatically. "Adjust codes" covers gaps
// and local changes; those overrides use {g} for the grade.
export default function StandardsPicker({ standards, setStandards, skills, sampleGrade }) {
  const [open, setOpen] = useState(false);
  const set = STANDARD_SETS[standards.set];
  const missing = skills.filter((k) => !standardFor(k, sampleGrade, standards)).length;
  return (
    <div className="field std-field">
      <label htmlFor="standards-set">Standards</label>
      <div className="std-row">
        <select id="standards-set" value={standards.set} onChange={(e) => setStandards({ ...standards, set: e.target.value })}>
          {Object.values(STANDARD_SETS).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          <option value={OWN}>Other state (type my own)</option>
        </select>
        <button className="btn" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Done' : missing ? `Fill ${missing} missing` : 'Adjust codes'}
        </button>
      </div>
      {open && (
        <div className="std-editor">
          <p className="small muted">
            {set ? <>{set.note} Codes fill in for each grade automatically. Type in a box only to fill a gap or use a different code. </> : <>Type your state's code for each skill. </>}
            Use <code>{'{g}'}</code> where the grade goes, for example <code>{'{g}.NR.4'}</code>. Saved in this browser.
          </p>
          {skills.length === 0 && <p className="small muted">This assessment has no skill scores yet.</p>}
          {skills.length > 0 && (
            <div className="std-edit-row std-edit-head small muted"><span>Skill</span><span>Your code (optional)</span><span>Grade {sampleGrade}</span></div>
          )}
          {skills.map((k) => {
            const auto = standardFor(k, sampleGrade, { set: standards.set, overrides: {} });
            const now = standardFor(k, sampleGrade, standards);
            return (
              <label key={k} className="std-edit-row" htmlFor={`std-${k}`}>
                <span>{k}</span>
                <input id={`std-${k}`} className="text-in" value={standards.overrides?.[k] ?? ''}
                  placeholder={auto ? 'Auto' : 'Not built in'}
                  onChange={(e) => setStandards({ ...standards, overrides: { ...standards.overrides, [k]: e.target.value } })} />
                <span className={`num small ${now ? '' : 'muted'}`}>{now?.code ?? '–'}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
