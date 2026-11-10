import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseExport, mergeRecords, assessmentsIn } from './lib/parsers.js';
import { studentSummaries, gapTrend, kpis, settingsFor, signed } from './lib/metrics.js';
import { suggestGroups } from './lib/grouping.js';
import GrowthChart from './components/GrowthChart.jsx';
import Roster from './components/Roster.jsx';
import Groups from './components/Groups.jsx';
import ImportPanel from './components/ImportPanel.jsx';
import StudentDetail from './components/StudentDetail.jsx';
import StatusPill from './components/StatusPill.jsx';

const SAMPLE_FILES = [1, 2, 3].flatMap((c) => [
  `ixl-diagnostic-math_cycle${c}.csv`,
  `amira-reading_cycle${c}.csv`,
  `illuminate-ela-benchmark_cycle${c}.csv`,
]);
const REPO_URL = 'https://github.com/havvie/student-growth-dashboard';

export default function App() {
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [isSample, setIsSample] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [assessment, setAssessment] = useState('ixl');
  const [grade, setGrade] = useState('all');
  const [asOf, setAsOf] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [groupOpts, setGroupOpts] = useState({ maxSize: 5, sameGrade: true, mode: 'level' });

  const loadSample = useCallback(async () => {
    try {
      const results = await Promise.all(SAMPLE_FILES.map(async (f) => {
        const res = await fetch(`./sample-data/${f}`);
        if (!res.ok) throw new Error(f);
        return parseExport(await res.text(), f);
      }));
      setRecords(mergeRecords(results.map((r) => r.records)));
      setReports(results.map((r) => r.report).sort((a, b) => a.fileName.localeCompare(b.fileName)));
      setIsSample(true);
      setAssessment('ixl');
      setAsOf(null);
      setLoadError('');
    } catch (e) {
      setLoadError(`Could not load the sample file ${e.message}.`);
    }
  }, []);
  useEffect(() => { loadSample(); }, [loadSample]);

  const onFiles = useCallback(async (fileList) => {
    const files = [...fileList].filter((f) => /\.csv$/i.test(f.name) || f.type === 'text/csv');
    if (!files.length) return;
    const results = await Promise.all(files.map(async (f) => parseExport(await f.text(), f.name)));
    const fresh = results.map((r) => r.records);
    const next = isSample ? mergeRecords(fresh) : mergeRecords([records, ...fresh]);
    setReports((prev) => (isSample ? results.map((r) => r.report) : [...prev, ...results.map((r) => r.report)]));
    if (next.length) {
      setRecords(next);
      setIsSample(false);
      const first = assessmentsIn(next)[0];
      if (first) setAssessment(first.id);
      setAsOf(null);
    }
    document.getElementById('import')?.scrollIntoView({ behavior: 'smooth' });
  }, [isSample, records]);

  const assessments = useMemo(() => assessmentsIn(records), [records]);
  const current = assessments.find((a) => a.id === assessment) ?? assessments[0];
  const assessmentId = current?.id;
  const src = useMemo(() => (assessmentId ? settingsFor(assessmentId, records) : null), [assessmentId, records]);

  const scoped = useMemo(() => records.filter((r) => r.assessment === assessmentId && (grade === 'all' || r.grade === Number(grade))), [records, assessmentId, grade]);
  const cycles = useMemo(() => [...new Set(scoped.map((r) => r.cycle))].sort((a, b) => a - b), [scoped]);
  const cycle = asOf && cycles.includes(asOf) ? asOf : cycles[cycles.length - 1];
  const grades = useMemo(() => [...new Set(records.filter((r) => r.assessment === assessmentId).map((r) => r.grade))].filter((g) => g != null).sort((a, b) => a - b), [records, assessmentId]);
  const shownGrades = grade === 'all' ? grades : [Number(grade)];

  const summaries = useMemo(() => (assessmentId ? studentSummaries(scoped, assessmentId, cycle) : []), [scoped, assessmentId, cycle]);
  const previous = useMemo(() => (assessmentId && cycle > 1 ? studentSummaries(scoped, assessmentId, cycle - 1) : []), [scoped, assessmentId, cycle]);
  const k = useMemo(() => kpis(summaries), [summaries]);
  const trend = useMemo(() => (assessmentId ? gapTrend(scoped.filter((r) => r.cycle <= cycle), assessmentId, shownGrades) : []), [scoped, assessmentId, shownGrades, cycle]);
  const canSkill = summaries.some((s) => s.strands);
  const opts = canSkill ? groupOpts : { ...groupOpts, mode: 'level' };
  const groups = useMemo(() => suggestGroups(summaries, { ...opts, previous }), [summaries, opts, previous]);
  const flagged = summaries.filter((s) => s.status.id === 'offTrack').sort((a, b) => a.gapCycles - b.gapCycles);
  const open = summaries.find((s) => s.studentId === openId);

  const pct = (n) => (k.scored ? Math.round((n / k.scored) * 100) : 0);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="var(--accent)" />
              <path d="M7 22l6-6 4 4 8-9" stroke="var(--accent-ink)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <h1>Cycle Check</h1>
              <p>Student growth across data cycles, for intervention teams</p>
            </div>
          </div>
          <div className="actions">
            <label className="btn primary" htmlFor="file-input">Import CSV exports</label>
            <input id="file-input" type="file" accept=".csv,text/csv" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
            <a className="btn" href="./sample-data/template.csv" download>CSV template</a>
            {!isSample && <button className="btn" onClick={loadSample}>Reload sample data</button>}
          </div>
        </div>
      </header>

      <main className="wrap">
        {isSample && (
          <div className="demo-note">
            <strong>Demo data.</strong>
            <span>All 24 students, teachers and scores are made up. Three data cycles of IXL-style math, Amira-style reading and Illuminate-style ELA exports for grades 2–5.</span>
          </div>
        )}
        {loadError && <div className="demo-note">{loadError}</div>}

        {current && src && (
          <>
            <div className="controls">
              <div className="field">
                <span className="eyebrow">Assessment</span>
                <div className="seg" role="group" aria-label="Assessment">
                  {assessments.map((a) => (
                    <button key={a.id} aria-pressed={a.id === assessmentId} onClick={() => { setAssessment(a.id); setOpenId(null); }}>
                      {a.subject}<small>{a.label}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span className="eyebrow">Grade</span>
                <div className="seg" role="group" aria-label="Grade">
                  {['all', ...grades].map((g) => (
                    <button key={g} aria-pressed={String(grade) === String(g)} onClick={() => setGrade(String(g))}>{g === 'all' ? 'All' : g}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="as-of">As of</label>
                <select id="as-of" value={cycle ?? ''} onChange={(e) => setAsOf(Number(e.target.value))}>
                  {cycles.map((c) => <option key={c} value={c}>Cycle {c}</option>)}
                </select>
              </div>
            </div>

            <section className="tiles" aria-label="Summary">
              <div className="tile">
                <span className="eyebrow">Students</span>
                <span className="value num">{k.students}</span>
                <span className="sub">{grade === 'all' ? `Grades ${grades[0]}–${grades[grades.length - 1]}` : `Grade ${grade}`} · cycle {cycle}</span>
              </div>
              <div className="tile">
                <span className="eyebrow">On track</span>
                <span className="value num">{k.onTrack}<small>{pct(k.onTrack)}%</small></span>
                <div className="stack" role="img" aria-label={`${k.onTrack} on track, ${k.watch} watch, ${k.offTrack} off track`}>
                  <span style={{ width: `${pct(k.onTrack)}%`, background: 'var(--good)' }} />
                  <span style={{ width: `${pct(k.watch)}%`, background: 'var(--warn)' }} />
                  <span style={{ width: `${pct(k.offTrack)}%`, background: 'var(--crit)' }} />
                </div>
                <span className="sub">{k.watch} to watch · {k.offTrack} off track</span>
              </div>
              <div className="tile">
                <span className="eyebrow">Off track</span>
                <span className="value num">{k.offTrack}<small>{pct(k.offTrack)}%</small></span>
                <span className="sub">Growing too slowly to reach the goal</span>
              </div>
              <div className="tile">
                <span className="eyebrow">{k.medianPace != null ? 'Median growth pace' : 'Median vs. benchmark'}</span>
                <span className="value num">
                  {k.medianPace != null ? `${Math.round(k.medianPace * 100)}%` : signed(median(summaries.map((s) => s.gap)), src)}
                </span>
                <span className="sub">{k.medianPace != null ? `of a typical year's growth (+${src.expectedGrowth} ${src.unit} per cycle)` : `${src.unitLong}, goal ${src.benchmark ? src.benchmark(3, 1) : ''}%+`}</span>
              </div>
            </section>

            <div className="split">
              <section className="card" aria-labelledby="trend-title">
                <div className="card-head">
                  <div>
                    <h2 id="trend-title">Is the gap closing?</h2>
                    <p>Median distance from the grade-level benchmark, in {src.unitPlural}. Lines rising toward the dashed benchmark mean students are catching up.</p>
                  </div>
                </div>
                <GrowthChart data={trend} grades={shownGrades} src={src} />
              </section>

              <section className="card" aria-labelledby="flag-title">
                <div className="card-head">
                  <div>
                    <h2 id="flag-title">Needs attention <span className="muted">({flagged.length})</span></h2>
                    <p>Off-track students, furthest behind first.</p>
                  </div>
                </div>
                {flagged.length ? (
                  <ul className="attention">
                    {flagged.map((s) => (
                      <li key={s.studentId}>
                        <button onClick={() => setOpenId(s.studentId)}>
                          <span className="who"><span>{s.name} <span className="muted small">Gr {s.grade}</span></span><StatusPill status={s.status} /></span>
                          <span className="why">{s.flags.find((f) => f.startsWith('Growing') || f.startsWith('Dropped') || f.startsWith('Scores')) ?? s.flags[0]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="empty">No off-track students for this view.</p>}
              </section>
            </div>

            <Roster summaries={summaries} cycles={cycles.filter((c) => c <= cycle)} src={src} onOpen={setOpenId} />
            <Groups groups={groups} opts={opts} setOpts={setGroupOpts} src={src} canSkill={canSkill} asOfCycle={cycle} onOpen={setOpenId} />
          </>
        )}

        <ImportPanel reports={reports} onFiles={onFiles} />

        <footer>
          <span>All student data in the demo is synthetic. Runs fully in the browser; imported files never leave your device.</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer">Source on GitHub</a>
        </footer>
      </main>

      {open && <StudentDetail student={open} onClose={() => setOpenId(null)} />}
    </>
  );
}

function median(xs) {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
