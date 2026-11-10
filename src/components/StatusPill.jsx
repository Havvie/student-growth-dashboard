// Status is never color alone: each pill has an icon and a word.
const ICONS = {
  onTrack: <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  watch: <><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 2.5a5.5 5.5 0 010 11z" fill="currentColor" /></>,
  offTrack: <><path d="M8 2l6.5 11.5h-13z" fill="currentColor" /><path d="M8 6.5v3.2M8 11.6v.4" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" /></>,
  baseline: <circle cx="8" cy="8" r="3" fill="currentColor" />,
};

export function StatusIcon({ id, size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">{ICONS[id]}</svg>;
}

export default function StatusPill({ status }) {
  return (
    <span className={`pill ${status.id}`}>
      <StatusIcon id={status.id} />
      {status.label}
    </span>
  );
}
