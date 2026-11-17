import { useEffect } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TOTAL_CYCLES } from '../lib/sources.js';
import { formatScore, signed } from '../lib/metrics.js';
import { weakestStrand } from '../lib/grouping.js';
import StatusPill from './StatusPill.jsx';
import { NextStepsBody } from './NextSteps.jsx';
import { standardFor } from '../lib/standards.js';

function Tip({ active, payload, src }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="chart-tip">
      <strong>Cycle {r.cycle}</strong>
      {r.score != null && <div className="row"><span>Score</span><span className="num">{formatScore(r.score, src)}</span></div>}
      {r.projected != null && r.score == null && <div className="row"><span>Projected</span><span className="num">{formatScore(r.projected, src)}</span></div>}
      <div className="row"><span>Benchmark</span><span className="num">{formatScore(r.benchmark, src)}</span></div>
    </div>
  );
}

export default function StudentDetail({ student: s, onClose, standards, groupName }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const { src } = s;

  // Actual scores, benchmark for every cycle, and a dashed projection to the end of the year.
  const byCycle = new Map(s.points.map((p) => [p.cycle, p]));
  const data = [];
  for (let c = 1; c <= TOTAL_CYCLES; c++) {
    const p = byCycle.get(c);
    const bench = s.latest ? s.latest.benchmark + src.expectedGrowth * (c - s.latest.cycle) : null;
    const row = { cycle: c, label: `C${c}`, score: p?.score ?? null, benchmark: p?.benchmark ?? bench };
    if (s.latest && s.growth != null && c >= s.latest.cycle) row.projected = s.latest.score + s.growth * (c - s.latest.cycle);
    data.push(row);
  }
  const weak = weakestStrand(s);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="drawer-head">
          <div>
            <div className="eyebrow">{src.label.toLowerCase().startsWith(src.subject.toLowerCase()) ? src.label : `${src.label} · ${src.subject}`}</div>
            <h2 id="detail-title">{s.name}</h2>
            <div className="muted small">Grade {s.grade}{s.teacher ? ` · ${s.teacher}` : ''} · ID {s.studentId}</div>
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Close student detail">Close</button>
        </div>
        <div><StatusPill status={s.status} /></div>

        <div className="facts">
          <div className="fact"><div className="v num">{s.latest ? formatScore(s.latest.score, src) : '–'}</div><div className="k">Latest ({src.unit})</div></div>
          <div className="fact"><div className="v num">{s.gap != null ? signed(s.gap, src) : '–'}</div><div className="k">vs. benchmark</div></div>
          <div className="fact"><div className="v num">{s.growth != null ? signed(s.growth, src) : '–'}</div><div className="k">Growth per cycle{src.expectedGrowth ? ` (goal +${formatScore(src.expectedGrowth, src)})` : ''}</div></div>
        </div>

        <div>
          <h3>Score by cycle</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--line-strong)' }} />
                <YAxis tickLine={false} axisLine={false} width={44} domain={['auto', 'auto']} tickFormatter={(v) => formatScore(v, src)} />
                <Tooltip content={<Tip src={src} />} cursor={{ stroke: 'var(--line-strong)' }} />
                <Line dataKey="benchmark" stroke="var(--benchmark)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line dataKey="projected" stroke="var(--accent)" strokeDasharray="2 4" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                <Line dataKey="score" stroke="var(--accent)" strokeWidth={2} isAnimationActive={false} connectNulls
                  dot={{ r: 4.5, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            <span><i style={{ background: 'var(--accent)' }} />Score</span>
            <span><i style={{ background: 'repeating-linear-gradient(90deg, var(--accent) 0 2px, transparent 2px 6px)' }} />Projected</span>
            <span><i className="dash" />Benchmark</span>
          </div>
        </div>

        <div className="ns-panel">
          <h3>Next best steps</h3>
          <NextStepsBody student={s} standards={standards} groupName={groupName} />
        </div>

        <div>
          <h3>Why this status</h3>
          {s.flags.length
            ? <ul className="flags">{s.flags.map((f) => <li key={f}>{f}</li>)}</ul>
            : <p className="muted">Growing fast enough to reach the end-of-year goal.</p>}
        </div>

        {s.strands && (
          <div style={{ display: 'grid', gap: 6 }}>
            <h3>Skill scores (latest)</h3>
            <p className="muted small" style={{ margin: 0 }}>Black tick = this cycle's benchmark ({formatScore(s.latest.benchmark, src)}{src.unit === '%' ? '%' : ` ${src.unit}`}).</p>
            {Object.entries(s.strands).map(([name, v]) => {
              // Scale bars around the benchmark using the assessment's own units.
              const lo = s.latest.benchmark - 7 * src.gapUnit; const hi = s.latest.benchmark + 3 * src.gapUnit;
              const pct = (x) => `${Math.max(0, Math.min(100, ((x - lo) / (hi - lo)) * 100))}%`;
              return (
                <div className={`strand ${weak?.name === name ? 'weak' : ''}`} key={name}>
                  <span>{name}{weak?.name === name ? ' (weakest)' : ''}{standardFor(name, s.grade, standards) && <small className="std-inline">{standardFor(name, s.grade, standards).code}</small>}</span>
                  <span className="bar"><span style={{ width: pct(v) }} /><i style={{ left: pct(s.latest.benchmark) }} /></span>
                  <span className="num r">{formatScore(v, src)}</span>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </>
  );
}
