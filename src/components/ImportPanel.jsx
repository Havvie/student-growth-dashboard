import { useState } from 'react';

export default function ImportPanel({ reports, onFiles }) {
  const [over, setOver] = useState(false);
  return (
    <section className="card" aria-labelledby="import-title" id="import">
      <div className="card-head">
        <div>
          <h2 id="import-title">Data import report</h2>
          <p>Each export is checked on the way in: format detected, cycle assigned from the test date, duplicates removed, blank scores kept as missing instead of zero.</p>
        </div>
      </div>
      <div className={`dropzone ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}>
        Drop CSV exports here, or{' '}
        <label className="btn" htmlFor="file-input-2" style={{ display: 'inline-flex' }}>choose files</label>
        <input id="file-input-2" type="file" accept=".csv,text/csv" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
        <div className="muted small" style={{ marginTop: 6 }}>Files stay in your browser. Nothing is uploaded to a server.</div>
      </div>
      <div className="files">
        {reports.map((r) => (
          <div className="file" key={r.fileName}>
            <div className="fname">{r.fileName}</div>
            <div className="muted">{r.source ?? 'Unknown format'} · {r.kept} of {r.rows} rows kept{r.cycles?.length ? ` · cycle ${r.cycles.join(', ')}` : ''}</div>
            {r.issues.length === 0 && <div className="issue">No issues found.</div>}
            {r.issues.map((i) => <div key={i.text} className={`issue ${i.level}`}>{i.level === 'error' ? '✕' : i.level === 'warn' ? '!' : '·'} {i.text}</div>)}
          </div>
        ))}
      </div>
    </section>
  );
}
