import { useMemo, useState } from 'react'
import analysis from '../data/derived/analysis.json'
import type { AnalysisArtifact, LaunchId, NormalizedRecord } from '../lib/types'

const data = analysis as AnalysisArtifact
const launchLabel: Record<LaunchId, string> = { gamma: 'Gamma', deel: 'Deel', cartesia: 'Cartesia', airwallex: 'Airwallex' }
const angleLabel: Record<string, string> = {
  founder_story: 'Founder story', launch_announcement: 'Launch announcement', technical_breakthrough: 'Technical breakthrough', use_case_story: 'Use-case story',
  product_demo: 'Product demo', workflow_improvement: 'Workflow improvement', personal_recommendation: 'Personal recommendation', social_proof: 'Social proof',
}

function dateLabel(timestamp: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }).format(new Date(timestamp)) }
function relativeLabel(seconds: number) {
  if (seconds === 0) return 'seed'
  if (seconds < 60) return `+${seconds}s`
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds === 0 ? `+${minutes}m` : `+${minutes}m ${remainingSeconds}s`
  }
  if (seconds < 86400) return `+${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `+${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

export function App() {
  const [launch, setLaunch] = useState<LaunchId | 'all'>('all')
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null)
  const [pulseRange, setPulseRange] = useState<60 | 2700 | 604800>(60)
  const [claimLaunches, setClaimLaunches] = useState<LaunchId[]>(data.launches.map((item) => item.launch))
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const claim = data.claims[0]
  const visibleRecords = useMemo(() => data.records
    .filter((record) => launch === 'all' || record.launch === launch)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp)), [launch])
  const selected = data.records.find((record) => record.id === selectedRecord) ?? null
  const launchOrder = data.launches.map((item) => item.launch)
  const scopedLaunches = data.launches.filter((item) => claimLaunches.includes(item.launch))
  const qualifiedScope = scopedLaunches.filter((item) => item.qualifiedForCrossLaunch)
  const scopedEvidence = (claim?.supportingRecordIds ?? []).map((id) => data.records.find((record) => record.id === id)).filter((record): record is NormalizedRecord => record !== undefined && claimLaunches.includes(record.launch))
  const claimStrength = qualifiedScope.length >= 3 && scopedEvidence.length >= 12 ? 'strong' : qualifiedScope.length >= 2 && scopedEvidence.length >= 8 ? 'moderate' : 'exploratory'

  function chooseLaunch(next: LaunchId | 'all') { setLaunch(next); setSelectedRecord(null) }

  return <main>
    <a className="skip-link" href="#study">Skip to study</a>
    <section className="masthead" id="study">
      <div className="masthead__top">
        <div className="identity"><span className="wordmark">Social Capital Launch Graph</span><small>Public X launch research</small></div>
        <nav aria-label="Study sections"><a href="#overview">Overview</a><a href="#launches">Launches</a><a href="#evidence">Evidence</a><a href="#method">Method</a></nav>
        <span className="collected">Collected 19 Sep 2026</span>
      </div>
      <div className="report-opening" id="overview">
        <div className="finding">
          <div className="finding__meta"><span>Observed pattern</span><strong className={`evidence-grade evidence-grade--${claim?.evidenceStrength}`}>{claim?.evidenceStrength} evidence</strong></div>
          <h1>{claim?.claim ?? 'No cross-launch pattern cleared the evidence threshold.'}</h1>
          <p className="finding__meaning">Why this matters: in both well-documented launches, the founder’s account carries the launch as a sequence—not a single announcement.</p>
          <p className="finding__boundary"><strong>Limit:</strong> two launches show a repeated format. They do not prove a general Social Capital playbook, paid promotion, or private coordination.</p>
          <button className="primary-action" onClick={() => { setEvidenceOpen(true); document.getElementById('evidence')?.scrollIntoView({ block: 'start' }) }}>See the {claim?.supportingRecordIds.length ?? 0} supporting records</button>
        </div>
        <aside className="research-scope" aria-label="Research scope">
          <span>Research scope</span>
          <dl>
            <div><dt>{data.dataset.totalRecords}</dt><dd>verified public X records</dd></div>
            <div><dt>{data.dataset.qualifiedLaunches}</dt><dd>launches with 12+ records</dd></div>
            <div><dt>{data.dataset.launchesObserved}</dt><dd>verified association sources</dd></div>
          </dl>
          <p>Gamma and Cartesia remain visible for context, but do not support the cross-launch conclusion.</p>
        </aside>
      </div>
      <div id="launches">
      <LaunchPulse records={visibleRecords} launch={launch} range={pulseRange} selected={selectedRecord} launchOrder={launchOrder} onLaunch={chooseLaunch} onRange={setPulseRange} onSelect={setSelectedRecord} />
      </div>
      {selected && <div className="pulse-selection" aria-live="polite"><span><b>{launchLabel[selected.launch]} · {relativeLabel(selected.relativeSecondsFromFirstPost)}</b>{selected.creator} {selected.handle}</span><p>{selected.observedExcerpt ?? 'Verified thread continuation; text is not retained, so no narrative classification is assigned.'}</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open source record <span className="sr-only">in a new tab</span></a></div>}
    </section>

    <section className="claim-lab" id="claim-lab" aria-labelledby="claim-lab-title">
      <div className="claim-lab__intro"><p className="kicker">Test the conclusion</p><h2 id="claim-lab-title">Change the evidence. See what the data can still support.</h2><p>Turn launches on or off. The result updates immediately. Launches with fewer than 12 verified records remain visible, but they cannot support a cross-launch conclusion.</p></div>
      <div className="claim-lab__instrument">
        <div className="claim-switches" role="group" aria-label="Launches included in claim">
          {launchOrder.map((id) => { const included = claimLaunches.includes(id); const summary = data.launches.find((item) => item.launch === id); return <button key={id} aria-pressed={included} onClick={() => setClaimLaunches((current) => included ? current.filter((item) => item !== id) : [...current, id])}><span aria-hidden="true">{included ? '✓' : '+'}</span>{launchLabel[id]}<small>{summary?.recordCount} records</small></button> })}
        </div>
        <div className="claim-result" aria-live="polite">
          <div><span>Supported conclusion</span><strong>{qualifiedScope.length >= 2 ? claim?.claim : qualifiedScope.length === 1 ? 'Only one well-documented launch remains, so this is an early signal—not a cross-launch pattern.' : 'The selected launches do not contain enough evidence for this conclusion.'}</strong></div>
          <dl><div><dt>Evidence level</dt><dd className={`claim-strength claim-strength--${claimStrength}`}>{claimStrength}</dd></div><div><dt>Launches with 12+ records</dt><dd>{qualifiedScope.length}</dd></div><div><dt>Records used</dt><dd>{scopedEvidence.length}</dd></div></dl>
          <p>{qualifiedScope.length >= 2 ? `The same public pattern appears in ${qualifiedScope.length} launches with enough records to compare.` : 'A cross-launch conclusion needs at least two launches with 12 or more verified records.'}</p>
          <details><summary>What would count as strong evidence?</summary><p>The same pattern across at least three well-documented launches, supported by 12 or more verified records. This dataset has enough records overall, but only two launches currently meet the coverage requirement.</p></details>
        </div>
      </div>
    </section>

    <section className="implications-section" aria-labelledby="implications-title">
      <div><p className="kicker">What this suggests to test next</p><h2 id="implications-title">Three practical questions for the next launch</h2><p>This sample is too small to prescribe a playbook. It does identify the next questions worth testing with fuller public evidence.</p></div>
      <ol>
        <li><h3>Design the launch as a sequence</h3><p>Both complete samples use a founder-authored thread. Compare a structured sequence with a single announcement before treating either format as a default.</p></li>
        <li><h3>Measure the first hour, not just the first post</h3><p>The pulse keeps every early public record visible. Capture replies, reposts, and follow-on posts before judging whether a launch has momentum.</p></li>
        <li><h3>Expand coverage before standardizing</h3><p>Gamma and Cartesia do not meet the 12-record threshold. Add comparable launches before calling this a repeatable portfolio practice.</p></li>
      </ol>
    </section>

    <section className="analysis-section controls-section" aria-labelledby="selector-title">
      <div className="section-heading"><div><p className="kicker">Explore the records</p><h2 id="selector-title">Focus on one launch</h2></div><p>Select a launch to update the detailed timeline and narrative totals below. Limited launches have fewer than {data.dataset.minimumRecordsPerQualifiedLaunch} verified records.</p></div>
      <div className="launch-tabs" role="group" aria-label="Launch selection">
        <button aria-pressed={launch === 'all'} onClick={() => chooseLaunch('all')}>All candidates</button>
        {launchOrder.map((id) => <button key={id} aria-pressed={launch === id} onClick={() => chooseLaunch(id)}>{launchLabel[id]}{data.launches.find((item) => item.launch === id)?.qualifiedForCrossLaunch ? '' : ' · limited'}</button>)}
      </div>
      <div className="coverage-list" aria-label="Launch coverage">{data.launches.map((item) => <div key={item.launch}><span>{item.company}</span><strong>{item.recordCount} records</strong><small>{item.qualifiedForCrossLaunch ? 'included in claim' : 'context only'}</small></div>)}</div>
    </section>

    <section className="analysis-section timeline-section" aria-labelledby="timeline-title">
      <div className="section-heading"><div><p className="kicker">Complete chronology</p><h2 id="timeline-title">Every verified post, in order</h2></div><p>Times come directly from each X post ID. A new wave starts when more than {data.dataset.waveGapMinutes} minutes pass without another observed post.</p></div>
      <div key={launch} className="timeline timeline--updated" aria-live="polite">
        {visibleRecords.length > 0 ? visibleRecords.map((record) => <TimelineItem key={record.id} record={record} active={selectedRecord === record.id} onSelect={() => setSelectedRecord(record.id)} />) : <EmptyState message="No verified records are available for this launch selection." />}
      </div>
    </section>

    <section className="analysis-section split-section" aria-label="Overlap and narrative analysis">
      <div className="matrix-pane"><p className="kicker">Account overlap</p><h2>No account appears in more than one launch</h2><p className="muted">This sample contains one founder account for each launch. That does not prove Social Capital never works with the same account more than once.</p>
        <div className="matrix" role="table" aria-label="Creator overlap matrix"><div role="row" className="matrix-row matrix-row--head"><span role="columnheader">launch</span>{launchOrder.map((id) => <span role="columnheader" key={id}>{launchLabel[id]}</span>)}</div>{launchOrder.map((left) => <div role="row" className="matrix-row" key={left}><span role="rowheader">{launchLabel[left]}</span>{launchOrder.map((right) => { const cell = left === right ? 1 : data.overlap.find((item) => item.left === left && item.right === right)?.jaccard ?? data.overlap.find((item) => item.left === right && item.right === left)?.jaccard ?? 0; return <span role="cell" className={cell > 0 ? 'matrix-cell matrix-cell--shared' : 'matrix-cell'} key={right} aria-label={`${launchLabel[left]} and ${launchLabel[right]}: ${Math.round(cell * 100)} percent creator overlap`}>{left === right ? '—' : `${Math.round(cell * 100)}%`}</span> })}</div>)}</div>
      </div>
      <div className="narrative-pane"><p className="kicker">Narrative coverage</p><h2>Classified only where text is preserved</h2><p className="muted">Four root excerpts have a narrative label. The remaining {data.quality.missingNarrative} records stay unclassified rather than inheriting the root’s category.</p>
        <NarrativeBars records={visibleRecords} />
      </div>
    </section>

    <section className="analysis-section evidence-section" id="evidence" aria-labelledby="evidence-title">
      <div className="section-heading"><div><p className="kicker">Evidence ledger</p><h2 id="evidence-title">Open every supporting record</h2></div><button className="text-button" aria-expanded={evidenceOpen} onClick={() => setEvidenceOpen((value) => !value)}>{evidenceOpen ? 'Collapse ledger' : 'Expand ledger'}</button></div>
      {evidenceOpen && <div className="evidence-grid">
        <div className="ledger">{(claim?.supportingRecordIds ?? []).map((id) => data.records.find((record) => record.id === id)).filter((record): record is NormalizedRecord => Boolean(record)).map((record) => <button key={record.id} className={`ledger-row ${selectedRecord === record.id ? 'ledger-row--selected' : ''}`} onClick={() => setSelectedRecord(record.id)}><span>{launchLabel[record.launch]}</span><span>{record.launchSequenceIndex.toString().padStart(2, '0')}</span><span>{record.contentFormat === 'thread_root' ? 'root' : 'continuation'}</span><span>{dateLabel(record.timestamp)}</span></button>)}</div>
        <EvidenceDetail record={selected ?? data.records.find((record) => record.id === claim?.supportingRecordIds[0]) ?? null} />
      </div>}
    </section>

    <section className="quality-section" aria-labelledby="quality-title"><div><p className="kicker">Data quality</p><h2 id="quality-title">Known gaps in the evidence</h2></div><dl><div><dt>{data.quality.duplicateRecords}</dt><dd>duplicates retained</dd></div><div><dt>{data.dataset.recordsWithEngagement}</dt><dd>records with engagement</dd></div><div><dt>{data.quality.missingNarrative}</dt><dd>unclassified narratives</dd></div><div><dt>{data.engagement.topRecordViewShare === null ? '—' : `${Math.round(data.engagement.topRecordViewShare * 100)}%`}</dt><dd>top root’s share of observed root views</dd></div></dl><p>Only four root posts have captured view counts. The engagement summary is descriptive and does not support the primary finding.</p></section>
    <section className="method-section" id="method" aria-labelledby="method-title"><div><p className="kicker">Method & limits</p><h2 id="method-title">A reproducible public-record sample</h2></div><details><summary>Read the collection method and analytical limits</summary><div className="method-columns"><div><h3>Collection & transformation</h3><p>Social Capital work pages establish candidate association. Each retained X URL was inspected publicly; its timestamp is decoded deterministically from its X post ID. Raw, normalized, and derived files remain separate.</p></div><div><h3>Coverage rule</h3><p>Cross-launch claims require at least {data.dataset.minimumRecordsPerQualifiedLaunch} verified, timestamped records per launch. Deel and Airwallex qualify; Gamma and Cartesia provide context only.</p></div><div><h3>Limits</h3><p>Posts can be deleted, metrics change, and platform ranking affects visibility. This sample cannot prove private coordination, paid distribution, creator-network behavior, or causality.</p></div></div></details></section>
    <footer><span>Social Capital Launch Graph · independent research prototype</span><span>Built from local static analysis · <a href="https://www.sociallcapital.com/" target="_blank" rel="noreferrer">association sources</a></span></footer>
  </main>
}

