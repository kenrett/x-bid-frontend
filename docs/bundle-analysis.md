# Bundle analysis (homepage JS)

This repo uses `rollup-plugin-visualizer` (`template: "raw-data"`) to snapshot bundle composition.

## How to regenerate

- Before: `ANALYZE=true BUNDLE_ANALYZE_OUT=docs/bundle/before.json npm run build`
- After: `ANALYZE=true BUNDLE_ANALYZE_OUT=docs/bundle/after.json npm run build`

## Summary (from `vite build` output)

File hashes vary per build; the numbers below come from the committed snapshots in `docs/bundle/`.

- Before route-splitting: entry JS was `1,114.21 kB` (gzip `329.63 kB`)
- After route-splitting: entry JS is `368.66 kB` (gzip `121.58 kB`)

## Snapshots

- `docs/bundle/before.json`
- `docs/bundle/after.json`
