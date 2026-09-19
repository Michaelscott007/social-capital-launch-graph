import { MIN_RECORDS_PER_QUALIFIED_LAUNCH } from './analysis'
import type { EvidenceClaim, NormalizedRecord } from './types'

export function assignEvidenceStrength(launchCount: number, supportingRecordCount: number): EvidenceClaim['evidenceStrength'] {
  if (launchCount >= 3 && supportingRecordCount >= 12) return 'strong'
  if (launchCount >= 2 && supportingRecordCount >= 8) return 'moderate'
  return 'exploratory'
}

export function generateInsightCandidates(records: NormalizedRecord[]): EvidenceClaim[] {
  const byLaunch = new Map<NormalizedRecord['launch'], NormalizedRecord[]>()
  for (const record of records) {
    const launchRecords = byLaunch.get(record.launch) ?? []
    launchRecords.push(record)
    byLaunch.set(record.launch, launchRecords)
  }
  const qualified = [...byLaunch.entries()].filter(([, launchRecords]) => launchRecords.length >= MIN_RECORDS_PER_QUALIFIED_LAUNCH)
  const founderThreads = qualified.filter(([, launchRecords]) => {
    const root = launchRecords[0]
    return root.contentFormat === 'thread_root'
      && root.narrativeAngle === 'founder_story'
      && launchRecords.every((record) => record.handle.toLowerCase() === root.handle.toLowerCase())
      && launchRecords.every((record) => record.rootPostId === root.postId)
      && launchRecords.slice(1).every((record) => record.contentFormat === 'thread_continuation')
  })
  if (founderThreads.length < 2) return []
  const support = founderThreads.flatMap(([, launchRecords]) => launchRecords.map((record) => record.id))
  return [{
    claimId: 'serialized-founder-seed', type: 'pattern', evidenceStrength: assignEvidenceStrength(founderThreads.length, support.length),
    claim: 'Both long-form launch samples use the founder’s account as a serialized narrative surface.',
    observed: `${founderThreads.length} launches clear the ${MIN_RECORDS_PER_QUALIFIED_LAUNCH}-record thread-length threshold. Each begins with a founder-authored story and continues as a same-author X thread (${support.length} verified records total).`,
    interpretation: 'Within the two complete threads in this public sample, the launch asset is structured as a founder narrative rather than a standalone company announcement.',
    supportingRecordIds: support, metrics: { qualifiedLaunches: founderThreads.length, supportingRecords: support.length },
    limitations: ['This sample observes seed-thread structure, not downstream distribution.', 'Two qualifying launches support a repeated format, not a general operating protocol.', 'Public traces cannot establish private coordination or causality.', `Gamma and Cartesia remain below the ${MIN_RECORDS_PER_QUALIFIED_LAUNCH}-record coverage threshold.`],
  }]
}
