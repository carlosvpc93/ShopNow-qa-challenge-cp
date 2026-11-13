# CLAUDE.md — ShopNow QA Challenge

## Context

This repo is a QA challenge from The Flock. **ShopNow** is a small e-commerce site (Express API + React/Vite frontend).
Act as the **QA Engineer**: find what is broken before users do, report it clearly, and leave Playwright tests that keep it from happening again.

**Never edit `README.md`.**

## Project map

| Path | What it is |
|---|---|
| `SPEC.md` | Product spec to analyze |
| `USER_REPORTS.md` | 3 user reports to investigate |
| `docs/API.md` | Documented API (test through it as well as the UI) |
| `ANALYSIS.md` | **Deliverable 1**: PO questions, ambiguities, assumptions |
| `BUGS.md` | **Deliverable 2**: bug reports (`BUG-01`, `BUG-02`, …) |
| `tests/` | **Deliverable 3**: Playwright regression tests |
| `ai/README.md` | **Deliverable 4**: how AI was used (mandatory) |
| `evidence/` | Optional screenshots / videos / request-response dumps |
| `app/` | App under test (server in `app/server`, web in `app/web`, seed in `app/data/seed.json`) |
| `tests/helpers.ts` | `resetData(request)`, `login(page, user)`, `USERS` |

## Commands

```bash
npm install     # also installs Chromium for Playwright
npm run dev     # app at http://localhost:4321
npm run reset   # restore data to fresh install
npm test        # Playwright suite (starts the app if not running)
npm run test:ui # Playwright UI mode
```

Node >= 22 required.

Test users: Look for test users at README.md


## Workflow

