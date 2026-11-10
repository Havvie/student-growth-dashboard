import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatScore, signed } from '../lib/metrics.js';

const GRADE_COLORS = { 2: 'var(--g2)', 3: 'var(--g3)', 4: 'var(--g4)', 5: 'var(--g5)' };
export const gradeColor = (g) => GRADE_COLORS[g] ?? 'var(--accent)';

function Tip({ active, payload, label, src, grades }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tip">
      <strong>{label}</strong>
      {grades.map((g) => row[`g${g}`] != null && (
        <div className="row" key={g}>
          <span><i className="sw" style={{ background: gradeColor(g) }} />Grade {g} <span className="muted">(n={row[`n${g}`]})</span></span>
          <span className="num">{signed(row[`g${g}`], src)}</span>
        </div>
      ))}
    </div>
  );
}

// Median distance from benchmark, one line per grade. Zero = on benchmark.
// Plotting the gap (not the raw score) puts every grade on one scale.
export default function GrowthChart({ data, grades, src }) {
  return (
    <div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--line-strong)' }} />
            <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => formatScore(v, src)} />
            <ReferenceLine y={0} stroke="var(--benchmark)" strokeDasharray="5 4" strokeWidth={1.5}
              label={{ value: 'Benchmark', position: 'insideTopLeft', fill: 'var(--ink-3)', fontSize: 12 }} />
            <Tooltip content={<Tip src={src} grades={grades} />} cursor={{ stroke: 'var(--line-strong)' }} />
            {grades.map((g) => (
              <Line key={g} dataKey={`g${g}`} name={`Grade ${g}`} stroke={gradeColor(g)} strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)', fill: gradeColor(g) }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }} connectNulls isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="legend" aria-label="Legend">
        {grades.map((g) => <span key={g}><i style={{ background: gradeColor(g) }} />Grade {g}</span>)}
        <span><i className="dash" />Benchmark (0)</span>
      </div>
    </div>
  );
}
