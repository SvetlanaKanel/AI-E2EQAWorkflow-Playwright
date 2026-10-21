# Saucedemo Checkout Test Execution Report

**Execution date:** 2026-10-21  
**Application:** https://www.saucedemo.com  
**Browser:** Chromium (Playwright `chromium` project)  
**Viewport:** Desktop browser session, not resized during manual checks  
**Account:** `standard_user` / `secret_sauce`

## Executive summary

The checkout workflow successfully supports cart review, required-field checks, order overview, completion, cart clearing, and authentication protection. One acceptance-criteria defect was confirmed: checkout accepts whitespace-only and otherwise invalid non-empty customer data. The automation suite contains 13 test cases; final Chromium run had **12 passed, 1 failed**. The failure is the expected, unrepaired AC5 product defect.

| Measure | Result |
|---|---:|
| Test cases planned | 13 |
| Manual scenarios recorded | 13 (some sampled/partial) |
| Automated cases executed | 13 |
| Final automated results | 12 passed / 1 failed / 0 blocked |
| Defects confirmed | 1 (AC5 validation) |
| Overall assessment | Core checkout works; AC5 release risk remains |

## Manual test results

| Test case | Status | Summary |
|---|---|---|
| TC-01 | PASS | Item names, descriptions, quantity, price, badge, and cart actions verified. |
| TC-02 | PASS | Continue Shopping returned to inventory with cart retained. |
| TC-03 | PASS | Checkout form and valid progression verified. |
| TC-04 | PASS — sampled | Empty first name and missing postal code were validated; other permutations not all manually sampled. |
| TC-05 | FAIL | Invalid names/postal data were accepted and progressed to overview. |
| TC-06 | PASS | Order details and expected subtotal, tax, and total verified. |
| TC-07 | PASS | Cancel returned to inventory with uncompleted items retained. |
| TC-08 | PASS | Confirmation and Back Home navigation verified. |
| TC-09 | PASS | Cart was empty after order completion. |
| TC-10 | PASS — partial | Browser Back restored checkout information; field values were not retained; not all back transitions sampled. |
| TC-11 | PASS — guard partial | Empty cart allowed entry into checkout information, but required fields blocked progression. |
| TC-12 | PASS | Item removal updated count and cart rows. |
| TC-13 | PASS | Direct unauthenticated checkout was blocked and redirected to login. |

Detailed observations are recorded in [exploratory-testing-results.md](../test-evidence/exploratory-testing-results.md).

### Screenshots

- [Checkout overview](../test-evidence/screenshots/checkout-overview.png)
- [Invalid checkout data accepted](../test-evidence/screenshots/invalid-checkout-accepted.png)
- [Order confirmation](../test-evidence/screenshots/order-confirmation.png)

## Automated test results

Suite: [checkout-test-cases.spec.ts](../tests/saucedemo-checkout/checkout-test-cases.spec.ts)  
Command: `npx playwright test tests/saucedemo-checkout --project=chromium --reporter=line --workers=1`

| Test case | Final status | Notes |
|---|---|---|
| TC-01 | PASS | Cart item details and actions. |
| TC-02 | PASS | Continue Shopping preserves cart. |
| TC-03 | PASS | Checkout information entry and valid overview transition. |
| TC-04 | PASS | Required fields validated independently. |
| TC-05 | FAIL — known defect | Whitespace-only values advance to overview; assertion intentionally preserved. |
| TC-06 | PASS | Corrected assertions to accessible summary text; underlying totals match. |
| TC-07 | PASS | Cancel preserves uncompleted order. |
| TC-08 | PASS | Order confirmation and Back Home. |
| TC-09 | PASS | Cart clears after completion. |
| TC-10 | PASS | Corrected browser-history expectations to account for the extra information-page history entry. |
| TC-11 | PASS | Empty cart cannot complete checkout because required details block progression. |
| TC-12 | PASS | Cart item removal and count update. |
| TC-13 | PASS | Authentication requirement. |

### Healing activities

- Replaced non-existent summary CSS selectors with exact visible text assertions for item total, tax, and total (TC-06).
- Updated TC-10 browser Back sequence to model the history entry created when resubmitting checkout information.
- Kept TC-05 assertions aligned to AC5; no change was made to mask the real application failure.
- Final chromium run status manifest recorded one failed test (TC-05), no other failed cases. Test outputs under `test-results/` are ignored and are not committed.

## Defects log

### BUG-01 — Checkout accepts invalid customer information

- **Severity:** Medium (proposed)
- **Acceptance criterion:** AC5
- **Description:** Checkout accepts whitespace-only fields, names containing only special characters, and malformed postal values.
- **Steps to reproduce:** Log in; add any product; open Cart → Checkout; enter whitespace-only values or special-character names and malformed postal data; click Continue.
- **Expected:** Display field-specific validation errors and remain on the information page.
- **Actual:** Navigation to Checkout Overview succeeds without any validation message.
- **Evidence:** [invalid-checkout-accepted.png](../test-evidence/screenshots/invalid-checkout-accepted.png)
- **Status:** Open; no application code change made.

## Environment details

- App URL: https://www.saucedemo.com
- Browser project: Chromium (Playwright)
- Node.js: v20.12.2
- Playwright dependency: `@playwright/test` ^1.64.1
- The demo account credentials are documented in the user story and publicly displayed by the demo app.
- Console showed intermittent 401 resource responses and 404 responses during direct checkout testing; they did not prevent the exercised flows.

## Test coverage analysis

| Criterion / rule | Manual coverage | Automated coverage | Gap |
|---|---|---|---|
| AC1 — Cart review | TC-01, TC-02, TC-11, TC-12 | TC-01, TC-02, TC-11, TC-12 | Empty-cart checkout control is present; unable to progress without valid information. |
| AC2 — Information entry | TC-03, TC-04, TC-10 | TC-03, TC-04, TC-10 | Manual field omission permutations sampled, automation covers all. |
| AC3 — Overview | TC-06, TC-07, TC-10 | TC-06, TC-07, TC-10 | No material functional gap identified. |
| AC4 — Completion | TC-08, TC-09 | TC-08, TC-09 | No material functional gap identified. |
| AC5 — Invalid data | TC-05 | TC-05 | Defect confirmed for whitespace and invalid non-empty data. |
| Business Rule 1 — Authentication | TC-13 | TC-13 | Direct checkout route verified. |
| Business Rule 2 — Cart clearing | TC-09 | TC-09 | Verified after Back Home. |

## Recommendations

1. Fix server/client validation for blank-equivalent values, names, and postal codes in accordance with AC5; retain TC-05 as a regression test.
2. Run the Chromium suite in CI and keep `--project=chromium` to honor the Chrome-only requirement.
3. Add manual regression checks for all missing-field permutations and browser Back from every checkout page.
4. Confirm whether the observed 401/404 console requests are expected for the demo environment.
5. Re-run automation after the application fix; the suite should then pass all 13 cases.

## Overall quality assessment

Core cart and checkout behavior is functional and the automation now verifies the primary business flow. The AC5 validation defect remains the principal risk and should be fixed before sign-off. Current automated test status is 12/13 passing, with the one failure documenting a real requirement mismatch rather than a test artifact.
