import type { LaunchId, Metrics, NarrativeAngle, RawRecord } from '../../lib/types'

const collectedAt = '2026-09-19T00:00:00.000Z'
const emptyMetrics: Metrics = { views: null, likes: null, replies: null, reposts: null }

type ThreadInput = {
  launch: LaunchId
  creator: string
  handle: string
  associationSource: string
  ids: string[]
  rootExcerpt: string
  rootMetrics: Metrics
  rootAngle: NarrativeAngle
  continuationNote: string
}

function thread(input: ThreadInput): RawRecord[] {
  return input.ids.map((postId, index) => ({
    id: `${input.launch}-${postId}`,
    launch: input.launch,
    creator: input.creator,
    handle: input.handle,
    platform: 'x',
    postId,
    rootPostId: input.ids[0],
    sourceUrl: `https://x.com/${input.handle.slice(1)}/status/${postId}`,
    observedExcerpt: index === 0 ? input.rootExcerpt : null,
    contentFormat: index === 0 ? 'thread_root' : 'thread_continuation',
    narrativeAngle: index === 0 ? input.rootAngle : null,
    classificationNotes: index === 0 ? 'Root copy was transcribed from the public X record at collection.' : input.continuationNote,
    metrics: index === 0 ? input.rootMetrics : emptyMetrics,
    collectedAt,
    verificationStatus: 'verified',
    associationSource: input.associationSource,
    verificationMethod: 'public_browser_inspection',
  }))
}

const deel = thread({
  launch: 'deel', creator: 'Alex Bouaziz', handle: '@Bouazizalex', associationSource: 'https://www.sociallcapital.com/work/deel',
  ids: ['1978809723727012176','1978809726256214465','1978809728202395675','1978809730031108551','1978809732107219381','1978809734036701678','1978809737106890807','1978809739405385967','1978809741305344322','1978809743184437605','1978809745092882602','1978809747026403747','1978809749891096783','1978809751791100172','1978809753783431327','1978809755758969284','1978809757654773836','1978809759584149884','1978809761823953348','1978809765024104908','1978809767008124979'],
  rootExcerpt: 'Deel has raised $300M at a $17.3B valuation. The story of how we went from $1K to $1B and the advice I’d give to my younger self:',
  rootMetrics: { views: 2900000, likes: 5300, replies: 462, reposts: 661 }, rootAngle: 'founder_story',
  continuationNote: 'A verified continuation in the founder-authored public thread. Narrative classification is intentionally null because its full text is not preserved in this compact raw record.',
})

const airwallex = thread({
  launch: 'airwallex', creator: 'Jack Zhang', handle: '@awxjack', associationSource: 'https://www.sociallcapital.com/work/airwallex',
  ids: ['1998015620072587516','1998015632550621636','1998015644424671438','1998015663269663102','1998015681380642866','1998015694726975523','1998015711529316833','1998015724103835919','1998015736191864965','1998015748049125419','1998015764184596887','1998015783126081575','1998015796019339732','1998015812880474437','1998015829469004155'],
  rootExcerpt: 'Stripe offered to acquire us for $1.2 billion when we had $2M in revenue. Today, we’ve raised $330M at an $8B valuation and reached $1B ARR. We could’ve died three times during this journey.',
  rootMetrics: { views: 46900000, likes: 29000, replies: 1500, reposts: 1900 }, rootAngle: 'founder_story',
  continuationNote: 'A verified continuation in the founder-authored public thread. Narrative classification is intentionally null because its full text is not preserved in this compact raw record.',
})

const gamma = thread({
  launch: 'gamma', creator: 'Grant Lee', handle: '@thisisgrantlee', associationSource: 'https://www.sociallcapital.com/work/gamma',
  ids: ['1987880600661889356','1987887900109799599','1987895265303355567'],
  rootExcerpt: 'Gamma is announcing a Series B at a $2.1B valuation, $100M ARR, an API release, and a prompt guide for successful users.',
  rootMetrics: { views: 4400000, likes: 2700, replies: 403, reposts: 306 }, rootAngle: 'launch_announcement',
  continuationNote: 'Verified related public record visible from the seed post. Narrative classification is null; this candidate is also below the cross-launch coverage threshold.',
})

const cartesia = thread({
  launch: 'cartesia', creator: 'Karan Goel', handle: '@krandiash', associationSource: 'https://www.sociallcapital.com/work/cartesia',
  ids: ['1983202316397453676','1983202398937223249','1983202531749900716','1984428438363795910'],
  rootExcerpt: 'Cartesia has raised $100M and is introducing Sonic-3, a realtime conversation model. The launch also offers a voice-agent guide and free credits.',
  rootMetrics: { views: 4800000, likes: 8400, replies: 1400, reposts: 1200 }, rootAngle: 'technical_breakthrough',
  continuationNote: 'Verified related public record visible from the seed post. Narrative classification is null; this candidate is also below the cross-launch coverage threshold.',
})

export const rawRecords: RawRecord[] = [...gamma, ...deel, ...cartesia, ...airwallex]