1. **Analyze the spec → `ANALYSIS.md`.** Prioritized questions for the PO, ambiguities, assumptions made to move forward.
2. **Find bugs → `BUGS.md`.** Investigate the 3 user reports, then hunt for **unreported** bugs (there are several). Test through **both the UI and the API**. Think about: money/rounding, stock, cart math, checkout, payments, order status, auth/authorization (can Bruno see or change Ana's data?), input validation, and UI vs API inconsistencies.
3. **Automate → `tests/`.** One or more tests per bug that **fail today** and **pass once fixed**.
4. Point out root causes in `app/` inside `BUGS.md`; fix bugs in separate commits.

## Rules for bug reports (`BUGS.md`)

- Use the exact template in `BUGS.md` for each bug: Source, Type, Severity, Priority (with reason), Preconditions, Steps to reproduce, Expected, Actual, Evidence, Automated test, Root cause (optional).
- IDs are sequential: `BUG-01`, `BUG-02`, …
- **Sort by priority**, most important first.
- Type is one of: UI / Logic / Integration / Data / Security. Severity: Critical / High / Medium / Low. Priority: P1 / P2 / P3.
- Steps must be reproducible from a fresh install (`npm run reset`), with exact users, inputs and endpoints.
- Every "expected result" must trace back to `SPEC.md` or `docs/API.md`. If the spec is unclear, write it as an assumption: *"I assume X; if the PO confirms Y, this is a bug."*
- If something can't be verified in this local environment, don't work around it: record it as an assumption or a PO question in `ANALYSIS.md`.
- Never claim a bug without reproducing it ourselves.

## Rules for automated tests (strict — used for automatic grading)

- Put the bug ID in the test name: `test("[BUG-03] <what should happen>", ...)`.
- Every test starts from a clean state: call `resetData(request)` in `beforeEach`.
- Locate elements with the app's `data-testid` attributes (`page.getByTestId(...)`).
- Test only through the **UI** or the **documented API** (`docs/API.md`). **Never read or modify files in `app/` from tests.**
- Tests must **fail today** because of the bug and pass on the fixed version. **Do not use** `test.fail`, `test.fixme`, `test.skip` or `test.only`.
- **No mocking** of the app (no `page.route` stubbing of the app's own responses).
- **Do not change** the URL or port in `playwright.config.ts`.
- **Only use dependencies already in the repo** (no new packages).
- Write assertions on the *correct, expected* behavior (per spec), not on the current buggy output.
- Keep tests plain, independent and deterministic (no fixed sleeps; use Playwright's auto-waiting `expect`).
- Review the team's existing tests (`tests/cart.spec.ts`, `tests/login.spec.ts`) — they may be wrong, weak or false-positives; fix or report them.
- Verify each new test actually fails for the right reason (run it and read the failure message).
- Extra tooling beyond Playwright goes in a separate folder, documented in `TESTING.md`.

## Test architecture (POM + fixtures)

Goal: tests that are easy to read, review and maintain, without over-engineering (time counts). The grading rules above always win over these style rules.

### Folder layout — UI and API tests are separated

```
tests/
  ui/                     # UI (browser) specs only — use page objects
    auth.spec.ts
    cart.spec.ts
    checkout.spec.ts
    orders.spec.ts
    payments.spec.ts
  api/                    # API specs only — use the API client, never `page`
    auth.api.spec.ts
    cart.api.spec.ts
    orders.api.spec.ts
    payments.api.spec.ts
  pages/                  # Page Objects (UI layer)
    BasePage.ts
    LoginPage.ts  CatalogPage.ts  ProductDetailPage.ts  CartPage.ts
    CheckoutPage.ts  OrdersPage.ts  OrderDetailPage.ts  PaymentsPage.ts
    components/           # shared UI parts (Header: logout, cart badge…)
  clients/
    ShopNowApi.ts         # typed client for the documented API (docs/API.md)
  fixtures/
    ui.fixture.ts         # test.extend: page objects + logged-in page (asAna / asBruno)
    api.fixture.ts        # test.extend: api client + authenticated clients (anaApi / brunoApi)
  data/
    testData.ts           # users, product refs, cards, inputs shared by both layers
  utils/
    money.ts              # parse/format money once (e.g. "$1,234.50" → 123450 cents)
  helpers.ts              # existing helpers (resetData, login, USERS) — keep path working
```

Separation rules:
- **`tests/ui/`** specs import `test`/`expect` from `../fixtures/ui.fixture` and interact only through page objects. They may use the API **only for setup** (e.g. creating an order fast) through the `api` fixture, never to assert the behavior under test.
- **`tests/api/`** specs import from `../fixtures/api.fixture`, use only the `ShopNowApi` client, and never use `page` or page objects. Assert status codes **and** response bodies.
- Shared code (`data/`, `utils/`, `helpers.ts`) has no knowledge of `page` vs `request` specifics beyond what it needs; page objects never import the API client and vice versa.
- A bug can have a UI test, an API test, or both. Use the same `[BUG-XX]` ID in each, and add the layer to the name for clarity: `[BUG-05][API] rejects negative quantity with 400`, `[BUG-05][UI] cart does not allow quantity below 1`.
- Rule of thumb: business rules, validation and authorization (e.g. Bruno accessing Ana's order) → API test first (fast, precise). Things users see (totals displayed, buttons, flows, messages) → UI test.
- Run a layer alone: `npx playwright test tests/ui` or `npx playwright test tests/api`. Don't add projects or change `playwright.config.ts` for this (the URL/port rule makes config edits risky).
- The team's existing `tests/cart.spec.ts` and `tests/login.spec.ts` move to `tests/ui/` (update the `helpers` import path); run the suite after moving.

### Page Objects

- One class per page, named `<Page>Page`, receives `page: Page` in the constructor.
- Locators are `readonly` properties built **only** with `page.getByTestId(...)`. If an element has no `data-testid`, use a role/label locator and note it as a testability gap in `BUGS.md` or `ANALYSIS.md`.
- Methods are **user intentions**: `addToCart(productId, qty)`, `checkout()`, `payWith(card)`. Not raw clicks like `clickButton3()`.
- Navigation methods (`goto()`) live in the page they open.
- Getter methods return **data** (`getTotal(): Promise<number>`, `getLineItems()`) so specs can assert on it.
- **No assertions in page objects.** They may *wait* for a state the action needs (`locator.waitFor()`), but they do not verify business behavior.
- Money parsing and formatting go in one helper (e.g. `parseMoney("$1,234.50") → 123450` cents), not inside each page.

### API client (`tests/clients/ShopNowApi.ts`)

- `ShopNowApi` wraps Playwright's `APIRequestContext` and exposes one method per **documented** endpoint in `docs/API.md`.
- Methods return the raw `APIResponse` (or `{ status, body }`) so specs can assert on status codes **and** bodies. Never hide error statuses.
- No calls to undocumented endpoints except `/api/test/reset`, which `helpers.ts` already uses.

### Fixtures

- Two fixture files, one per layer, each exporting its own `test` and `expect` built with `test.extend<...>()`:
  - `ui.fixture.ts`: one fixture per page object (`loginPage`, `cartPage`, …), `asAna` / `asBruno` (logged in through the UI with `helpers.login`), plus `api` for setup only.
  - `api.fixture.ts`: `api` (anonymous `ShopNowApi`), `anaApi` / `brunoApi` (already authenticated as documented in `docs/API.md`).
- Specs import from their layer's fixture file, never directly from `@playwright/test`.
- **Still write an explicit `test.beforeEach(async ({ request }) => resetData(request))` in every spec file.** The grading rule asks for it, and a visible reset is easier to review than one hidden in a fixture.
- Fixtures do setup and teardown only. Assertions stay in the specs.

### Assertions live in spec files

- Every `expect(...)` that checks **behavior under test** goes in a `*.spec.ts`.
- Allowed exception: the existing guards in `tests/helpers.ts` (`resetData` checks the reset succeeded, `login` checks the logout button is visible). These are **precondition checks**, not bug assertions, so leave them. New helpers follow the same rule: a guard is allowed only when its failure means "setup broke", never "the bug is present".
- Prefer web-first assertions (`await expect(locator).toHaveText(...)`) over reading values then comparing, so Playwright auto-waits.
- Assert on the **correct** spec value (the fixed behavior), with a clear message when the reason isn't obvious:
  `expect(total, "total must include shipping per SPEC §X").toBe(...)`.
- One behavior per test. Several `expect`s are fine if they check the same behavior. Use `expect.soft` only when the test must keep collecting related checks.

### SOLID, applied pragmatically

- **S — Single responsibility:** a page object models one page, the API client models HTTP, fixtures wire things together, specs assert. Data lives in `testData.ts`.
- **O — Open/closed:** add new pages or endpoints by adding classes or methods, without changing existing callers. Shared behavior (header, cart badge) goes in components used by composition.
- **L — Liskov:** if a `BasePage` exists, subclasses must stay usable through it (same `goto()` / `isLoaded()` contract). Keep `BasePage` small.
- **I — Interface segregation:** keep page objects focused. Don't build one "god" `ShopPage` with every method.
- **D — Dependency inversion:** specs depend on fixtures, not on `new XPage(page)` scattered everywhere. Fixtures inject the page objects and the API client.
- Prefer **composition over deep inheritance**. Avoid abstractions that only one test uses (YAGNI). The reviewer should understand a spec in one read.

### Naming & style

- Test name: `[BUG-XX] <expected behavior in plain words>`, e.g. `[BUG-04] cart total equals sum of line subtotals`.
- Group with `test.describe("<Feature>")`, and use `test.step(...)` for long flows so the report reads as steps.
- No `waitForTimeout`, no hard-coded sleeps, no `page.route` mocks, no test-order dependency.
- TypeScript strict-friendly: typed returns, no `any` unless justified.
- No TypeScript parameter properties (`constructor(readonly page: Page)`): Node 22 type-stripping rejects them and the suite won't load. Declare fields explicitly.
- Refactor existing tests (`cart.spec.ts`, `login.spec.ts`) into this structure only if it's cheap. Fixing a wrong or weak assertion matters more than its style.

## Rules for code changes in `app/` (optional extension only)

- Only after the core deliverables are done.
- One commit per bug fix, with the bug ID in the message (e.g. `fix(BUG-03): ...`).
- Confirm the related test passes after the fix.

## AI usage 

Claude must never present an unverified finding as fact. Hypotheses are labeled as hypotheses until reproduced.

