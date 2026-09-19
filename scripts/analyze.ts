import { mkdir, writeFile } from 'node:fs/promises'
import { rawRecords } from '../data/raw/records'
import { calculateCreatorFrequency, calculateCreatorOverlap, calculateEngagementConcentration, calculateNarrativeDistribution, deduplicatePosts, MIN_RECORDS_PER_QUALIFIED_LAUNCH, normalizePosts, WAVE_GAP_MINUTES } from '../lib/analysis'
import { generateInsightCandidates } from '../lib/claims'
import type { AnalysisArtifact, LaunchId } from '../lib/types'
import { validateDataset } from '../lib/validation'

const launchNames: Record<LaunchId, string> = { gamma: 'Gamma', deel: 'Deel', cartesia: 'Cartesia', airwallex: 'Airwallex' }
const validation = validateDataset(rawRecords)
if (!validation.valid) throw new Error(`Dataset validation failed:\n${validation.issues.join('\n')}`)

const records = normalizePosts(deduplicatePosts(rawRecords))
const launches = (Object.keys(launchNames) as LaunchId[]).map((launch) => {
  const launchRecords = records.filter((record) => record.launch === launch)
  return {
    launch,
    company: launchNames[launch],
    recordCount: launchRecords.length,
    timestampedRecordCount: launchRecords.length,
    qualifiedForCrossLaunch: launchRecords.length >= MIN_RECORDS_PER_QUALIFIED_LAUNCH,
    firstPostAt: launchRecords[0]?.timestamp ?? null,
    waveCount: new Set(launchRecords.map((record) => record.waveId)).size,
    creatorCount: new Set(launchRecords.map((record) => record.handle)).size,
  }
})

const artifact: AnalysisArtifact = {
  generatedAt: [...rawRecords].map((record) => record.collectedAt).sort().at(-1) ?? 'unknown',
  dataset: {
    totalRecords: rawRecords.length, verifiedRecords: records.length, timestampedRecords: records.length, recordsWithEngagement: records.filter((record) => Object.values(record.metrics).some((value) => value !== null)).length,
    launchesObserved: launches.length, qualifiedLaunches: launches.filter((launch) => launch.qualifiedForCrossLaunch).length,
    creatorsObserved: new Set(records.map((record) => record.handle.toLowerCase())).size, platforms: ['X'], waveGapMinutes: WAVE_GAP_MINUTES, minimumRecordsPerQualifiedLaunch: MIN_RECORDS_PER_QUALIFIED_LAUNCH,
  },
  launches, records, creatorFrequency: calculateCreatorFrequency(records), overlap: calculateCreatorOverlap(records),
  narrativeDistribution: calculateNarrativeDistribution(records), engagement: calculateEngagementConcentration(records), claims: generateInsightCandidates(records),
  quality: {
    duplicateRecords: validation.duplicateCount,
    excludedRecords: rawRecords.filter((record) => record.verificationStatus === 'excluded').length,
    missingNarrative: records.filter((record) => !record.narrativeAngle).length,
    missingEngagement: records.filter((record) => Object.values(record.metrics).every((value) => value === null)).length,
    notes: ['Timestamps are deterministically decoded from public X post IDs (Snowflake IDs).', 'Only four root posts have engagement snapshots; continuation-post metrics remain unavailable and are excluded from engagement calculations.', 'Narrative classification is limited to the four records whose excerpts are preserved; 39 continuation records remain explicitly unclassified.', `Gamma and Cartesia are retained as observed candidates but excluded from cross-launch claims because each has fewer than ${MIN_RECORDS_PER_QUALIFIED_LAUNCH} verified records.`],
  },
}

await mkdir('data/normalized', { recursive: true })
await mkdir('data/derived', { recursive: true })
await writeFile('data/normalized/records.json', `${JSON.stringify(records, null, 2)}\n`)
await writeFile('data/derived/analysis.json', `${JSON.stringify(artifact, null, 2)}\n`)
console.log(`Generated analysis for ${artifact.dataset.totalRecords} verified records.`)
