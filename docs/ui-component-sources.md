# UI component sources

Required by PRD §7.2 rule 6 and §20. Every generic UI primitive in
`src/components/ui/` is recorded here with its origin and every local
modification.

---

## Registry decision, and a deviation worth reading

PRD §7.2 names [21st.dev](https://21st.dev/) as the primary registry and
recommends the [shadcn/ui library on 21st.dev](https://21st.dev/@shadcn/library/shadcn-ui)
as the coherent baseline family.

**21st.dev's registry endpoints could not be fetched during implementation.**
Probed on 2026-08-09:

```text
GET https://21st.dev/r/shadcn/button  → 403 application/json
GET https://21st.dev/r/shadcn/badge   → 403 application/json
```

The endpoint requires an authenticated 21st.dev API key, which this environment
does not have. `npx shadcn@latest add "https://21st.dev/r/..."` fails for the
same reason.

The `@shadcn/library/shadcn-ui` collection on 21st.dev is a mirror of the
upstream shadcn/ui registry, so components were installed from the canonical
source instead:

```text
GET https://ui.shadcn.com/r/styles/new-york-v4/<component>.json → 200
```

This satisfies the substance of the requirement — one coherent, shadcn-compatible
family, copied into the repository and owned locally — while differing from the
literal instruction to fetch through 21st.dev. **If a 21st.dev API key becomes
available, re-fetch these same component names from
`https://21st.dev/r/shadcn/<component>` and diff against the files here; they
should be byte-identical before the local modifications listed below.**

Equivalent install command once a key is configured:

```bash
npx shadcn@latest add "https://21st.dev/r/shadcn/button"
```

Command actually used:

```bash
# See the fetch loop in the implementation transcript; equivalent to:
npx shadcn@latest add button badge card input label select skeleton \
  alert tabs drawer tooltip accordion separator sonner popover
```

---

## Copied components

Style: **new-york-v4** (Tailwind v4, `radix-ui` unified package).
All files live in `src/components/ui/`.

| File            | Source                                              | Runtime deps | Local modifications                                                                                                                                                                                                                                                                                                                                                                               |
| --------------- | --------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accordion.tsx` | `ui.shadcn.com/r/styles/new-york-v4/accordion.json` | `radix-ui`   | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `alert.tsx`     | `…/alert.json`                                      | —            | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `badge.tsx`     | `…/badge.json`                                      | `radix-ui`   | `"use client"` removed. **Added variants** `free`, `paid`, `unspecified` (PRD FR-FILTER-003 — "price not specified" must be visually distinct from "free" and never green) and `category`, which reads `--cp-accent` / `--cp-accent-subtle` supplied by `src/shared/utils/category-accent.ts` so no feature component hardcodes a category colour                                                 |
| `button.tsx`    | `…/button.json`                                     | `radix-ui`   | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `card.tsx`      | `…/card.json`                                       | —            | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `drawer.tsx`    | `…/drawer.json`                                     | `vaul`       | `"use client"` removed. **`autoFocus` and `modal` defaulted to `true` on `Drawer`.** Vaul ships `autoFocus={false}`, which leaves focus on the trigger behind the open sheet; the focus scope then has nothing to hold and Tab walks into the page behind it. This was a genuine WCAG 2.2 AA failure, caught by `e2e/mobile.spec.ts › the sheet traps focus while open`, which now guards the fix |
| `input.tsx`     | `…/input.json`                                      | —            | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `label.tsx`     | `…/label.json`                                      | `radix-ui`   | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `popover.tsx`   | `…/popover.json`                                    | `radix-ui`   | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `select.tsx`    | `…/select.json`                                     | `radix-ui`   | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `separator.tsx` | `…/separator.json`                                  | `radix-ui`   | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `skeleton.tsx`  | `…/skeleton.json`                                   | —            | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `sonner.tsx`    | `…/sonner.json`                                     | `sonner`     | `"use client"` removed. **`next-themes` dependency removed** and the theme pinned to `light`: CityPulse ships a single light theme (PRD §7.4), and pulling in a theming library for one string would have added bundle cost for no product value (PRD §7.2 rule 8, §14.3)                                                                                                                         |
| `tabs.tsx`      | `…/tabs.json`                                       | `radix-ui`   | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |
| `tooltip.tsx`   | `…/tooltip.json`                                    | `radix-ui`   | `"use client"` removed; Prettier-formatted                                                                                                                                                                                                                                                                                                                                                        |

Supporting file: `src/lib/utils.ts` (`cn`), the standard shadcn helper over
`clsx` + `tailwind-merge`.

### Rejected / not installed

- **`next-themes`** — pulled in by the `sonner` registry entry. Removed; see above.
- **Marker clustering libraries** — PRD FR-MAP-005 requires measuring real marker
  volume first. Not added.
- **Carousel, chart, calendar, data-table** — no MVP requirement; each carries a
  heavy transitive dependency (PRD §7.2 rule 8).

---

## Token normalisation (PRD §7.2 rule 7)

The copied components reference the standard shadcn semantic token names
(`--background`, `--primary`, `--muted`, `--destructive`, …). Rather than editing
every copied file — which would make future re-fetches impossible to diff —
`src/styles/globals.css` **is** the normalisation layer: it re-points the entire
shadcn token contract at CityPulse values and adds CityPulse-specific tokens
(`--free`, `--paid`, `--unspecified`, `--warning`, `--category-a…f`) alongside it.

Consequences:

- A component can be re-fetched from the registry and dropped in unchanged; only
  the modifications in the table above need reapplying.
- No feature component contains a literal colour.
- Category colours resolve through exactly one function,
  `getCategoryAccent()` in `src/shared/utils/category-accent.ts`, with a neutral
  fallback for unrecognised backend categories.

Dark mode is deliberately out of scope for the MVP, so the `.dark` variants that
ship inside the copied components are inert rather than removed — again, to keep
future registry diffs clean.

---

## Audit performed on copied code (PRD §7.2 rule 9)

| Check                                   | Result                                                                                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard access                         | Passed after the `drawer.tsx` fix above; covered by `e2e/desktop.spec.ts` (flow 11) and `e2e/mobile.spec.ts`                                                                                                            |
| Focus management                        | Sheet returns focus to its trigger on close — asserted in `e2e/mobile.spec.ts`                                                                                                                                          |
| Reduced motion                          | `prefers-reduced-motion` handled globally in `globals.css`; `tw-animate-css` keyframes are suppressed by it                                                                                                             |
| Semantic HTML                           | Verified; cards navigate via `<a>`, not click handlers on containers                                                                                                                                                    |
| Bundle cost                             | `radix-ui`, `vaul` and `sonner` sit in the initial discovery chunk (~80 kB gzip for all application code). Leaflet is isolated in `map-vendor` and never loads on a list-first visit — asserted in `e2e/mobile.spec.ts` |
| Demo code / sample data / remote images | None present in the registry payloads; nothing to strip                                                                                                                                                                 |

---

## Not sourced from a registry

These are CityPulse feature components, composed from the primitives above:

- `src/features/event-list/components/*` — cards, skeletons, empty state, list
- `src/features/event-search/components/*` — filter bar, chips, selects, sheet
- `src/features/event-map/components/*` — Leaflet map, markers, popup
- `src/features/event-detail/components/*` — detail sections
- `src/shared/components/*` — error state, offline banner

Per PRD §7.2 rule 10 this is expected: no registry offers an
"event discovery map/list split" component, and business components are allowed
as long as they are built from the shared primitives.
