# Social Capital Launch Graph

## Question

How does Social Capital appear to engineer distribution around launches, based only on visible public X activity?

## Dataset

43 verified public X records across four Social Capital-associated launch candidates: Gamma, Deel, Cartesia, and Airwallex. The records were collected on 19 September 2026 from public X URLs surfaced through the corresponding Social Capital work pages.

Deel (21 records) and Airwallex (15) meet the study’s 12-record cross-launch coverage gate. Gamma (3) and Cartesia (4) remain visible as contextual candidates and do not power the cross-launch conclusion.

## Method

Raw source records live in `data/raw/records.ts`; `npm run analyze` validates provenance and cross-field consistency, rejects duplicates, decodes X Snowflake timestamps, detects 45-minute posting waves, calculates creator overlap and eligible engagement concentration, and regenerates `data/normalized/records.json` and `data/derived/analysis.json`.

The primary result is deliberately moderate: both long-form launch samples use the founder’s account as a serialized narrative surface. This supports a content-format observation across two threads, not a claim of private coordination or downstream distribution.

## Interactive evidence

The Launch Pulse maps every selected record to its exact elapsed time from the launch seed at one-minute, 45-minute, and seven-day scales. Selecting a mark exposes its public source and evidence status. The Claim Lab lets a reviewer remove launches from the analytical scope and immediately recomputes the supported wording, complete-launch count, record count, and deterministic evidence strength. Neither interaction changes the underlying immutable records.

## Limitations

Public visibility is incomplete. Posts may be deleted, metrics change, and current public access does not prove campaign attribution, paid promotion, creator reuse, or causality. Continuation posts preserve a source URL and chronology even when their full text was not transcribed; those records remain explicitly unclassified. Engagement calculations use only the four root posts with captured view counts.

## Stack

Vite, React, TypeScript, Zod, and Vitest. The application is static, uses CSS for restrained interaction feedback, and has no runtime API or database.

## Run locally

```bash
npm install
npm run analyze
npm run dev
```

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Two-minute walkthrough

1. Start with the moderate finding, its 43-record scope, and the two launches that clear the coverage gate.
2. Use the Launch Pulse to show that every dot is a verified source record with an exact relative time.
3. Open the Claim Lab and remove Airwallex to show the result weaken to exploratory.
4. Open the evidence ledger and trace a selected record back to its public X URL.
5. Close with the three cautious questions in “What this suggests to test next.”

## Submission handoff

Before sharing, add your name, role, repository, and portfolio link to the footer in `src/App.tsx`. The application intentionally does not infer personal identity or contact information.

## Deploy

Run `npm run build` and deploy the generated `dist/` directory to any static host, including Vercel, Netlify, or GitHub Pages.

## License

[MIT](LICENSE)