function LaunchPulse({ records, launch, range, selected, launchOrder, onLaunch, onRange, onSelect }: {
  records: NormalizedRecord[]
  launch: LaunchId | 'all'
  range: 60 | 2700 | 604800
  selected: string | null
  launchOrder: LaunchId[]
  onLaunch: (launch: LaunchId | 'all') => void
  onRange: (range: 60 | 2700 | 604800) => void
  onSelect: (id: string) => void
}) {
  const rows = launch === 'all' ? launchOrder : [launch]
  const rangeLabels: Record<typeof range, string> = { 60: 'First 60 seconds', 2700: 'First 45 minutes', 604800: 'Full 7 days' }
  const tickLabels: Record<typeof range, [string, string, string]> = { 60: ['launch post', '+30 sec', '+60 sec'], 2700: ['launch post', '+22 min', '+45 min'], 604800: ['launch post', '+3.5 days', '+7 days'] }
  return <section className="pulse" aria-labelledby="pulse-title">
    <div className="pulse__header"><div><h2 id="pulse-title">How each launch unfolded</h2><p>Each dot is one verified X post. Its position shows how long after the first launch post it appeared.</p></div><div className="pulse__ranges" role="group" aria-label="Time shown">{([60, 2700, 604800] as const).map((value) => <button key={value} aria-pressed={range === value} onClick={() => onRange(value)}>{rangeLabels[value]}</button>)}</div></div>
    <div className="pulse__launches" role="group" aria-label="Pulse launch filter"><button aria-pressed={launch === 'all'} onClick={() => onLaunch('all')}>All launches</button>{launchOrder.map((id) => <button key={id} aria-pressed={launch === id} onClick={() => onLaunch(id)}>{launchLabel[id]}</button>)}</div>
    <div className="pulse__plot">
      {rows.map((id) => { const rowRecords = records.filter((record) => record.launch === id && record.relativeSecondsFromFirstPost <= range); const total = data.records.filter((record) => record.launch === id).length; return <div className="pulse-row" key={id}><div className="pulse-row__label"><strong>{launchLabel[id]}</strong><span>{rowRecords.length}/{total} visible</span></div><div className="pulse-row__track">{rowRecords.map((record) => { const left = Math.min((record.relativeSecondsFromFirstPost / range) * 100, 100); return <button key={record.id} className={`pulse-mark ${record.contentFormat === 'thread_root' ? 'pulse-mark--root' : ''} ${selected === record.id ? 'pulse-mark--selected' : ''}`} style={{ left: `${left}%`, top: `${9 + ((record.launchSequenceIndex - 1) % 3) * 11}px` }} aria-label={`${launchLabel[id]}, ${record.creator}, ${relativeLabel(record.relativeSecondsFromFirstPost)}`} aria-pressed={selected === record.id} onClick={() => onSelect(record.id)} /> })}<div className="pulse-row__ticks"><span>{tickLabels[range][0]}</span><span>{tickLabels[range][1]}</span><span>{tickLabels[range][2]}</span></div></div></div> })}
    </div>
    <p className="pulse__note"><strong>How to read this:</strong> rust marks the first launch post; teal marks later posts. Closely timed posts are stacked so every source remains selectable.</p>
  </section>
}

