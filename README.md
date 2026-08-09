# CityPulse Frontend

Public event-discovery web app for Paris, built over the CityPulse Catalog
Service. React + TypeScript + Vite, no authentication, no accounts.

Implements [`CityPulse_Frontend_PRD.md`](./CityPulse_Frontend_PRD.md).

---

## Quick start

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

The dev server proxies `/api` to `http://localhost:8081` (the Catalog Service's
`dev` profile port), so no CORS configuration is needed locally. Point it
elsewhere with `VITE_DEV_API_PROXY_TARGET`.

## Scripts

| Command                 | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Vite dev server on :5173 with the `/api` proxy                   |
| `npm run typecheck`     | TypeScript strict-mode project check                             |
| `npm run lint`          | ESLint                                                           |
| `npm run format:check`  | Prettier verification                                            |
| `npm run test`          | Vitest — unit, component and MSW integration tests               |
| `npm run test:coverage` | Vitest with V8 coverage                                          |
| `npm run test:e2e`      | Playwright against a production build (Chromium + iPhone WebKit) |
| `npm run build`         | Type-check then production build                                 |
| `npm run preview`       | Serve the production build                                       |

`npm run test:e2e` needs browsers once: `npx playwright install chromium webkit`.

## Environment

| Variable                    | Required      | Notes                                                                                              |
| --------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`         | In production | Base URL of the API Gateway. Empty or `/` means same origin, which is what the dev proxy relies on |
| `VITE_DEV_API_PROXY_TARGET` | No            | Dev-only proxy target. Defaults to `http://localhost:8081`                                         |
| `VITE_MAP_TILE_URL`         | Yes           | Tile template; must contain `{z}`, `{x}`, `{y}`                                                    |
| `VITE_MAP_ATTRIBUTION`      | Yes           | Attribution string rendered on the map                                                             |

Configuration is validated at startup (`src/shared/config/env.ts`). Outside
production an invalid configuration throws a developer-readable error; in
production it logs and falls back rather than white-screening.

> **Before deploying:** `.env.example` points at the public OpenStreetMap tile
> endpoint, which is **not** a production CDN. Replace both map variables with a
> provider you are entitled to use (PRD FR-MAP-006).

---

## Architecture

```text
src/
├── app/          App shell, router, providers, query client
├── components/ui Copied shadcn/ui primitives (see docs/ui-component-sources.md)
├── features/
│   ├── event-search/  URL filter contract, filter UI
│   ├── event-list/    Cards, cursor pagination, empty state
│   ├── event-map/     Lazy Leaflet map, progressive markers
│   └── event-detail/  Full-page detail
├── pages/        Route components
├── shared/       API client, config, formatters, hooks, utils
├── styles/       Design tokens + global CSS
└── test/         Fixtures, MSW handlers, render helpers
```

### State ownership

| State                  | Owner                                 |
| ---------------------- | ------------------------------------- |
| Shareable search state | URL search params (`useEventFilters`) |
| Remote data            | TanStack Query                        |
| Ephemeral UI state     | Local React state                     |
| Preferred mobile view  | `localStorage` (non-semantic)         |
| Authentication         | None — and none may be added in MVP   |

Filter state is never duplicated into Context or a global store. There is no
Redux and no Zustand.

### Key invariants

- **URL is truth.** Any filtered search is reproducible by copying the address
  bar. Cursors, marker selection and sheet state never appear in the URL.
- **List and map are independently paginated** but always receive the same
  semantic filter object. Loading more cards never advances the map cursor.
- **The map never auto-crawls.** Marker pages advance only on an explicit
  "Load more markers" press.
- **No geographic bounds are sent** in V1 (PRD §22.1 reserves them).
- **Missing data is stated, never guessed.** "Price not specified" is never
  rendered as "Free"; absent accessibility data is never rendered as
  "not accessible".
- **External text is plain text.** `dangerouslySetInnerHTML` is banned by an
  ESLint rule; external URLs are protocol-checked before becoming links.
- **`fetch` is confined to `src/shared/api/`**, also enforced by ESLint.

---

## Performance

The discovery route ships without Leaflet or the detail bundle. Production
chunks:

| Chunk                  |   gzip | Loaded                      |
| ---------------------- | -----: | --------------------------- |
| `index` (app code)     | ~80 kB | Always                      |
| `react-vendor`         | ~61 kB | Always                      |
| `router-vendor`        | ~14 kB | Always                      |
| `query-vendor`         | ~10 kB | Always                      |
| `map-vendor` (Leaflet) | ~45 kB | First time the map is shown |
| `EventMap`             |  ~3 kB | First time the map is shown |
| `EventDetailPage`      |  ~7 kB | First detail navigation     |

`e2e/mobile.spec.ts` asserts that `map-vendor` is not requested on a list-first
load.

**Not yet measured:** Lighthouse scores and field Web Vitals (PRD §14.1) require
a deployed environment and representative API latency. The structural
requirements they depend on — code splitting, debounced search, request
cancellation, cached categories, stable skeleton dimensions, user-controlled
pagination — are all implemented and covered by tests.

---

## Accessibility

Targets WCAG 2.2 AA. Implemented: skip link, one `h1` per page, semantic
landmarks, results as a real list, links for navigation and buttons for actions,
accessible names on icon-only controls, polite result announcements, visible
focus rings, focus moved to the heading on route change, focus returned to the
trigger on sheet close, and `prefers-reduced-motion` support.

The list is the canonical accessible alternative to the map; no information or
action exists only inside a marker popup.

One upstream accessibility bug was found and fixed during implementation — Vaul's
drawer does not move focus into itself by default, which let Tab escape to the
page behind the open filter sheet. See `docs/ui-component-sources.md`.

**Not yet done:** a manual screen-reader pass (VoiceOver/NVDA) and an automated
axe audit. Keyboard flows are covered by Playwright.

---

## Known limitations

- **No social-crawler previews.** This is a pure SPA, so link unfurls will show
  the static `index.html` metadata rather than per-event titles (PRD
  FR-DETAIL-009 accepts this for MVP). Document title, description and canonical
  link are still set client-side. SSR or prerendering would be needed to fix it.
- **The Catalog Service has no CORS configuration and this repository has no API
  Gateway.** See [`docs/api-contract-notes.md`](./docs/api-contract-notes.md)
  §3 before deploying.
- **The OpenAPI contract is still inaccurate** in the ways listed in PRD §10.1.
  The frontend uses hand-authored adapter DTOs isolated in `src/shared/api/`;
  the migration path to generated types is documented in the same file.
- **A Content Security Policy is not configured here.** It belongs at the
  hosting/gateway layer (PRD §15); restrict `connect-src` to the gateway and
  `img-src` to the tile provider.

## Further reading

- [`docs/ui-component-sources.md`](./docs/ui-component-sources.md) — every copied
  UI primitive, its origin, and each local modification
- [`docs/api-contract-notes.md`](./docs/api-contract-notes.md) — verified API
  contract, PRD contradictions, and the generated-types migration path
