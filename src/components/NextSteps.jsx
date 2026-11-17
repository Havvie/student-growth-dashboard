import { useLayoutEffect, useRef, useState } from 'react';
import { nextSteps } from '../lib/nextSteps.js';
import StatusPill from './StatusPill.jsx';

export function NextStepsBody({ student, standards, groupName }) {
  const n = nextSteps(student, { standards, groupName });
  return (
    <div className="ns-body">
      {n.skill && (
        <div className="ns-focus">
          <span className="eyebrow">Focus skill</span>
          <strong>{n.skill}</strong>
          {n.standard && <span className="std" title={n.standard.title}>{n.standard.code}{n.standard.title ? ` · ${n.standard.title}` : ''}</span>}
        </div>
      )}
      <div>
        <span className="eyebrow">Try next</span>
        <ul className="ns-moves">
          {n.moves.map((m) => <li key={m}>{m}</li>)}
          <li className="ns-pace">{n.pace}</li>
        </ul>
      </div>
      {n.group && <div className="small muted">Suggested group: <strong>{n.group}</strong></div>}
    </div>
  );
}

// Floating card shown while a roster row is hovered or focused.
export default function NextStepsPopover({ hover, standards, groupOf }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    if (!hover || !ref.current) return;
    const { rect } = hover;
    const h = ref.current.offsetHeight;
    const w = ref.current.offsetWidth;
    const below = rect.bottom + 8 + h < window.innerHeight;
    setPos({
      top: below ? rect.bottom + 6 : Math.max(8, rect.top - h - 6),
      left: Math.max(8, Math.min(rect.left + 140, window.innerWidth - w - 16)),
    });
  }, [hover]);
  if (!hover) return null;
  const s = hover.student;
  return (
    <div ref={ref} className="ns-pop" role="tooltip" id="next-steps-tip"
      style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden', top: 0, left: 0 }}>
      <div className="ns-head"><strong>{s.name}</strong><StatusPill status={s.status} /></div>
      <NextStepsBody student={s} standards={standards} groupName={groupOf.get(s.studentId)} />
    </div>
  );
}
