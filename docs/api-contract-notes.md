# Catalog API contract notes

Required by PRD §10 (contract audit) and §20 ("API contract gaps are fixed or
isolated behind the temporary typed adapter").

The frontend takes the **temporary path** of PRD §10.2: hand-authored adapter
DTOs, isolated in `src/shared/api/`, validated by integration fixtures. They
should be replaced with generated types once the OpenAPI output is corrected.

Everything below was verified on **2026-08-09** by reading the running service's
source in `catalog-service/src/main/java/com/citypulse/catalog/`.

---

## 1. Contradictions between the PRD and the running service

PRD §21 rule 22 requires these to be reported rather than silently accommodated.
They were reported, and the **running service was treated as authoritative**.

| PRD reference | PRD says                                 | `EventSummaryResponse.java` / `EventMapMarkerResponse.java` actually says |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| §9.4          | `EventSummaryResponse.pricingCategory`   | `pricing`                                                                 |
| §9.4          | `EventSummaryResponse.venueName`         | `venue`                                                                   |
| §9.5          | `EventMapMarkerResponse.pricingCategory` | `pricing`                                                                 |

**Mitigation.** `src/shared/api/types.ts` declares wire types that accept _both_
spellings, and `normaliseSummary` / `normaliseMarker` in
`src/shared/api/catalog-api.ts` collapse them into one internal model that uses
the PRD's names. Whichever side is eventually corrected, the client keeps
working. This is covered by
`src/shared/api/catalog-api.test.ts › normaliseSummary`.

Two further differences, neither breaking:

- `categories` is a Java `Set<String>`, so **ordering is not guaranteed** by the
  backend. The UI never relies on category order.
- `EventMapMarkerResponse.latitude/longitude` are primitive `double`, so they
  cannot be null on the wire — but the client still validates finiteness and
  range before creating a marker (PRD FR-MAP-001), because the field can be
  absent if the DTO ever changes.

---

## 2. Status of each gap in PRD §10.1

| ID          | PRD issue                                            | Runtime finding                                                                                                                                | Frontend position                                                                                                                                                 |
| ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API-GAP-001 | `CursorPageResponse.items` is `object[]`             | Real generic is `CursorPageResponse<T>`; Swagger erases it                                                                                     | Documentation-only. Adapter types supply the real item shapes                                                                                                     |
| API-GAP-002 | Summary DTO schema absent from Swagger               | DTO exists in code                                                                                                                             | Hand-authored from the Java record, not inferred from Swagger                                                                                                     |
| API-GAP-003 | Map marker DTO schema absent                         | DTO exists in code                                                                                                                             | Same                                                                                                                                                              |
| API-GAP-004 | Categories `200` declared as `string`                | `findCategories()` returns `List<String>`                                                                                                      | **Swagger is wrong, runtime is right.** Client asserts an array and raises a contract error otherwise                                                             |
| API-GAP-005 | Search shown as one object parameter named `request` | `@Valid @ModelAttribute EventSearchRequest` → Spring binds **flattened** query parameters                                                      | **Resolved at runtime level.** Client sends `?period=…&pricing=…`. Locked down by `catalog-api.test.ts › buildSearchParams` and by `e2e/discovery.spec.ts` flow 2 |
| API-GAP-006 | Required/nullable semantics missing                  | Java records permit null for every reference field                                                                                             | Every field is treated as nullable; `normalise*` coerces to `null`, never `undefined`                                                                             |
| API-GAP-007 | Inconsistent error content types                     | `GlobalExceptionHandler` sets `application/problem+json` on its own handlers; `@ApiResponse(content = @Content)` annotations under-document it | Client accepts both and falls back safely on a non-JSON body                                                                                                      |
| API-GAP-008 | Problem extensions ambiguous                         | `problem.setProperty(...)` puts `code`, `timestamp`, `correlationId`, `violations` at **top level**                                            | `normaliseProblemDetail` reads top-level _and_ a nested `properties` object, so either Spring serialisation works. Covered in `errors.test.ts`                    |
| API-GAP-009 | Generic API metadata                                 | Unchanged                                                                                                                                      | Cosmetic; no frontend impact                                                                                                                                      |

### Additional runtime detail not in the PRD

- **Default `limit` is 30**, not 20 (`EventSearchRequest.effectiveLimit()`). The
  client always sends an explicit limit — 20 for the list, 100 for the map, per
  PRD FR-LIST-001 / FR-MAP-001 — so the default never applies.
- **`arrondissement` validation regex** is `^(?:[1-9]|1[0-9]|20|OUTSIDE_PARIS|UNKNOWN)$`.
  Note it rejects zero-padded values such as `01`; `parseFilters` matches this
  exactly and falls back to "all locations" for anything else.
- **`X-Correlation-ID`** is set on _every_ response by `CorrelationIdFilter`, not
  only on errors, and is echoed back if the client supplies a valid one. The
  client reads it from the response header and prefers the payload value on
  errors (PRD §9.10). It never generates one.
- **Timestamps** are already converted to `Europe/Paris` offsets by
  `EventResponseMapper.parisTime`. The frontend still formats through
  `Intl.DateTimeFormat` with an explicit `Europe/Paris` time zone, so behaviour
  is correct regardless of whether the backend later switches to UTC.

---

## 3. Deployment blockers found while reading the backend

Neither is a frontend defect, but both must be resolved before this app can talk
to a real Catalog Service from a browser.

1. **No CORS configuration.** `catalog-service` has no `CorsConfigurationSource`,
   no `@CrossOrigin`, and no `spring.web.cors.*` properties. A browser calling it
   cross-origin will be blocked.
2. **No API Gateway in this repository.** PRD §8.2 places a gateway between the
   browser and the service.

**Development workaround (already configured):** `vite.config.ts` proxies `/api`
to `http://localhost:8081` (the `dev` profile port), so `VITE_API_BASE_URL` can
stay empty and no CORS preflight occurs. Override the target with
`VITE_DEV_API_PROXY_TARGET`.

**For production**, do one of:

- put the frontend and the gateway on the same origin (preferred — keeps
  `VITE_API_BASE_URL` relative and needs no CORS at all), or
- configure CORS on the gateway for the frontend origin, and set
  `VITE_API_BASE_URL` to the gateway URL.

---

## 4. Migrating to generated types

When the OpenAPI output is corrected (PRD §10.2, preferred path):

1. Regenerate `citypulse.catalog.service.swagger.json`.
2. Generate types into `src/shared/api/generated/`.
3. Replace the hand-authored wire interfaces in `src/shared/api/types.ts` with
   the generated ones. **Keep** `EventSummary`, `EventMapMarker`, `EventDetail`
   and `CursorPage` — they are the internal domain model, deliberately decoupled
   from the wire, and the rest of the app imports only these.
4. Keep the `normalise*` functions: they enforce the runtime guarantees the type
   system cannot (finite coordinates, cursor-consistency, `NOT_SPECIFIED` never
   silently becoming `FREE`).
5. `src/shared/api/catalog-api.test.ts` should pass unchanged.
