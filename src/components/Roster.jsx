import { useMemo, useState } from 'react';
import { formatScore, signed } from '../lib/metrics.js';
import StatusPill from './StatusPill.jsx';
import Sparkline from './Sparkline.jsx';
import NextStepsPopover from './NextSteps.jsx';

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  grade: (a, b) => (a.grade ?? 0) - (b.grade ?? 0) || a.name.localeCompare(b.name),
  latest: (a, b) => (a.latest?.score ?? -Infinity) - (b.latest?.score ?? -Infinity),
  gap: (a, b) => (a.gap ?? -Infinity) - (b.gap ?? -Infinity),
  growth: (a, b) => (a.growth ?? -Infinity) - (b.growth ?? -Infinity),
  status: (a, b) => a.status.rank - b.status.rank || (a.gap ?? 0) - (b.gap ?? 0),
};

export default function Roster({ summaries, cycles, src, onOpen, standards, groupOf }) {
  const [hover, setHover] = useState(null);
  const showTip = (student, el) => setHover({ student, rect: el.getBoundingClientRect() });
  const [sort, setSort] = useState({ key: 'status', dir: 1 });
  const [show, setShow] = useState('all');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return summaries
      .filter((s) => show === 'all' || s.status.id === show)
      .filter((s) => !needle || s.name.toLowerCase().includes(needle) || s.studentId.includes(needle))
      .sort((a, b) => SORTS[sort.key](a, b) * sort.dir);
  }, [summaries, sort, show, q]);

  const head = (key, label, cls = '') => (
    <th className={cls} aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))}>
        {label}{sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  return (
    <section className="card" aria-labelledby="roster-title">
      <div className="card-head">
        <div>
          <h2 id="roster-title">Students</h2>
          <p>Hover over a student for their next best steps. Click for scores, projection and why they were flagged.</p>
        </div>
        <div className="filter-row">
          <div className="seg" role="group" aria-label="Show students">
            {[['all', 'All'], ['offTrack', 'Off track'], ['watch', 'Watch'], ['onTrack', 'On track']].map(([id, label]) => (
              <button key={id} aria-pressed={show === id} onClick={() => setShow(id)}>{label}</button>
            ))}
          </div>
          <input id="roster-search" className="search" type="search" placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {head('name', 'Student')}
              {head('grade', 'Gr', 'r')}
              {cycles.map((c) => <th key={c} className="r">C{c}</th>)}
              <th>Trend</th>
              {head('gap', 'vs. bench', 'r')}
              {head('growth', 'Growth / cycle', 'r')}
              <th className="r">Projected EOY</th>
              {head('status', 'Status')}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const byCycle = new Map(s.points.map((p) => [p.cycle, p.score]));
              return (
                <tr key={s.studentId} onClick={() => onOpen(s.studentId)} tabIndex={0}
                  aria-describedby={hover?.student.studentId === s.studentId ? 'next-steps-tip' : undefined}
                  onMouseEnter={(e) => showTip(s, e.currentTarget)} onMouseLeave={() => setHover(null)}
                  onFocus={(e) => showTip(s, e.currentTarget)} onBlur={() => setHover(null)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(s.studentId))}>
                  <td className="name">{s.name}</td>
                  <td className="r num">{s.grade}</td>
                  {cycles.map((c) => <td key={c} className="r num">{byCycle.has(c) ? formatScore(byCycle.get(c), src) : <span className="muted">–</span>}</td>)}
                  <td><Sparkline points={s.points} /></td>
                  <td className="r num"><span className={s.gap < 0 ? 'gap-neg' : 'gap-pos'}>{s.gap != null ? signed(s.gap, src) : '–'}</span></td>
                  <td className="r num">{s.growth != null ? signed(s.growth, src) : '–'}{s.pace != null && <span className="muted small"> ({Math.round(s.pace * 100)}%)</span>}</td>
                  <td className="r num">{s.projected != null ? <>{formatScore(s.projected, src)} <span className="muted small">/ {formatScore(s.target, src)}</span></> : '–'}</td>
                  <td><StatusPill status={s.status} /></td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={7 + cycles.length} className="empty">No students match.</td></tr>}
          </tbody>
        </table>
      </div>
      <NextStepsPopover hover={hover} standards={standards} groupOf={groupOf} />
    </section>
  );
}
