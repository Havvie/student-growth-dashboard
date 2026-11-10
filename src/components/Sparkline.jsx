// Tiny trend line for the roster: score by cycle, with the benchmark as a dashed line.
export default function Sparkline({ points, width = 96, height = 28, cycles = 4 }) {
  if (!points.length) return <span className="muted">–</span>;
  const values = points.flatMap((p) => [p.score, p.benchmark]).filter((v) => v != null);
  let min = Math.min(...values); let max = Math.max(...values);
  if (max - min < 1e-9) { min -= 1; max += 1; }
  const pad = 4;
  const x = (c) => pad + ((c - 1) / Math.max(1, cycles - 1)) * (width - pad * 2);
  const y = (v) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.cycle).toFixed(1)},${y(p.score).toFixed(1)}`).join('');
  const bench = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.cycle).toFixed(1)},${y(p.benchmark).toFixed(1)}`).join('');
  const last = points[points.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`Scores by cycle: ${points.map((p) => p.score).join(', ')}`}>
      <path d={bench} fill="none" stroke="var(--benchmark)" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.cycle)} cy={y(last.score)} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
    </svg>
  );
}
