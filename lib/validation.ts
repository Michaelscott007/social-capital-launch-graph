import { z } from 'zod'
import { launchIds, narrativeAngles, type RawRecord } from './types'

const metricsSchema = z.object({ views: z.number().int().nonnegative().nullable(), likes: z.number().int().nonnegative().nullable(), replies: z.number().int().nonnegative().nullable(), reposts: z.number().int().nonnegative().nullable() })
export const rawRecordSchema = z.object({
  id: z.string().min(1), launch: z.enum(launchIds), creator: z.string().min(1), handle: z.string().regex(/^@/), platform: z.literal('x'),
  postId: z.string().regex(/^\d+$/), rootPostId: z.string().regex(/^\d+$/), sourceUrl: z.string().url(), observedExcerpt: z.string().nullable(),
  contentFormat: z.enum(['thread_root', 'thread_continuation', 'single_post']), narrativeAngle: z.enum(narrativeAngles).nullable(),
  classificationNotes: z.string().min(1), metrics: metricsSchema, collectedAt: z.string().datetime(),
  verificationStatus: z.enum(['verified', 'excluded', 'unverified']), associationSource: z.string().url(), verificationMethod: z.literal('public_browser_inspection'),
}).superRefine((record, context) => {
  if (URL.canParse(record.sourceUrl)) {
    const source = new URL(record.sourceUrl)
    if (source.protocol !== 'https:' || source.hostname !== 'x.com') context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'source must use https://x.com' })
    const expectedPath = `/${record.handle.slice(1)}/status/${record.postId}`.toLowerCase()
    if (source.pathname.toLowerCase() !== expectedPath) context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'source path must match handle and post id exactly' })
  }
  if (URL.canParse(record.associationSource)) {
    const association = new URL(record.associationSource)
    if (association.protocol !== 'https:' || association.hostname !== 'www.sociallcapital.com') context.addIssue({ code: 'custom', path: ['associationSource'], message: 'association source must use the Social Capital work site' })
    if (association.pathname !== `/work/${record.launch}`) context.addIssue({ code: 'custom', path: ['associationSource'], message: 'association path must match the launch' })
  }
  try {
    const milliseconds = Number((BigInt(record.postId) >> 22n) + 1288834974657n)
    if (!Number.isFinite(milliseconds) || Number.isNaN(new Date(milliseconds).getTime())) context.addIssue({ code: 'custom', path: ['postId'], message: 'post id does not decode to a valid timestamp' })
  } catch {
    context.addIssue({ code: 'custom', path: ['postId'], message: 'post id cannot be decoded' })
  }
})

export type DatasetValidation = { valid: boolean; issues: string[]; duplicateCount: number }

export function validateDataset(records: RawRecord[]): DatasetValidation {
  const issues: string[] = []
  const ids = new Set<string>()
  const canonicalUrls = new Set<string>()
  const postIds = new Map<string, RawRecord>()
  let duplicateCount = 0
  for (const record of records) {
    const parsed = rawRecordSchema.safeParse(record)
    if (!parsed.success) issues.push(`${record.id}: ${parsed.error.issues.map((issue) => issue.message).join(', ')}`)
    let duplicated = false
    if (ids.has(record.id)) { duplicated = true; issues.push(`${record.id}: duplicate id`) }
    ids.add(record.id)
    const canonical = record.sourceUrl.toLowerCase().replace(/\/(photo|video)\/\d+$/, '')
    if (canonicalUrls.has(canonical)) { duplicated = true; issues.push(`${record.id}: duplicate source URL`) }
    canonicalUrls.add(canonical)
    const priorPost = postIds.get(record.postId)
    if (priorPost) {
      duplicated = true
      issues.push(`${record.id}: duplicate platform post id${priorPost.launch !== record.launch || priorPost.handle.toLowerCase() !== record.handle.toLowerCase() ? ' with conflicting attribution' : ''}`)
    }
    postIds.set(record.postId, record)
    if (duplicated) duplicateCount += 1
  }
  const recordPostIds = new Set(records.map((record) => record.postId))
  for (const record of records) if (!recordPostIds.has(record.rootPostId)) issues.push(`${record.id}: root post id is not present in the dataset`)
  return { valid: issues.length === 0, issues, duplicateCount }
}
