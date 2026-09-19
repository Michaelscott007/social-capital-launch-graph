import { describe, expect, it } from 'vitest'
import { calculateCreatorFrequency, calculateCreatorOverlap, calculateEngagementConcentration, calculateNarrativeDistribution, deduplicatePosts, normalizePosts, timestampFromXPostId } from '../lib/analysis'
import { assignEvidenceStrength, generateInsightCandidates } from '../lib/claims'
import type { RawRecord } from '../lib/types'
import { validateDataset } from '../lib/validation'

const record = (id: string, launch: RawRecord['launch'], handle: string, postId: string): RawRecord => ({
  id, launch, creator: handle.slice(1), handle, platform: 'x', postId, rootPostId: postId, sourceUrl: `https://x.com/${handle.slice(1)}/status/${postId}`,
  observedExcerpt: 'source text', contentFormat: 'thread_root', narrativeAngle: 'founder_story', classificationNotes: 'fixture',
  metrics: { views: null, likes: null, replies: null, reposts: null }, collectedAt: '2026-09-19T00:00:00.000Z', verificationStatus: 'verified', associationSource: `https://www.sociallcapital.com/work/${launch}`, verificationMethod: 'public_browser_inspection',
})

describe('evidence analysis', () => {
  it('validates data and reports duplicates', () => {
    const first = record('one', 'deel', '@alex', '1978809723727012176')
    expect(validateDataset([first]).valid).toBe(true)
    expect(validateDataset([first, { ...first, id: 'two' }]).duplicateCount).toBe(1)
    expect(validateDataset([{ ...first, sourceUrl: 'not-a-url' }]).valid).toBe(false)
    expect(validateDataset([{ ...first, metrics: { ...first.metrics, views: -1 } }]).valid).toBe(false)
    expect(validateDataset([{ ...first, sourceUrl: `https://x.com/other/status/${first.postId}` }]).valid).toBe(false)
  })

  it('decodes the X identifier timestamp and calculates relative sequence', () => {
    expect(timestampFromXPostId('1978809723727012176')).toBe('2025-10-16T13:06:17.300Z')
    const normalized = normalizePosts([record('one', 'deel', '@alex', '1978809723727012176'), record('two', 'deel', '@alex', '1978809726256214465')])
    expect(normalized[0].relativeMinutesFromFirstPost).toBe(0)
    expect(normalized[1].timestamp > normalized[0].timestamp).toBe(true)
    expect(normalized[0].waveId).toBe(1)
  })

  it('starts a new wave after the transparent 45-minute threshold', () => {
    const firstId = 1978809723727012176n
    const fortySixMinutesLater = (firstId + 46n * 60n * 1000n * 4194304n).toString()
    const normalized = normalizePosts([record('one', 'deel', '@alex', firstId.toString()), record('two', 'deel', '@alex', fortySixMinutesLater)])
    expect(normalized[1].relativeMinutesFromFirstPost).toBe(46)
    expect(normalized[1].waveId).toBe(2)
  })

  it('keeps an exact 45-minute gap in the same wave', () => {
    const firstId = 1978809723727012176n
    const exactlyFortyFiveMinutesLater = (firstId + 45n * 60n * 1000n * 4194304n).toString()
    const normalized = normalizePosts([record('one', 'deel', '@alex', firstId.toString()), record('two', 'deel', '@alex', exactlyFortyFiveMinutesLater)])
    expect(normalized[1].relativeSecondsFromFirstPost).toBe(2700)
    expect(normalized[1].waveId).toBe(1)
  })

  it('deduplicates canonical source URLs', () => {
    const first = record('one', 'deel', '@alex', '1978809723727012176')
    expect(deduplicatePosts([first, { ...first, id: 'two', sourceUrl: `${first.sourceUrl}/photo/1` }])).toHaveLength(1)
  })

  it('calculates creator recurrence and overlap', () => {
    const records = normalizePosts([record('one', 'deel', '@alex', '1978809723727012176'), record('two', 'airwallex', '@Alex', '1998015620072587516'), record('three', 'gamma', '@grant', '1987880600661889356')])
    expect(calculateCreatorFrequency(records).find((creator) => creator.handle === '@alex')?.launchCount).toBe(2)
    expect(calculateCreatorOverlap(records).find((cell) => cell.left === 'deel' && cell.right === 'airwallex')?.jaccard).toBe(1)
  })

  it('generates only source-backed cross-launch claim candidates', () => {
    const deelRoot = '1978809723727012176'
    const airwallexRoot = '1998015620072587516'
    const deelRecords = Array.from({ length: 12 }, (_, index) => ({ ...record(`d${index}`, 'deel', '@alex', (BigInt(deelRoot) + BigInt(index) * 4194304n).toString()), rootPostId: deelRoot, contentFormat: index === 0 ? 'thread_root' as const : 'thread_continuation' as const }))
    const airwallexRecords = Array.from({ length: 12 }, (_, index) => ({ ...record(`a${index}`, 'airwallex', '@jack', (BigInt(airwallexRoot) + BigInt(index) * 4194304n).toString()), rootPostId: airwallexRoot, contentFormat: index === 0 ? 'thread_root' as const : 'thread_continuation' as const }))
    const records = normalizePosts(deelRecords.concat(airwallexRecords))
    expect(generateInsightCandidates(records)[0]?.evidenceStrength).toBe('moderate')
    expect(generateInsightCandidates(records.map((item, index) => index === 1 ? { ...item, rootPostId: item.postId } : item))).toEqual([])
  })

  it('assigns evidence strength from documented launch and record thresholds', () => {
    expect(assignEvidenceStrength(3, 12)).toBe('strong')
    expect(assignEvidenceStrength(2, 8)).toBe('moderate')
    expect(assignEvidenceStrength(1, 20)).toBe('exploratory')
  })

  it('excludes missing engagement and narrative values from calculations', () => {
    const first = { ...record('one', 'deel', '@alex', '1978809723727012176'), metrics: { views: 100, likes: 10, replies: null, reposts: null } }
    const second = { ...record('two', 'airwallex', '@jack', '1998015620072587516'), narrativeAngle: null }
    const normalized = normalizePosts([first, second])
    expect(calculateEngagementConcentration(normalized)).toMatchObject({ eligibleRecordCount: 1, totalObservedViews: 100, topRecordViewShare: 1 })
    expect(calculateNarrativeDistribution(normalized)).toEqual([{ launch: 'deel', angle: 'founder_story', count: 1 }])
  })
})
