# Saucedemo Exploratory Testing Results

**Date:** 2026-10-21  
**Environment:** https://www.saucedemo.com, Chromium via browser tools, desktop session (not resized; requested 1280 × 720)  
**Account:** `standard_user` / `secret_sauce`  
**Plan:** [Test plan](../specs/saucedemo-checkout-test-plan.md)

## Execution summary

Exploratory testing confirmed the main checkout path, basic required-field validation, cart updates, order totals, confirmation, cart clearing, and authentication gating. Invalid non-empty checkout values were accepted, contrary to AC5. The browser session was not resized during these checks. A few plan cases were sampled rather than exhaustively executed; see coverage notes below.

| Test case | Result | Observation |
|---|---|---|
| TC-01 | PASS | Backpack and Bike Light appeared in Cart with descriptions, quantity 1, prices $29.99 and $9.99; badge showed 2. |
| TC-02 | PASS | Continue Shopping returned to Products and the cart retained both items. |
| TC-03 | PASS | Checkout opened the information form with First Name, Last Name, Zip/Postal Code, Continue, and Cancel. Valid data reached overview. |
| TC-04 | PASS (sampled) | Empty submission displayed “Error: First Name is required”; omitting postal code after filling names displayed “Error: Postal Code is required.” Not every independent missing-field permutation was manually checked. |
| TC-05 | FAIL — defect | Special-character names (`!@#`) and malformed postal value (`abc-!?`) were accepted and proceeded to Overview without validation feedback. See evidence screenshot and defect note. |
| TC-06 | PASS | Two-item summary showed SauceCard #31337, Free Pony Express Delivery!, item total $39.98, tax $3.20, total $43.18, Cancel, and Finish. |
| TC-07 | PASS | Cancel on overview returned to Products; items remained in the cart. |
| TC-08 | PASS | Finish showed “Thank you for your order!” and Back Home; Back Home returned to Products. |
| TC-09 | PASS | Cart badge was empty after completion and Back Home. |
| TC-10 | PASS (partial) | Browser Back from Overview restored the information page. Cart remained available; entered information was not retained. Did not exercise subsequent browser-back all the way to Cart. |
| TC-11 | PASS (guard partial) | Empty Cart showed no item rows. Checkout was available and opened information page, but required-field validation blocked proceeding. |
| TC-12 | PASS | Removing Bike Light changed count to 1; removing Backpack cleared the badge and rows. |
| TC-13 | PASS | Direct unauthenticated navigation to checkout redirected to login and displayed “You can only access '/checkout-step-one.html' when you are logged in.” |

## Defect / unexpected behavior

### EXP-01 — Checkout accepts invalid non-empty customer data

- **Severity:** Medium (proposed)
- **Acceptance criterion:** AC5
- **Steps:** Add an item, open Cart → Checkout, enter `!@#` for both names and `abc-!?` for postal code, click Continue.
- **Expected:** Invalid fields are rejected with validation feedback and the user remains on Checkout: Your Information.
- **Actual:** Checkout Overview loads without an error; payment/shipping and order buttons are available.
- **Evidence:** [invalid-checkout-accepted.png](screenshots/invalid-checkout-accepted.png)

## Screenshots

- [checkout-overview.png](screenshots/checkout-overview.png) — two-item overview and totals.
- [invalid-checkout-accepted.png](screenshots/invalid-checkout-accepted.png) — invalid data accepted and Overview displayed.
- [order-confirmation.png](screenshots/order-confirmation.png) — completed order and confirmation message.

## Reliable selectors and interaction notes

- Prefer accessible labels/roles: `getByLabel('First Name')`, `getByLabel('Last Name')`, `getByLabel('Zip/Postal Code')`, and `getByRole('button', { name: 'Continue' })`.
- Product controls are available by role/name, e.g. `getByRole('button', { name: 'Add to cart' }).` For product-specific actions, scope to the product card or use the stable product `data-test` attributes where applicable.
- Cart button accessible name includes item count, such as “Cart, 2 items” or “Cart, empty”.
- Validation feedback appears as an alert; exact observed text includes “Error: First Name is required” and “Error: Postal Code is required”.
- Avoid fixed waits; page transitions were immediately reflected in the observed URL and page heading.
- Menu links are not clickable until Open Menu is clicked; attempting to click a hidden Logout menu item timed out. Opening the menu first works reliably.

## Other observations

- Console showed repeated 401 resource responses early in the session and 404 responses on direct checkout navigation. These did not block functional checkout flows; investigate if the app owner considers them unexpected.
- The cart page exposes Checkout even when empty. The user cannot advance past checkout information without the required fields, so empty order completion was prevented at the next step.
- Manual testing covered the primary AC flows and key error conditions; not every plan step/field permutation was repeated manually. Automation is expected to extend coverage.
