import { useState } from 'react';
import { STANDARD_SETS, CUSTOM, standardFor } from '../lib/standards.js';

// Pick which standards skills are tagged with. Custom codes cover any state.
export default function StandardsPicker({ standards, setStandards, skills, sampleGrade }) {
  const [open, setOpen] = useState(false);
  const isCustom = standards.set === CUSTOM;
  const ccss = { set: 'ccss' };
  return (
    <div className="field std-field">
      <label htmlFor="standards-set">Standards</label>
      <div className="std-row">
        <select id="standards-set" value={standards.set} onChange={(e) => {
          const set = e.target.value;
          // First switch to custom: start from the Common Core codes so there is less to type.
          const custom = Object.keys(standards.custom ?? {}).length ? standards.custom
            : Object.fromEntries(Object.entries(STANDARD_SETS.ccss.skills).map(([k, v]) => [k, v.code]));
          setStandards({ ...standards, set, custom });
          if (set === CUSTOM) setOpen(true);
        }}>
          {Object.values(STANDARD_SETS).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          <option value={CUSTOM}>My state's codes</option>
        </select>
        {isCustom && <button className="btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Done' : 'Edit codes'}</button>}
      </div>
      {isCustom && open && (
        <div className="std-editor">
          <p className="small muted">Type your state's code for each skill. Use <code>{'{g}'}</code> where the grade goes, for example <code>{'{g}.NR.4'}</code>. Saved in this browser.</p>
          {skills.length === 0 && <p className="small muted">This assessment has no skill scores yet.</p>}
          {skills.map((k) => (
            <label key={k} className="std-edit-row" htmlFor={`std-${k}`}>
              <span>{k}</span>
              <input id={`std-${k}`} className="text-in" value={standards.custom?.[k] ?? ''}
                placeholder={standardFor(k, '{g}', ccss)?.code ?? 'e.g. {g}.R.2'}
                onChange={(e) => setStandards({ ...standards, custom: { ...standards.custom, [k]: e.target.value } })} />
              <span className="muted small num">{standardFor(k, sampleGrade, standards)?.code ?? '–'}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
