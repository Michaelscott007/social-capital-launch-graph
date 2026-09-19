export const launchIds = ['gamma', 'deel', 'cartesia', 'airwallex'] as const
export type LaunchId = (typeof launchIds)[number]

export const narrativeAngles = [
  'product_demo',
  'launch_announcement',
  'workflow_improvement',
  'founder_story',
  'personal_recommendation',
  'technical_breakthrough',
  'social_proof',
  'use_case_story',
] as const
export type NarrativeAngle = (typeof narrativeAngles)[number]

export type Metrics = { views: number | null; likes: number | null; replies: number | null; reposts: number | null }
export type VerificationStatus = 'verified' | 'excluded' | 'unverified'

export type RawRecord = {
  id: string
  launch: LaunchId
  creator: string
  handle: string
  platform: 'x'
  postId: string
  rootPostId: string
  sourceUrl: string
  observedExcerpt: string | null
  contentFormat: 'thread_root' | 'thread_continuation' | 'single_post'
  narrativeAngle: NarrativeAngle | null
  classificationNotes: string
  metrics: Metrics
  collectedAt: string
  verificationStatus: VerificationStatus
  associationSource: string
  verificationMethod: 'public_browser_inspection'
}

export type NormalizedRecord = RawRecord & {
  timestamp: string
  relativeSecondsFromFirstPost: number
  relativeMinutesFromFirstPost: number
  waveId: number
  launchSequenceIndex: number
}

export type LaunchSummary = {
  launch: LaunchId
  company: string
  recordCount: number
  timestampedRecordCount: number
  qualifiedForCrossLaunch: boolean
  firstPostAt: string | null
  waveCount: number
  creatorCount: number
}

export type OverlapCell = { left: LaunchId; right: LaunchId; sharedCreators: string[]; jaccard: number }

export type EvidenceClaim = {
  claimId: string
  type: 'pattern'
  claim: string
  observed: string
  interpretation: string
  evidenceStrength: 'strong' | 'moderate' | 'exploratory'
  supportingRecordIds: string[]
  metrics: Record<string, number>
  limitations: string[]
}

export type AnalysisArtifact = {
  generatedAt: string
  dataset: { totalRecords: number; verifiedRecords: number; timestampedRecords: number; recordsWithEngagement: number; launchesObserved: number; qualifiedLaunches: number; creatorsObserved: number; platforms: string[]; waveGapMinutes: number; minimumRecordsPerQualifiedLaunch: number }
  launches: LaunchSummary[]
  records: NormalizedRecord[]
  creatorFrequency: { handle: string; creator: string; launchCount: number; launches: LaunchId[] }[]
  overlap: OverlapCell[]
  narrativeDistribution: { launch: LaunchId; angle: NarrativeAngle; count: number }[]
  engagement: { eligibleRecordCount: number; totalObservedViews: number | null; topRecordId: string | null; topRecordViewShare: number | null }
  claims: EvidenceClaim[]
  quality: { duplicateRecords: number; excludedRecords: number; missingNarrative: number; missingEngagement: number; notes: string[] }
}
