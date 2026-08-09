# CityPulse Frontend — Product Requirements Document

**Document status:** Implementation-ready  
**Version:** 1.0  
**Date:** 9 August 2026  
**Product:** CityPulse  
**Scope:** Public event-discovery frontend  
**Primary implementation agent:** Claude  
**API contract reviewed:** `citypulse.catalog.service.swagger(1).json` (OpenAPI 3.1.0)

---

## 1. Executive summary

CityPulse is a public web application for discovering events in Paris. It lets visitors search and filter upcoming events, compare results in a list and on a map, open a shareable full-page event detail view, and continue to the official event or booking page.

The frontend will be a React and TypeScript single-page application. On desktop, the discovery page uses a split list/map layout. On mobile, the list is the default and users switch between list and map with a clear toggle. One URL-synchronized filter state drives both representations.

The application has no authentication, user accounts, saved events, reviews, comments, payments, or event creation. The MVP is intentionally focused on fast, accessible event discovery.

The visual direction is modern, simple, and smooth: restrained color, strong typography, generous spacing, subtle elevation, quick micro-interactions, and no decorative motion that impairs usability. UI components must be selected from [21st.dev](https://21st.dev/) as the primary source of truth and copied into the repository in the shadcn registry style. The application owns and may adapt the copied source, but must preserve design consistency and accessibility.

---

## 2. Product vision

### 2.1 Product promise

> Help someone find a relevant event in Paris and understand when, where, and how to attend it in under two minutes.

### 2.2 User questions CityPulse must answer

1. What can I do in Paris during a chosen period?
2. Which events match my interests, price preference, and location?
3. Where is each event relative to the others?
4. When does the event start and are there additional occurrences?
5. Is it free, paid, bookable, and accessible?
6. Where can I find official information or book?

### 2.3 Experience principles

1. **Discovery first:** The user sees useful events and filters immediately; there is no onboarding or sign-in wall.
2. **One search, two views:** List and map always represent the same filter criteria.
3. **URL as truth:** A copied URL recreates the same search or event detail.
4. **Progressive disclosure:** Cards stay concise; full information belongs on the detail page.
5. **Honest data:** Missing price, time, location, or accessibility data is stated clearly and never guessed.
6. **Fast by default:** List content renders without waiting for the heavier map bundle.
7. **Accessible without the map:** Every mappable event remains discoverable from a keyboard-accessible list.
8. **Calm motion:** Animation explains state changes; it is never ornamental noise.

---

## 3. Goals, success criteria, and non-goals

### 3.1 MVP goals

- Build a production-quality public React frontend over the existing Catalog Service.
- Allow event discovery using period, category, price, arrondissement, and text query filters.
- Keep filters reproducible through URL query parameters.
- Present consistent list and map experiences.
- Use cursor pagination with an explicit **Load more** interaction and no total result count.
- Provide a full-page, shareable detail route for every event.
- Handle partial, missing, empty, loading, and error states gracefully.
- Establish a maintainable feature-based architecture suitable for future expansion.
- Use 21st.dev as the authoritative component registry and visual starting point.

### 3.2 Product success criteria

The MVP is successful when:

- A visitor can open the app and view events without an account.
- Every supported filter updates results and the URL correctly.
- Refreshing or sharing a filtered URL reconstructs the same filter state.
- List pagination never duplicates existing cards.
- Desktop shows a usable list/map split at the same time.
- Mobile offers a stable list/map toggle without losing filters or loaded results.
- An event detail URL opens directly and can be shared independently.
- Selecting a list event can identify its marker, and selecting a marker can identify its event card when that event is loaded in both datasets.
- Missing coordinates never create invalid markers or crash the map.
- Backend `ProblemDetail` errors become understandable, actionable UI states.
- Core flows meet WCAG 2.2 AA expectations.
- The production build passes type checking, linting, unit/integration tests, and critical end-to-end tests.

### 3.3 Non-goals for MVP

- Authentication or authorization
- User profiles
- Favourites or saved events
- Personalized recommendations
- Notifications
- Reviews, ratings, or comments
- Event creation or organizer tooling
- Ticket sales or payment processing
- Calendar synchronization
- Journey planning, routing, transit, or weather
- Radius or “near me” search
- Multiple cities
- Multilingual content or runtime locale switching
- Native mobile applications
- Full offline catalog support
- Elasticsearch-style autocomplete
- Geographic bounding-box API queries
- Automatic fetching of every map page

Geographic bounding-box filtering is explicitly reserved for a later API version.

---

## 4. Target users and primary use cases

### 4.1 Primary user groups

#### Paris resident

Wants ideas for today, tomorrow, or the current week. Values fast filtering by category, arrondissement, and price.

#### Visitor to Paris

Needs clear dates, venue and address information, and a map to understand where events are located.

#### Budget-conscious user

Primarily wants free events and needs “price not specified” to remain distinct from “free.”

#### Accessibility-conscious user

Needs available accessibility metadata presented accurately, without treating missing data as a negative claim.

### 4.2 Primary jobs to be done

- “Show me free events in the 11th arrondissement this week.”
- “Show me what is available tomorrow and where it is.”
- “Let me search for jazz and compare locations on a map.”
- “Let me open an event, read the full details, and reach its official or booking page.”
- “Let me send this event or filtered search to another person.”

---

## 5. Information architecture and routes

### 5.1 Route map

| Route | Purpose | Shareable | Notes |
|---|---|---:|---|
| `/` | Event discovery page | Yes | Canonical landing route |
| `/?period=THIS_WEEK&category=Music&pricing=FREE&arrondissement=11&query=jazz` | Reproducible filtered discovery | Yes | Only meaningful filters belong in URL |
| `/events/:eventId` | Full event detail page | Yes | Directly loadable and refresh-safe |
| `*` | Frontend not-found page | No | Offers a return to discovery |

No `/login`, `/saved`, or account-related route may be created in MVP.

### 5.2 URL query contract

Supported URL parameters:

| Parameter | Allowed values | Default | URL behavior |
|---|---|---|---|
| `period` | `TODAY`, `TOMORROW`, `THIS_WEEK`, `THIS_MONTH` | `THIS_WEEK` | Omit when equal to default, or use one consistent canonical policy |
| `category` | Value returned by `/api/v1/categories` | All | Omit for all categories |
| `pricing` | `ALL`, `FREE`, `PAID`, `NOT_SPECIFIED` | `ALL` | Omit when `ALL` |
| `arrondissement` | `1`–`20`, `OUTSIDE_PARIS`, `UNKNOWN` | All | Omit for all locations |
| `query` | Trimmed string, maximum 200 characters | Empty | Omit when empty |

The following are not part of the shareable search URL:

- `cursor`
- Currently selected marker
- Loaded page count
- Filter drawer open/closed state
- Desktop hover state
- Request correlation ID

The mobile list/map preference may be stored in `localStorage`, but it must not alter the meaning of a shared search URL.

### 5.3 URL normalization rules

- Unknown query parameters are ignored, not reflected into application state.
- Invalid known values fall back to the relevant default and are removed on the next canonical URL update.
- Empty and whitespace-only values are treated as absent.
- Category values are case-preserving because they originate from the backend.
- Filter changes reset list and map pagination.
- Browser Back and Forward restore the previous filter state.
- Opening a detail page from discovery includes the current discovery URL in router location state when available.
- The detail page’s “Back to results” action uses saved router state first and `/` as a safe fallback.

---

## 6. Functional requirements

Requirement IDs are stable references for implementation, tests, and review.

### 6.1 Global application shell

#### FR-GLOBAL-001 — Header

The application must provide a compact header containing:

- CityPulse brand/wordmark linked to `/`
- A concise product descriptor such as “Events in Paris” where space permits
- No authentication, profile, saved, or notification controls

On discovery, the header should not consume excessive vertical space. On event detail, it provides a reliable path back to discovery.

#### FR-GLOBAL-002 — Responsive layout

- Desktop breakpoint: split list/map layout.
- Tablet behavior: split layout may use a narrower map or transition to toggle based on actual usable width.
- Mobile: one primary view at a time with a list/map segmented toggle.
- No horizontal page scrolling at supported viewport sizes.

#### FR-GLOBAL-003 — Network status

When the browser becomes offline:

- Show a non-blocking offline banner.
- Keep already rendered data visible.
- Disable or safely fail actions requiring new network data.
- Provide Retry once connectivity returns.

### 6.2 Discovery filters

#### FR-FILTER-001 — Period

Provide a single-select period control for:

- Today
- Tomorrow
- This week
- This month

The UI label is localized for users; the API and URL retain enum values.

#### FR-FILTER-002 — Category

- Populate categories from `GET /api/v1/categories`.
- Provide an “All categories” option.
- Only one category is selected in MVP because the API accepts one value.
- Categories should be cached for a long duration.
- If categories fail to load, the rest of discovery remains usable and a retry is available within the category control.

#### FR-FILTER-003 — Pricing

Provide:

- All prices
- Free
- Paid
- Price not specified

“Price not specified” must never be displayed as “Free.”

#### FR-FILTER-004 — Arrondissement

Provide:

- All locations
- 1st through 20th arrondissement
- Outside Paris
- Location unknown

Use readable ordinal labels appropriate to the chosen UI language, while sending `1`–`20`, `OUTSIDE_PARIS`, or `UNKNOWN` to the API.

#### FR-FILTER-005 — Text search

- Search input supports at most 200 characters.
- Trim leading and trailing whitespace before committing to URL/API state.
- Debounce API requests by 350 ms after input changes.
- Enter commits immediately.
- Clearing the field updates the URL and resets pagination.
- Escape may clear the field when focused if this behavior is clearly discoverable and does not conflict with accessibility.

#### FR-FILTER-006 — Active filter chips

- Show active non-default filters as removable chips.
- Removing a chip updates the URL and both datasets.
- Provide “Clear all” when at least two non-default filters are active.
- Changing one filter must not silently reset unrelated filters.

#### FR-FILTER-007 — Mobile filter sheet

- On mobile, secondary filters open in a bottom sheet/drawer.
- The sheet traps focus correctly and returns focus to the trigger when closed.
- Applied filters survive closing the sheet.
- The preferred interaction is immediate application; if an Apply button is chosen from a 21st.dev component pattern, pending versus applied state must be unambiguous.
- The filter trigger displays the active filter count.

### 6.3 Event list

#### FR-LIST-001 — Initial results

- Request `GET /api/v1/events` using normalized filters.
- Use `sort=START_DATE`.
- Recommended list page size: `limit=20`.
- Render events in backend order; do not resort client-side.

#### FR-LIST-002 — Event card content

Each card displays, when present:

- Title
- Short summary
- Start date/time
- End date/time when meaningful
- Venue name
- Arrondissement or location classification
- Category badges
- Pricing category badge
- Clear affordance to open the detail page

The card must not invent image placeholders because the API has no image field. Use typography, spacing, category badges, and restrained accents instead.

Accessibility details are not part of the supplied summary response and therefore must not be shown on list cards unless the backend adds them to that DTO.

#### FR-LIST-003 — Date labels

- Interpret API timestamps as offset-aware date-times.
- Display in the `Europe/Paris` timezone.
- Use `Intl.DateTimeFormat`; do not manually add or subtract timezone offsets.
- Handle daylight-saving transitions correctly.
- Never invent an exact time when it is absent.
- Use concise human-readable labels while exposing an exact accessible date/time.

#### FR-LIST-004 — Load more

- If `hasNext` is true and `nextCursor` is present, show **Load more**.
- Clicking it fetches the next cursor page and appends unique events.
- Show a compact loading indicator inside or beside the button.
- Keep existing cards interactive while loading.
- Do not display a total result count.
- Do not implement numbered pagination.
- Do not put the cursor into the browser URL.
- If a next-page request fails, keep current cards and show an inline retry action.
- Deduplicate appended items by event `id` defensively.

#### FR-LIST-005 — Filter transition

- A semantic filter change starts a new query and resets cursor pages.
- The old content may remain dimmed during a short background transition only if it is clearly marked as updating.
- The UI must never present old results as final results for the new filters.
- Scroll the result panel to the top after a committed filter change, unless preserving position is demonstrably less disruptive on mobile.

#### FR-LIST-006 — Empty state

When no list events match:

- State that no events were found.
- Show active filter context.
- Offer relevant actions: clear text query, broaden period, select all prices, remove location, or clear all.
- Do not call this an error.

### 6.4 Map

#### FR-MAP-001 — Data source

- Request `GET /api/v1/events/map` with the same semantic filters as the list.
- Recommended map page size: `limit=100`.
- Only map response items with finite latitude and longitude values.
- Do not derive markers from list responses.

#### FR-MAP-002 — Progressive markers

V1 uses progressive map pagination:

- Load the first marker page for the current filters.
- If `hasNext` is true, expose a deliberate **Load more markers** action in the map UI.
- Each action requests the returned `nextCursor` and appends unique markers.
- Do not automatically crawl all pages in the background.
- The UI should communicate “showing loaded events” without claiming the map is exhaustive.
- A map page failure preserves existing markers and offers retry.
- A filter change clears accumulated markers and restarts from page one.

#### FR-MAP-003 — Map viewport

- Default center: Paris.
- Provide sensible default zoom for city-level discovery.
- Provide zoom controls and a “Recenter on Paris” action.
- Panning or zooming must not alter search filters in V1.
- Do not request geographic bounds from the backend in V1.
- Do not implement “Search this area” until bounding-box API support exists.

#### FR-MAP-004 — Marker interaction

- Selecting a marker visually distinguishes it.
- Open a compact popup or preview card with title, date, category, price, and “View details.”
- When the same event is loaded in the list, marker selection scrolls or focuses the corresponding card without causing a full-page jump on desktop.
- Hovering/focusing a list card may emphasize the matching marker.
- Cross-highlighting is best effort because list and map use independently paginated endpoints.
- If a counterpart is not loaded, no error is shown.

#### FR-MAP-005 — Marker density

- Do not add clustering by default.
- Validate real marker volume and rendering performance first.
- If clustering becomes necessary, add it behind the map feature boundary without changing API contracts.

#### FR-MAP-006 — Tiles and attribution

- Use Leaflet through React Leaflet.
- Use an appropriate production tile provider and follow its terms.
- Display required map attribution.
- Do not treat the public OpenStreetMap tile endpoint as an unlimited production CDN.
- Keep the tile URL and attribution configurable through environment variables.

#### FR-MAP-007 — Geolocation

- Geolocation is optional and not required for MVP acceptance.
- If implemented, request permission only after an explicit user action.
- A denial must not block discovery.
- User location is not sent to the Catalog API in V1.

#### FR-MAP-008 — No-coordinate and map error states

- If list events exist but no markers are returned, explain that matching events do not have map coordinates and preserve access to the list.
- If tiles fail but marker data succeeds, show a map-specific failure state; do not replace the event list with a global error.
- On mobile, offer a direct switch back to the list.

### 6.5 Desktop list/map synchronization

#### FR-SYNC-001

Desktop discovery uses one filter bar and two independently fetched, consistently filtered datasets.

#### FR-SYNC-002

List “Load more” and map “Load more markers” are independent. Loading more list cards does not implicitly advance the map cursor, and vice versa.

#### FR-SYNC-003

The UI must not imply that the currently loaded list page and marker page contain identical IDs. The endpoints have different page sizes and omit unmappable events from the map.

#### FR-SYNC-004

When filters change, both list and map queries receive the same normalized filter object in the same render cycle.

### 6.6 Mobile list/map toggle

#### FR-MOBILE-001

- Default to List on first visit.
- Provide a clearly labelled segmented control: **List** / **Map**.
- Switching views preserves filters, loaded query cache, and selected event where practical.
- Lazy-load the map bundle only when Map is first opened.
- Persist the last chosen view locally as a non-semantic preference.
- Never hide a list-only empty/error message behind the map state.

### 6.7 Event detail page

#### FR-DETAIL-001 — Route and loading

- Route: `/events/:eventId`.
- Fetch `GET /api/v1/events/{eventId}`.
- The route is full page, refresh-safe, deep-linkable, and shareable.
- Lazy-load the route bundle.
- Initial load uses a detail skeleton that approximates final layout.

#### FR-DETAIL-002 — Content hierarchy

Display:

1. Back to results/discovery
2. Categories
3. Event title
4. Primary date and time
5. Venue and full address
6. Price/access information
7. Main actions
8. Full description
9. Additional occurrences
10. Accessibility information
11. Mini-map when valid coordinates exist

The exact order may adapt responsively, but title, date, venue, and primary action remain above the fold where feasible.

#### FR-DETAIL-003 — Actions

- **Book / Reserve:** use `pricing.bookingUrl` when valid and available. Label with `bookingLinkText` when usable; otherwise use a safe fallback such as “Book.”
- **Official website:** use `officialUrl` when valid and available.
- **Open in Maps:** construct a provider-neutral map search link from valid coordinates or the complete address.
- External links open safely with `rel="noopener noreferrer"` when using a new tab.
- Do not render an unavailable action as an enabled control.

#### FR-DETAIL-004 — Pricing

- Preserve the backend’s price type and detail.
- Distinguish free, paid, and unspecified.
- Show access type when present.
- Do not calculate or normalize prices beyond display-safe formatting.

#### FR-DETAIL-005 — Occurrences

- Display occurrences in the order supplied by the API, which is expected to be chronological.
- If many occurrences exist, show an accessible collapsible section or progressive reveal.
- Do not merge or remove occurrences based only on visually similar timestamps.
- If no occurrences exist, do not show an empty section.

#### FR-DETAIL-006 — Accessibility

- Show only affirmative or explicitly described accessibility information.
- A `false` value may be shown as “not indicated as accessible” only if product wording is carefully chosen; it must not become an unsupported claim that access is impossible.
- Missing data is labelled “Accessibility information not provided,” not “Not accessible.”
- Sign-language and mental-accessibility text are displayed as supplied after safe rendering.

#### FR-DETAIL-007 — Description safety

- Render description as plain text by default.
- Preserve readable paragraphs and line breaks.
- Do not use `dangerouslySetInnerHTML` unless the backend explicitly guarantees sanitized HTML and the contract is updated.
- External text must never execute scripts.

#### FR-DETAIL-008 — Not found

For `404 EVENT_NOT_FOUND`:

- Render a dedicated “Event unavailable” page.
- Explain that the event may have been removed or the link may be invalid.
- Offer Back to results and Browse all events.
- Do not automatically retry a 404.

#### FR-DETAIL-009 — Shareability and metadata

- The browser title includes the event title when loaded.
- Add a useful meta description from the event description.
- Canonical path is `/events/:eventId`.
- A pure SPA cannot guarantee rich social crawler previews. This limitation is accepted for MVP and must be documented; SSR or prerendering may be added later.
- Provide a native Share action only if it has a graceful copy-link fallback; it is optional for MVP because the URL itself is shareable.

---

## 7. Visual and interaction design specification

### 7.1 Design direction

Keywords:

- Modern
- Simple
- Smooth
- Urban
- Useful
- Calm
- Trustworthy

Avoid:

- Glassmorphism that reduces contrast
- Excessive gradients
- Large marketing hero sections above the results
- Image-first cards with fake placeholders
- Bouncy or slow animations
- Dense dashboard aesthetics
- Competing component styles from many authors

### 7.2 21st.dev component policy

[21st.dev](https://21st.dev/) is a registry of React/Tailwind components, not a conventional runtime dependency. Components are copied into the codebase and then owned by the project. It supports shadcn registry installation and Claude-oriented prompts.

Implementation rules:

1. Use 21st.dev as the first and primary source for visible UI primitives and interaction patterns.
2. Prefer one coherent component family—recommended baseline: the [shadcn/ui library on 21st.dev](https://21st.dev/@shadcn/library/shadcn-ui)—before mixing authors.
3. Preview a component’s desktop, mobile, focus, loading, and disabled behavior before choosing it.
4. Prefer components installable through a shadcn registry URL.
5. Copy component code into `src/components/ui`; do not create a fake `21st.dev` npm dependency.
6. Record the original 21st.dev page or registry URL and local modifications in `docs/ui-component-sources.md`.
7. Normalize imported components to CityPulse design tokens before use.
8. Remove unused demo code, sample data, remote images, analytics, and unrelated dependencies.
9. Audit copied components for keyboard access, focus management, reduced motion, semantic HTML, and bundle cost.
10. If no suitable feature-level component exists, compose a custom CityPulse feature from 21st.dev primitives. Custom business components are allowed; recreating basic buttons, sheets, badges, skeletons, tooltips, and controls from scratch is not the default.

Example registry installation pattern from 21st.dev documentation:

```bash
npx shadcn@latest add "https://21st.dev/r/author/component-name"
```

Claude may use a 21st.dev copy prompt or MCP integration if available, but every selected component must still be committed locally and documented.

### 7.3 Required component inventory

| Need | Preferred 21st.dev primitive/pattern | CityPulse use |
|---|---|---|
| Buttons | Button / icon button | Filter actions, retry, load more, external actions |
| Inputs | Search input / command-style input | Text search |
| Selectors | Select, popover, combobox | Category, price, arrondissement |
| Period control | Tabs or segmented control | Today/tomorrow/week/month |
| Mobile filters | Drawer or sheet | Filter panel |
| Mobile view switch | Segmented control or tabs | List/map |
| Data labels | Badge / chip | Categories, price, active filters |
| Event presentation | Card/list item | Event summaries |
| Async states | Skeleton, spinner/progress | Initial and incremental loading |
| Feedback | Alert, toast | Offline, transient errors, copied link |
| Details | Accordion/collapsible | Long occurrence list or secondary metadata |
| Floating action | Compact toolbar/button | Recenter map, load more markers |
| Tooltip | Tooltip | Icon-only controls |

The map itself, Leaflet controls, and marker popup integration are feature-specific and need not originate from 21st.dev.

### 7.4 Design tokens

Define tokens as CSS custom properties, consumed by Tailwind:

- Background: warm or cool near-white
- Surface: white/near-white
- Text primary: near-black, never pure black where a softer neutral works
- Text secondary: medium neutral with AA contrast
- Border: subtle neutral
- Brand: one saturated urban accent
- Category accents: restrained and consistent
- Success/free: green family
- Warning/unspecified: amber or neutral family
- Error: red family
- Focus ring: high-contrast brand or blue
- Radius: medium, consistent across cards and controls
- Shadow: subtle, used sparingly

Do not hardcode category colors throughout feature components. Centralize category-to-token mapping and provide a neutral fallback.

### 7.5 Typography

- Use one modern sans-serif family with strong readability.
- Prefer a locally bundled or privacy-conscious delivery strategy.
- Body text minimum 16 px on mobile.
- Event titles use a clear hierarchy without excessive size.
- Limit long card titles and summaries visually while retaining accessible full text where appropriate.
- Use tabular numerals only where it improves date/time alignment.

### 7.6 Spacing and density

- Use an 8 px-derived spacing scale.
- Touch targets are at least 44×44 CSS pixels where practical.
- Cards should be compact enough for scanning but not dense.
- Desktop list panel should show meaningful information for multiple events above the fold.
- Filters remain visible or easy to restore while browsing.

### 7.7 Motion

- Typical transitions: 120–220 ms.
- Use opacity, color, and small transforms for state change.
- Avoid layout-shifting entrance animations for every card.
- Marker selection may animate subtly without repeated bouncing.
- Respect `prefers-reduced-motion` and disable non-essential motion.

---

## 8. Technical architecture

### 8.1 Required stack

| Concern | Choice |
|---|---|
| Framework | React with TypeScript |
| Build tool | Vite |
| Routing | React Router |
| Server state | TanStack Query |
| HTTP | Native `fetch` behind a typed client |
| Styling | Tailwind CSS + CSS custom properties |
| Components | 21st.dev registry components, shadcn-compatible baseline |
| Map | Leaflet + React Leaflet |
| Icons | Lucide React, unless selected 21st.dev components require a consistent alternative |
| Dates | Native `Intl.DateTimeFormat` |
| Unit/integration testing | Vitest + React Testing Library + MSW |
| End-to-end testing | Playwright |
| API types | OpenAPI-generated once the documented contract gaps are corrected |
| Quality | TypeScript strict mode, ESLint, Prettier |

Do not add Redux, Zustand, Axios, Moment.js, or a form framework without a concrete requirement that cannot be met cleanly by the selected stack.

### 8.2 Runtime topology

```text
Browser
  → frontend static assets
  → API Gateway
  → Catalog Service
  → PostgreSQL
```

The browser should call the API Gateway base URL, not hardcode the Catalog Service’s local port.

### 8.3 State ownership

| State category | Owner | Examples |
|---|---|---|
| Shareable search state | URL search params | Period, category, price, arrondissement, query |
| Remote/server state | TanStack Query | List pages, map pages, detail, categories |
| Ephemeral UI state | Local React state | Drawer open, selected marker, hover state |
| Device preference | `localStorage` | Preferred mobile list/map view |
| Authentication | None | Must not exist in MVP |

Filter state must not be duplicated in React Context or a global store.

### 8.4 Feature-oriented source structure

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── query-client.ts
│   └── providers.tsx
├── components/
│   └── ui/                    # Copied/adapted 21st.dev primitives
├── features/
│   ├── event-search/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── search-params.ts
│   │   └── types.ts
│   ├── event-list/
│   │   ├── components/
│   │   └── hooks/
│   ├── event-map/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── map-config.ts
│   └── event-detail/
│       ├── components/
│       └── hooks/
├── pages/
│   ├── DiscoveryPage.tsx
│   ├── EventDetailPage.tsx
│   └── NotFoundPage.tsx
├── shared/
│   ├── api/
│   │   ├── client.ts
│   │   ├── errors.ts
│   │   ├── generated/
│   │   └── catalog-api.ts
│   ├── config/
│   ├── formatters/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── styles/
│   └── globals.css
└── test/
    ├── fixtures/
    ├── msw/
    └── setup.ts

docs/
└── ui-component-sources.md
```

Feature folders own business behavior. `components/ui` contains only generic copied primitives. Do not create an unstructured global `components` folder for event-specific components.

### 8.5 Query keys

Use stable query-key factories:

```text
catalogKeys.all
catalogKeys.categories()
catalogKeys.events(filters)
catalogKeys.mapEvents(filters)
catalogKeys.event(eventId)
```

The normalized semantic filter object is part of list and map keys. Cursor values are managed by infinite-query page parameters, not embedded into the base filter object.

### 8.6 Query behavior

Recommended defaults:

| Query | Stale time | Retry | Notes |
|---|---:|---:|---|
| Categories | 24 hours | 2 for network/503 | Rarely changes |
| Event list | 60 seconds | 2 for network/503 | Infinite query |
| Map events | 60 seconds | 2 for network/503 | Infinite query, manually advance |
| Event detail | 5 minutes | 2 for network/503, never 404 | Reuse briefly |

Use capped exponential backoff. Do not retry 400, 404, or other deterministic client errors automatically.

### 8.7 Request cancellation

- Pass TanStack Query’s `AbortSignal` into `fetch`.
- Filter changes cancel obsolete in-flight requests where possible.
- Aborted requests must not surface as user-visible errors.

---

## 9. Catalog API contract

### 9.1 Base configuration

```text
VITE_API_BASE_URL=<gateway base URL>
VITE_MAP_TILE_URL=<tile template URL>
VITE_MAP_ATTRIBUTION=<required attribution>
```

Validate required environment variables at application startup and fail with a developer-readable configuration error in non-production environments.

### 9.2 Endpoints

| Method | Endpoint | Frontend use |
|---|---|---|
| GET | `/api/v1/events` | Cursor-paginated list summaries |
| GET | `/api/v1/events/map` | Cursor-paginated lightweight markers |
| GET | `/api/v1/events/{eventId}` | Full event detail |
| GET | `/api/v1/categories` | Category filter options |

### 9.3 Search request model

```ts
type EventPeriod = 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH'
type EventPricing = 'ALL' | 'FREE' | 'PAID' | 'NOT_SPECIFIED'
type EventArrondissement =
  | `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20}`
  | 'OUTSIDE_PARIS'
  | 'UNKNOWN'

interface EventSearchParams {
  period?: EventPeriod
  category?: string
  pricing?: EventPricing
  arrondissement?: EventArrondissement
  query?: string
  sort?: 'START_DATE'
  limit?: number // 1–100
  cursor?: string
}
```

The supplied Swagger represents the request as one query parameter named `request` referencing an object. The running Spring controller uses a model attribute, so frontend calls are expected to send flattened query parameters such as `?period=THIS_WEEK&pricing=FREE`. This must be confirmed through an integration test and corrected in OpenAPI before relying on generated client functions.

### 9.4 Expected list summary model

The existing backend mapper contract from Part 5 defines:

```ts
interface EventSummaryResponse {
  id: string
  title: string
  summary: string | null
  categories: string[]
  pricingCategory: 'FREE' | 'PAID' | 'NOT_SPECIFIED'
  arrondissement: number | null
  venueName: string | null
  startAt: string | null
  endAt: string | null
  officialUrl: string | null
}
```

### 9.5 Expected map marker model

```ts
interface EventMapMarkerResponse {
  id: string
  title: string
  latitude: number
  longitude: number
  category: string | null
  pricingCategory: 'FREE' | 'PAID' | 'NOT_SPECIFIED'
  arrondissement: number | null
  startAt: string | null
}
```

### 9.6 Cursor response

```ts
interface CursorPageResponse<T> {
  items: T[]
  nextCursor: string | null
  hasNext: boolean
}
```

Frontend validation must handle inconsistent combinations safely:

- `hasNext=false`: ignore any unexpected cursor.
- `hasNext=true` with missing/blank cursor: stop pagination and log a non-sensitive contract warning; do not loop.
- Missing `items`: treat as a contract failure, not as a successful empty page.

### 9.7 Detail response

```ts
interface EventDetailResponse {
  id: string
  title: string
  description: string | null
  categories: string[]
  officialUrl: string | null
  startAt: string | null
  endAt: string | null
  location: {
    name: string | null
    street: string | null
    zipcode: string | null
    city: string | null
    arrondissement: number | null
    latitude: number | null
    longitude: number | null
  } | null
  accessibility: {
    wheelchairAccessible: boolean | null
    blindAccessible: boolean | null
    deafAccessible: boolean | null
    signLanguage: string | null
    mentalAccessibility: string | null
  } | null
  pricing: {
    type: string | null
    detail: string | null
    accessType: string | null
    bookingUrl: string | null
    bookingLinkText: string | null
  } | null
  occurrences: Array<{
    start: string | null
    end: string | null
  }>
}
```

Although many Swagger properties are not marked nullable or required, the existing Java mapping and real external event data can contain missing values. The frontend must be null-safe until the OpenAPI contract declares exact required/nullable semantics.

### 9.8 Categories response

Expected runtime model:

```ts
type CategoriesResponse = string[]
```

The supplied Swagger currently declares a single `string` response. This is inconsistent with the backend controller returning `List<String>` and must be corrected.

### 9.9 Problem Detail model

Normalize RFC-style errors into:

```ts
interface ApiError {
  status: number
  code: string | null
  title: string
  detail: string
  correlationId: string | null
  violations: Array<{
    field: string
    message: string
  }>
}
```

The Swagger’s `ProblemDetail.properties` wrapper may reflect Spring serialization differently from actual Part 6 responses, where `code`, `timestamp`, `correlationId`, and `violations` can appear as top-level extension properties. The API client must normalize the actual payload shape and integration tests must lock it down.

### 9.10 Correlation IDs

- Read `X-Correlation-ID` from every response when available.
- On an error, prefer the payload correlation ID and fall back to the response header.
- Display correlation ID only in detailed error/support context, not as primary user copy.
- Never generate a misleading server correlation ID in the browser.

---

## 10. OpenAPI contract audit and implementation gate

The supplied Swagger is current but not yet sufficient for safe end-to-end TypeScript generation.

### 10.1 Required corrections

| ID | Current issue | Required backend/OpenAPI outcome |
|---|---|---|
| API-GAP-001 | `CursorPageResponse.items` is `object[]` | Separate or correctly generic schemas for event summaries and map markers |
| API-GAP-002 | Summary DTO schema is absent | Publish `EventSummaryResponse` with exact field types |
| API-GAP-003 | Map marker DTO schema is absent | Publish `EventMapMarkerResponse` with exact field types |
| API-GAP-004 | Categories `200` response is `string` | Publish `array<string>` |
| API-GAP-005 | Search appears as one object query parameter named `request` | Publish flattened query parameters or a generator-compatible deep-object contract matching runtime |
| API-GAP-006 | Most properties lack required/nullable semantics | Mark required fields and nullable fields accurately |
| API-GAP-007 | Some errors have empty content and others use `*/*` | Publish `application/problem+json` consistently for documented errors |
| API-GAP-008 | Problem extensions are ambiguous | Document `code`, `timestamp`, `correlationId`, and `violations` in their real serialized shape |
| API-GAP-009 | API metadata is generic (`OpenAPI definition`, version `v0`) | Publish CityPulse title and a meaningful API version |

### 10.2 Gate decision

Before production implementation chooses generated types as the authority, complete one of these paths:

**Preferred path:** Correct the Catalog Service OpenAPI output, regenerate the JSON, and generate TypeScript types/client from the corrected contract.

**Temporary path:** Hand-author the adapter DTOs exactly as documented in this PRD, validate runtime payloads with integration fixtures, and isolate them in `shared/api`. Do not scatter temporary types across components. Replace them with generated types once the contract is fixed.

Claude must not infer missing list/map fields from the generic Swagger schema alone.

---

## 11. API client requirements

### 11.1 Public client functions

```ts
searchEvents(filters, cursor?, signal?)
searchMapEvents(filters, cursor?, signal?)
getEvent(eventId, signal?)
getCategories(signal?)
```

Components may only use feature hooks; they must not construct endpoint URLs directly.

### 11.2 Query serialization

- Use `URLSearchParams`.
- Append only defined, valid values.
- Always send `sort=START_DATE` for list and map requests.
- Send separate recommended limits for list and map.
- Never serialize `undefined`, `null`, empty category, empty query, or `pricing=ALL` unless the backend explicitly requires it.
- Preserve cursor bytes exactly; do not decode or edit the opaque cursor.

### 11.3 Response handling

- `2xx`: parse expected JSON and validate critical container shape.
- `204`: invalid for current GET contracts; treat as a contract error unless endpoint behavior is formally changed.
- Non-`2xx`: attempt Problem Detail parsing, then fall back to a safe generic error.
- Malformed JSON: produce a generic response-format error with correlation ID if available.
- Never expose stack traces, raw HTML error bodies, SQL details, or internal URLs to users.

### 11.4 URL safety

Before rendering backend-provided external links:

- Parse with `URL`.
- Allow `https:` and optionally `http:` only if required by real data.
- Reject `javascript:`, `data:`, and other unsafe protocols.
- Invalid URLs are omitted from interactive actions.

---

## 12. Loading, error, and empty-state matrix

| Context | State | Required UI behavior |
|---|---|---|
| Initial list | Loading | Skeleton event cards; filters remain usable |
| List filter change | Refreshing | Subtle updating state; avoid full-screen spinner |
| List next page | Loading | Inline progress at Load more; keep cards visible |
| Initial map | Loading | Map skeleton/placeholder while bundle and data load |
| Map next page | Loading | Inline progress on Load more markers |
| Detail | Loading | Full-page detail skeleton |
| Categories | Failure | Keep discovery usable; retry inside category control |
| No list matches | Empty | Helpful no-results state and filter-reset actions |
| No map matches | Empty | Explain no mapped events; point to list |
| Network offline | Error | Persistent non-blocking banner; retain cached data |
| `400 VALIDATION_FAILED` | Error | Identify/reset invalid filter when possible |
| `400 INVALID_CURSOR` on appended page | Recovery | Discard pagination state and refetch first page once; prevent loops |
| `404 EVENT_NOT_FOUND` | Error | Dedicated unavailable event page |
| `503 SERVICE_UNAVAILABLE` | Error | Retriable panel with conservative automatic retry |
| `500 INTERNAL_ERROR` | Error | Generic message, manual retry, correlation ID details |
| Map tile failure | Partial error | Map-specific fallback; list remains functional |

Global toasts are not a substitute for durable inline errors. Use a toast for transient confirmation such as “Link copied,” and inline UI for states requiring action.

---

## 13. Accessibility requirements

Target WCAG 2.2 AA.

### 13.1 Keyboard and focus

- Every interactive control is keyboard reachable.
- Focus order follows visual order.
- Focus indicators are clearly visible.
- Opening a sheet, popover, or dialog moves focus appropriately.
- Closing it returns focus to its trigger.
- Route changes move focus to the new page heading or a managed route focus target.
- Marker actions have keyboard-accessible equivalents in the list.

### 13.2 Semantics

- Use one `h1` per page.
- Use `header`, `main`, `nav`, `aside`, and sections appropriately.
- Event results form a semantic list.
- Cards use links for navigation, not click handlers on non-interactive containers.
- Buttons describe actions; links describe destinations.
- Icon-only buttons have accessible names.

### 13.3 Announcements

- Announce result updates politely without reading every card.
- Announce next-page loading completion and failure.
- Announce selected marker/event context where helpful.
- Avoid excessive live-region updates while typing.

### 13.4 Visual access

- Text and controls meet contrast requirements.
- Color never carries the only meaning.
- Content works at 200% zoom.
- Layout reflows at narrow widths.
- Touch targets are large enough.
- Motion respects reduced-motion settings.

### 13.5 Map alternative

The list is the canonical accessible alternative to the map. No core event information or action may exist only inside a marker popup.

---

## 14. Performance requirements

### 14.1 Performance budgets

Targets on a representative mid-range mobile device and normal 4G connection:

- Lighthouse Performance: at least 90 on the discovery route under controlled test conditions
- Lighthouse Accessibility: at least 95
- LCP: at most 2.5 seconds at the 75th percentile target
- CLS: at most 0.1
- INP: at most 200 ms target
- Initial JavaScript: keep the map and detail route out of the initial discovery-list chunk

These are engineering targets, not promises independent of hosting and API latency.

### 14.2 Required optimizations

- Lazy-load React Leaflet, Leaflet CSS dependencies as appropriate, and map feature code.
- Lazy-load event detail route.
- Debounce text search.
- Cancel superseded requests.
- Cache categories.
- Avoid prefetching all event details.
- Avoid rendering unbounded card lists; cursor loading is user-controlled.
- Memoize marker collections only where profiling shows benefit.
- Use lightweight SVG/CSS marker assets.
- Reserve stable skeleton dimensions to limit layout shift.

### 14.3 Performance measurement

- Measure production builds, not only dev mode.
- Compare list-first mobile load before and after importing each major 21st.dev component.
- Reject copied components that add heavy animation or visualization dependencies without material product value.

---

## 15. Security and privacy

- No auth tokens or user credentials exist in the frontend.
- Do not store event API responses containing future sensitive data in persistent browser storage.
- Store only the preferred mobile view in `localStorage` for MVP.
- Escape external content through React’s default text rendering.
- Validate external URL protocols.
- Do not expose internal error details.
- Configure a production Content Security Policy at the hosting/gateway layer.
- Restrict connect sources to the API Gateway and required map tile domains.
- Do not include third-party tracking by default.
- If analytics is added later, document purpose, events, retention, consent requirements, and privacy implications first.
- Dependency scanning should run in CI.

---

## 16. Browser and device support

Support the latest two stable major versions of:

- Chrome
- Edge
- Firefox
- Safari

Support responsive layouts from 320 CSS pixels wide through large desktop screens. Test Safari/iOS behavior for viewport height, bottom sheets, sticky regions, and Leaflet gestures.

Internet Explorer is not supported.

---

## 17. Testing strategy

### 17.1 Unit tests

Cover pure behavior:

- URL parameters to normalized filters
- Filters to canonical URL parameters
- Invalid parameter fallback
- Search query trimming and maximum length
- API query serialization
- Price/category/arrondissement labels
- Paris date/time formatting including DST boundaries
- External URL safety
- API Problem Detail normalization
- Cursor response consistency guard
- Event deduplication by ID

### 17.2 Component tests

- Filter controls and active chips
- Mobile filter sheet focus behavior
- Event card with complete and partial data
- Load more states
- No-results state actions
- Map placeholder and map-specific error state
- Marker popup content
- Detail page with missing location, pricing, accessibility, occurrences, or links
- Event unavailable page
- Offline banner
- Reduced-motion behavior where relevant

### 17.3 MSW integration tests

Use API handlers representing actual contracts:

- Successful list first page
- Successful list next page
- Next page containing a duplicate ID
- List filter change resets pagination
- Successful map first and next pages
- Map response never renders invalid coordinates
- Categories success/failure
- Event detail success
- `400 VALIDATION_FAILED`
- `400 INVALID_CURSOR`
- `404 EVENT_NOT_FOUND`
- `503` followed by success
- Persistent `500`
- Malformed JSON
- Slow response and cancellation
- Offline/network failure

### 17.4 End-to-end tests

Critical Playwright flows:

1. Open discovery, apply period/category/price/location/search, and verify URL.
2. Reload filtered URL and verify reconstructed controls and requests.
3. Load another list page and verify no duplicates.
4. Open detail, verify content, and return to preserved results.
5. Open a detail URL directly.
6. Desktop: select card/marker and verify best-effort synchronization.
7. Mobile: open filters, apply filters, toggle list/map, and preserve state.
8. Map: load more markers without automatically loading all pages.
9. Empty results: reset a filter and recover.
10. Temporary service failure: retry and recover.
11. Keyboard-only discovery and detail navigation.

### 17.5 Contract tests

- Validate local API fixtures against corrected OpenAPI schemas.
- Exercise flattened search query parameters against the real Catalog Service.
- Verify categories returns `string[]`.
- Verify list and map cursor items match their expected DTOs.
- Verify real `application/problem+json` extension fields and correlation IDs.

### 17.6 Quality commands

The project must provide equivalent scripts:

```bash
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm run preview
```

---

## 18. Observability and diagnostics

The frontend should support troubleshooting without exposing sensitive details.

- Centralize error reporting behind an adapter, even if no external monitoring provider is configured in MVP.
- Log contract violations and unexpected states in development.
- Production console output must not be noisy or contain response bodies with internal information.
- Preserve server correlation IDs in normalized errors.
- If a monitoring provider is added, scrub URL query values where they could contain user-entered text.
- Track Web Vitals through a replaceable adapter if analytics/monitoring is later approved.

---

## 19. Delivery plan

### Phase 0 — Contract readiness

- Fix or explicitly accept all API gaps in Section 10.
- Confirm API Gateway base URL and CORS behavior.
- Confirm flattened search parameters against the running service.
- Capture realistic sanitized fixtures for list, map, detail, categories, and errors.

**Exit criterion:** Frontend types are grounded in a verified contract.

### Phase 1 — Foundation

- Create Vite React TypeScript project.
- Enable strict TypeScript, linting, formatting, tests, and path aliases.
- Configure Tailwind and CityPulse design tokens.
- Configure router and TanStack Query.
- Create API client and error normalization.
- Establish MSW fixtures.
- Create `docs/ui-component-sources.md`.

**Exit criterion:** Empty routes, API client, tests, and design foundation build successfully.

### Phase 2 — Discovery list

- Select and install coherent 21st.dev primitives.
- Implement URL filter parser/serializer.
- Implement responsive filter UI.
- Implement event list, cards, skeletons, empty/error states, and Load more.
- Verify Back/Forward and shareable URLs.

**Exit criterion:** Complete list-first discovery works without the map.

### Phase 3 — Map and responsive synchronization

- Lazy-load map feature.
- Configure tiles and attribution.
- Implement progressive markers and Load more markers.
- Implement marker popup and best-effort list/marker cross-highlighting.
- Implement mobile list/map toggle and desktop split.

**Exit criterion:** List and map share filters and remain independently paginated.

### Phase 4 — Event detail

- Implement full-page route.
- Implement content, occurrences, accessibility, location, map, and external actions.
- Preserve Back to results context.
- Implement unavailable and error states.
- Add dynamic browser title and description.

**Exit criterion:** Detail URLs are directly loadable, shareable, and null-safe.

### Phase 5 — Hardening

- Complete accessibility audit.
- Complete responsive/browser tests.
- Run performance profiling and bundle analysis.
- Complete Playwright critical flows.
- Verify production configuration and CSP requirements.
- Remove unused copied component code and dependencies.

**Exit criterion:** Definition of Done is satisfied.

---

## 20. Definition of Done

The frontend MVP is complete only when:

- React + TypeScript + Vite production build succeeds.
- 21st.dev is the documented source of primary UI primitives.
- Selected components are visually coherent and locally owned.
- No auth, account, or favourite functionality is present.
- Desktop displays the split list/map experience.
- Mobile provides a stable list/map toggle.
- All supported filters are URL-synchronized.
- List and map requests use identical semantic filters.
- List Load more uses opaque cursor pagination and displays no total.
- Map markers load progressively and never auto-fetch all pages.
- Geographic bounds are not sent in V1.
- Event detail is a full-page shareable route.
- Missing or partial backend data never crashes a page.
- Error states follow the Part 6 Problem Detail contract.
- Correlation IDs are retained for troubleshooting.
- Core flows pass keyboard and screen-reader-oriented checks.
- Typecheck, lint, formatting, unit/integration tests, E2E tests, and build pass in CI.
- Performance budgets are measured and any accepted exceptions are documented.
- API contract gaps are fixed or isolated behind the temporary typed adapter.
- `docs/ui-component-sources.md` lists every copied 21st.dev component and modification.

---

## 21. Claude implementation directives

The following instructions are binding for the implementation agent:

1. Read this PRD and the latest Swagger file before modifying code.
2. Inspect any existing repository and preserve its conventions unless they conflict with this PRD.
3. Do not invent authentication, saved events, user profiles, or extra backend endpoints.
4. Do not infer DTO fields from `CursorPageResponse<object>`; use the verified Part 5 contracts or a corrected Swagger.
5. Use React, TypeScript, Vite, React Router, TanStack Query, Tailwind, and React Leaflet.
6. Use 21st.dev as the primary component source. Prefer one coherent shadcn-compatible family.
7. For every copied component, record source URL, install command/prompt, dependencies, and modifications.
8. Do not import a runtime package called `21st.dev`.
9. Keep filters in URL search params, remote data in TanStack Query, and transient UI state local.
10. Do not introduce Redux or Zustand.
11. Keep API calls out of presentational components.
12. Pass request abort signals through the API client.
13. Treat cursors as opaque.
14. Implement list and map pagination independently.
15. Do not automatically fetch all map pages.
16. Do not add geographic bounds or “Search this area” in V1.
17. Lazy-load the map and event detail route.
18. Render external descriptions as text, not unsafe HTML.
19. Make all missing data states explicit and honest.
20. Add tests with each feature rather than postponing all tests to the end.
21. Run typecheck, lint, tests, and build after each implementation phase.
22. If the repository or runtime contract contradicts this PRD, stop and report the exact contradiction before silently changing product behavior.

---

## 22. Future roadmap boundaries

### 22.1 Geographic bounds (post-MVP)

Future map API shape may include:

```text
GET /api/v1/events/map
  ?north=...
  &south=...
  &east=...
  &west=...
  &period=...
  &category=...
```

That version should define:

- Bounding-box validation
- Maximum geographic area
- Marker cap or clustering strategy
- Debounced viewport requests
- “Search this area” behavior
- Cache keys including normalized bounds
- Handling of antimeridian and invalid boxes if the product expands beyond Paris

None of this belongs in V1 code except a clean map feature boundary that makes later addition possible.

### 22.2 Possible later enhancements

- Local or account-backed favourites
- Calendar export
- Notifications
- Multiple cities
- Server-rendered event metadata
- Marker clustering based on measured need
- More filter dimensions backed by explicit API support
- Event images only after the Catalog API publishes reliable image metadata and rights/attribution rules

---

## 23. Open decisions requiring environment values, not product redesign

These can be resolved during setup without reopening the PRD:

- Final production API Gateway URL
- Production map tile provider, URL, token strategy, and attribution
- CityPulse brand accent and final typeface
- Exact 21st.dev component pages selected within the required coherent family
- Hosting provider and SPA fallback configuration
- Whether optional native Share/copy-link action is included in the first release

---

## 24. References

- Supplied API contract: `citypulse.catalog.service.swagger(1).json`
- [21st.dev component registry](https://21st.dev/)
- [21st.dev component installation help](https://help.21st.dev/community/components)
- [shadcn/ui library on 21st.dev](https://21st.dev/@shadcn/library/shadcn-ui)
- [React documentation](https://react.dev/)
- [Vite documentation](https://vite.dev/)
- [React Router documentation](https://reactrouter.com/)
- [TanStack Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [React Leaflet documentation](https://react-leaflet.js.org/)
- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)

