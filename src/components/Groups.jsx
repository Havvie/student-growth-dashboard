import { formatScore } from '../lib/metrics.js';
import { groupsToCsv } from '../lib/grouping.js';
import { downloadText } from '../lib/download.js';

const MOVE_TEXT = { up: (m) => `↑ from ${m.tierBefore.label}`, down: (m) => `↓ from ${m.tierBefore.label}`, new: () => 'new', same: () => '' };

export default function Groups({ groups, opts, setOpts, src, canSkill, asOfCycle, onOpen }) {
  const moved = groups.flatMap((g) => g.members).filter((m) => m.move === 'up' || m.move === 'down');
  return (
    <section className="card" aria-labelledby="groups-title">
      <div className="card-head">
        <div>
          <h2 id="groups-title">Suggested small groups</h2>
          <p>
            Built from cycle {asOfCycle} results. Students are sorted by distance from benchmark and cut into even groups
            {opts.mode === 'skill' ? ', after pooling by their weakest strand' : ''}. Arrows show tier changes since cycle {asOfCycle - 1}.
          </p>
        </div>
        <button className="btn" onClick={() => downloadText(groupsToCsv(groups, src), `groups_${src.id}_cycle${asOfCycle}.csv`)}>Download groups (.csv)</button>
      </div>

      <div className="group-opts">
        <div className="field">
          <label htmlFor="group-size">Max group size: {opts.maxSize}</label>
          <input id="group-size" type="range" min="2" max="8" value={opts.maxSize} onChange={(e) => setOpts({ ...opts, maxSize: Number(e.target.value) })} />
        </div>
        <div className="field">
          <span className="eyebrow">Group by</span>
          <div className="seg" role="group" aria-label="Group by">
            <button aria-pressed={opts.mode === 'level'} onClick={() => setOpts({ ...opts, mode: 'level' })}>Overall level</button>
            <button aria-pressed={opts.mode === 'skill'} disabled={!canSkill} title={canSkill ? '' : 'Needs strand scores (IXL Diagnostic)'}
              onClick={() => setOpts({ ...opts, mode: 'skill' })}>Weakest skill</button>
          </div>
        </div>
        <label className="check" htmlFor="same-grade">
          <input id="same-grade" type="checkbox" checked={opts.sameGrade} onChange={(e) => setOpts({ ...opts, sameGrade: e.target.checked })} />
          Keep grades separate
        </label>
        <span className="muted small">{groups.length} groups · {moved.length} student{moved.length === 1 ? '' : 's'} changed tier</span>
      </div>

      <div className="group-grid">
        {groups.map((g) => (
          <article className="group" key={g.name}>
            <div className="group-top">
              <h3>{g.name} <span className="muted small">· {g.pool}</span></h3>
              <span className={`tier ${g.tier.id}`}>{g.tier.label}</span>
            </div>
            <div className="focus">Focus: <strong>{g.focus}</strong></div>
            <ul className="members">
              {g.members.map((m) => (
                <li key={m.studentId}>
                  <button onClick={() => onOpen(m.studentId)}>{m.name}</button>
                  <span className="num muted small">
                    {formatScore(m.latest.score, src)}
                    {MOVE_TEXT[m.move](m) && <span className={`move ${m.move}`}> {MOVE_TEXT[m.move](m)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
