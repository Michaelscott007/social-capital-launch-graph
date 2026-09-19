import { launchIds, type LaunchId, type NarrativeAngle, type NormalizedRecord, type RawRecord } from './types'

export const WAVE_GAP_MINUTES = 45
export const MIN_RECORDS_PER_QUALIFIED_LAUNCH = 12
const X_EPOCH = 1288834974657n

export function timestampFromXPostId(postId: string): string {
  if (!/^\d+$/.test(postId)) throw new Error(`Invalid X post id: ${postId}`)
  const milliseconds = Number((BigInt(postId) >> 22n) + X_EPOCH)
  const timestamp = new Date(milliseconds)
  if (Number.isNaN(timestamp.getTime())) throw new Error(`X post id does not contain a valid timestamp: ${postId}`)
  return timestamp.toISOString()
}

export function deduplicatePosts(records: RawRecord[]): RawRecord[] {
  const seen = new Set<string>()
  return records.filter((record) => {
    const key = `${record.platform}:${record.postId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function normalizePosts(records: RawRecord[]): NormalizedRecord[] {
  const grouped = new Map<LaunchId, RawRecord[]>()
  records.filter((record) => record.verificationStatus === 'verified').forEach((record) => {
    const values = grouped.get(record.launch) ?? []
    values.push(record)
    grouped.set(record.launch, values)
  })
  return Array.from(grouped.values()).flatMap((launchRecords) => {
    const ordered = [...launchRecords].sort((a, b) => timestampFromXPostId(a.postId).localeCompare(timestampFromXPostId(b.postId)))
    const first = new Date(timestampFromXPostId(ordered[0].postId)).getTime()
    let waveId = 1
    return ordered.map((record, index) => {
      const timestamp = timestampFromXPostId(record.postId)
      const previous = index > 0 ? new Date(timestampFromXPostId(ordered[index - 1].postId)).getTime() : first
      const current = new Date(timestamp).getTime()
      if (index > 0 && (current - previous) / 60000 > WAVE_GAP_MINUTES) waveId += 1
      const relativeSecondsFromFirstPost = Math.round((current - first) / 1000)
      return { ...record, timestamp, relativeSecondsFromFirstPost, relativeMinutesFromFirstPost: Math.round(relativeSecondsFromFirstPost / 60), waveId, launchSequenceIndex: index + 1 }
    })
  }).sort((left, right) => left.timestamp.localeCompare(right.timestamp) || left.id.localeCompare(right.id))
}

export function calculateCreatorFrequency(records: NormalizedRecord[]) {
  const values = new Map<string, { creator: string; handle: string; launches: Set<LaunchId> }>()
  for (const record of records) {
    const canonicalHandle = record.handle.toLowerCase()
    const current = values.get(canonicalHandle) ?? { creator: record.creator, handle: record.handle, launches: new Set<LaunchId>() }
    current.launches.add(record.launch)
    values.set(canonicalHandle, current)
  }
  return Array.from(values.values(), (value) => ({ handle: value.handle, creator: value.creator, launchCount: value.launches.size, launches: [...value.launches].sort((a, b) => launchIds.indexOf(a) - launchIds.indexOf(b)) }))
}

export function calculateCreatorOverlap(records: NormalizedRecord[]) {
  const launches = launchIds.filter((launch) => records.some((record) => record.launch === launch))
  return launches.flatMap((left, leftIndex) => launches.slice(leftIndex + 1).map((right) => {
    const leftCreators = new Set(records.filter((record) => record.launch === left).map((record) => record.handle.toLowerCase()))
    const rightCreators = new Set(records.filter((record) => record.launch === right).map((record) => record.handle.toLowerCase()))
    const sharedCreators = [...leftCreators].filter((creator) => rightCreators.has(creator))
    const union = new Set([...leftCreators, ...rightCreators]).size
    return { left, right, sharedCreators, jaccard: union === 0 ? 0 : sharedCreators.length / union }
  }))
}

export function calculateNarrativeDistribution(records: NormalizedRecord[]) {
  const counts = new Map<string, number>()
  for (const record of records) if (record.narrativeAngle) counts.set(`${record.launch}:${record.narrativeAngle}`, (counts.get(`${record.launch}:${record.narrativeAngle}`) ?? 0) + 1)
  return Array.from(counts, ([key, count]) => { const [launch, angle] = key.split(':'); return { launch: launch as LaunchId, angle: angle as NarrativeAngle, count } })
}

export function calculateEngagementConcentration(records: NormalizedRecord[]) {
  const eligible = records.filter((record) => record.metrics.views !== null)
  if (eligible.length === 0) return { eligibleRecordCount: 0, totalObservedViews: null, topRecordId: null, topRecordViewShare: null }
  const totalObservedViews = eligible.reduce((sum, record) => sum + (record.metrics.views ?? 0), 0)
  const top = [...eligible].sort((left, right) => (right.metrics.views ?? 0) - (left.metrics.views ?? 0))[0]
  return { eligibleRecordCount: eligible.length, totalObservedViews, topRecordId: top.id, topRecordViewShare: totalObservedViews === 0 ? null : (top.metrics.views ?? 0) / totalObservedViews }
}