function TimelineItem({ record, active, onSelect }: { record: NormalizedRecord; active: boolean; onSelect: () => void }) {
  return <button className={`event ${active ? 'event--active' : ''}`} onClick={onSelect} aria-pressed={active}><span className="event__rail"><i />{record.waveId > 1 && <b>W{record.waveId}</b>}</span><span className="event__time">{dateLabel(record.timestamp)}<small>{relativeLabel(record.relativeSecondsFromFirstPost)}</small></span><span className="event__body"><strong>{record.creator}</strong><span>{launchLabel[record.launch]} / {record.contentFormat === 'thread_root' ? 'Thread root' : 'Thread continuation'}</span>{record.observedExcerpt && <em>{record.observedExcerpt}</em>}</span><span className="event__angle">{record.narrativeAngle ? angleLabel[record.narrativeAngle] : 'Not classified'}</span></button>
}

function NarrativeBars({ records }: { records: NormalizedRecord[] }) {
  const groups = Object.entries(records.reduce<Record<string, number>>((accumulator, record) => { const key = record.narrativeAngle ?? 'unclassified'; accumulator[key] = (accumulator[key] ?? 0) + 1; return accumulator }, {})).sort((a, b) => b[1] - a[1])
  const maximum = Math.max(...groups.map(([, value]) => value), 1)
  if (groups.length === 0) return <EmptyState message="No narrative classifications are available for this selection." />
  return <div className="bars">{groups.map(([angle, value]) => <div className="bar-row" key={angle}><span>{angleLabel[angle] ?? 'Not classified'}</span><div><i style={{ width: `${(value / maximum) * 100}%` }} /></div><b>{value}</b></div>)}</div>
}

function EvidenceDetail({ record }: { record: NormalizedRecord | null }) {
  if (!record) return <aside className="detail">Select a source record to inspect its evidence.</aside>
  return <aside className="detail"><span className="detail__label">Selected record</span><h3>{record.creator} <small>{record.handle}</small></h3><p>{record.observedExcerpt ?? 'This verified thread continuation is retained for chronology and source traceability. Its full text is not stored, so its narrative remains unclassified.'}</p><dl><div><dt>Source status</dt><dd>Verified public X URL</dd></div><div><dt>Classification</dt><dd>{record.narrativeAngle ? angleLabel[record.narrativeAngle] : 'Not classified'} / {record.contentFormat.replace('_', ' ')}</dd></div><div><dt>Timestamp basis</dt><dd>X post ID decoded deterministically</dd></div></dl><a className="source-link" href={record.sourceUrl} target="_blank" rel="noreferrer">Open source record <span className="sr-only">in a new tab</span></a><p className="detail__note">{record.classificationNotes}</p></aside>
}

function EmptyState({ message }: { message: string }) { return <p className="empty-state">{message}</p> }
