# Saucedemo Checkout Test Plan

**Application:** https://www.saucedemo.com  
**Browser:** Chromium / Chrome only  
**Viewport for exploratory execution:** 1280 × 720 (no resizing)  
**Test account:** `standard_user` / `secret_sauce`  
**User story source:** `user-storeis/Soucedemo-ecommerce.md`

## Scope and assumptions

Validate cart contents and pricing, checkout information fields and validation, order overview, completion, cart clearing, and navigation including browser Back. The application is a fixed demo catalog; order totals and customer details are expected to be deterministic. AC5's invalid-data behavior will be evaluated against the stated requirement; any mismatch will be recorded as a possible product defect rather than weakening assertions. Each scenario starts with a clean browser context and resets cart state as needed.

## Test scenarios

### TC-01 — Cart displays selected items, quantities, and prices (AC1)
**Preconditions:** Logged out; clean browser context.  
**Test data:** Sauce Labs Backpack ($29.99), Sauce Labs Bike Light ($9.99).

| Step | Action | Expected result |
|---|---|---|
| 1 | Open the application and log in using the supplied standard account. | Products inventory page is displayed. |
| 2 | Add Sauce Labs Backpack and Sauce Labs Bike Light to the cart. | Each action changes its control to Remove; cart badge shows 2. |
| 3 | Open Cart. | Cart page shows both selected product names, descriptions, unit prices, and quantity 1 each. |
| 4 | Inspect cart total/summary and available actions. | Cart has Continue Shopping and Checkout controls; no checkout totals are incorrectly presented as item unit prices. |

### TC-02 — Continue Shopping returns to inventory with cart retained (AC1)
**Preconditions:** Logged in with one item in cart.  
**Test data:** Sauce Labs Backpack.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open Cart and click Continue Shopping. | Inventory page is shown. |
| 2 | Reopen Cart. | Previously selected Backpack remains in the cart and the badge reflects one item. |

### TC-03 — Proceed from cart to checkout information (AC2)
**Preconditions:** Logged in with at least one cart item.  
**Test data:** Sauce Labs Backpack; first name `Ada`, last name `Lovelace`, postal code `94105`.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open Cart and click Checkout. | Checkout information page is displayed. |
| 2 | Inspect the form. | First Name, Last Name, and Zip/Postal Code fields and Continue/Cancel controls are available. |
| 3 | Enter all supplied valid values and click Continue. | Checkout overview loads and the order remains present. |

### TC-04 — Each required checkout field is validated independently (AC2)
**Preconditions:** On checkout information page with a non-empty cart.  
**Test data:** Leave each required field blank in turn; fill other fields with valid values.

| Step | Action | Expected result |
|---|---|---|
| 1 | Submit with all fields blank. | Checkout does not advance; a required-field error is shown. |
| 2 | Fill First Name and Last Name; leave Zip/Postal Code blank; submit. | Checkout does not advance; error identifies the postal/zip field as required. |
| 3 | Fill First Name and Zip/Postal Code; leave Last Name blank; submit. | Checkout does not advance; error identifies Last Name as required. |
| 4 | Fill Last Name and Zip/Postal Code; leave First Name blank; submit. | Checkout does not advance; error identifies First Name as required. |
| 5 | Dismiss the error and verify form remains usable. | Error can be dismissed and valid entries remain available for correction. |

### TC-05 — Invalid or incomplete checkout information is rejected (AC5)
**Preconditions:** On checkout information page with a non-empty cart.  
**Test data:** Whitespace-only values; special-character names (`!@#`); malformed/letters-only postal code (`abc-!?`).

| Step | Action | Expected result |
|---|---|---|
| 1 | Submit whitespace-only values. | Form rejects blank-equivalent values with a useful validation message and stays on the information page. |
| 2 | Submit special-character names with otherwise complete data. | Invalid names are rejected with actionable validation feedback; no overview is shown. |
| 3 | Submit malformed postal data with otherwise complete values. | Invalid postal data is rejected with actionable validation feedback; no overview is shown. |
| 4 | Replace with valid data and submit. | Form proceeds to overview. |

**Note:** AC5 explicitly requires invalid-data validation. If the live app accepts these values, record actual results as a defect/gap; do not reinterpret the requirement.

### TC-06 — Overview summarizes order, payment, shipping, subtotal, tax, and total (AC3)
**Preconditions:** Non-empty cart; valid checkout information submitted.  
**Test data:** Backpack ($29.99) and Bike Light ($9.99); valid customer data.

| Step | Action | Expected result |
|---|---|---|
| 1 | Proceed from information page to overview. | Checkout Overview page is displayed with both expected items, quantities, and prices. |
| 2 | Inspect payment and shipping sections. | Payment information and shipping information are present and readable. |
| 3 | Inspect price summary. | Item subtotal is $39.98; tax and total are displayed; total equals subtotal plus tax (rounding to cents). |
| 4 | Inspect available actions. | Cancel and Finish controls are available. |

### TC-07 — Cancel checkout returns to inventory without completing an order (AC3)
**Preconditions:** On overview with a non-empty cart.  
**Test data:** Backpack and valid customer data.

| Step | Action | Expected result |
|---|---|---|
| 1 | Click Cancel on overview. | User returns to inventory; confirmation page is not shown. |
| 2 | Open Cart. | Order was not completed; items remain unless the application explicitly documents another behavior. Record actual cart behavior. |

### TC-08 — Finish order shows confirmation and Back Home returns to products (AC4)
**Preconditions:** On overview with valid order details.  
**Test data:** At least one item; valid first/last name and postal code.

| Step | Action | Expected result |
|---|---|---|
| 1 | Click Finish. | Checkout complete page is displayed. |
| 2 | Inspect confirmation content. | Success message confirms order completion. |
| 3 | Click Back Home. | Products inventory page is displayed. |

### TC-09 — Completed order clears the cart (AC4; Business Rule 2)
**Preconditions:** A successful order has just been completed.  
**Test data:** At least one item.

| Step | Action | Expected result |
|---|---|---|
| 1 | From confirmation, click Back Home. | Inventory page is shown. |
| 2 | Open Cart. | Cart is empty and no previous item badge/content remains. |

### TC-10 — Browser Back navigation through checkout preserves safe state (AC2, AC3; Technical Note)
**Preconditions:** Logged in with one item; entered valid checkout data and reached overview.  
**Test data:** Backpack; `Ada`, `Lovelace`, `94105`.

| Step | Action | Expected result |
|---|---|---|
| 1 | Use browser Back once from overview. | Checkout information page is restored or the app navigates to the preceding checkout step without an error. |
| 2 | Verify fields and cart state. | Checkout flow remains usable; cart contents are not lost. Note whether previously entered values are retained. |
| 3 | Use Continue again with valid data. | Overview can be reached again and order summary remains correct. |
| 4 | Use browser Back to Cart. | Cart page is reachable without a broken/blank state and the item remains present. |

### TC-11 — Empty cart cannot begin checkout (AC1, AC2)
**Preconditions:** Logged in; cart empty.  
**Test data:** None.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open Cart without adding items. | Cart page shows an empty state and no product rows. |
| 2 | Inspect checkout control. | Checkout is absent, disabled, or otherwise does not allow an invalid empty order. Record actual behavior. |

### TC-12 — Cart item can be removed and cart count updates (AC1)
**Preconditions:** Logged in with two items in cart.  
**Test data:** Backpack and Bike Light.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open Cart. | Both products and badge count 2 are shown. |
| 2 | Remove Bike Light. | Bike Light row disappears and badge/count reflects one item. |
| 3 | Verify remaining cart contents. | Backpack remains with correct quantity and price. |

### TC-13 — Checkout access requires authentication (Business Rule 1)
**Preconditions:** Logged out; clean browser context.  
**Test data:** Direct checkout URL `/checkout-step-one.html`.

| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate directly to the checkout information URL without logging in. | User is redirected to login or otherwise prevented from accessing checkout. |
| 2 | Log in with the supplied standard account. | User can access the inventory and proceed through checkout normally. |

## Test data and coverage mapping

| Data set | Values | Use |
|---|---|---|
| Valid account | `standard_user` / `secret_sauce` | All authenticated scenarios |
| Valid checkout info | `Ada` / `Lovelace` / `94105` | Happy paths and navigation |
| Cart pricing set | Backpack $29.99, Bike Light $9.99 | Item details, subtotal/tax/total |
| Invalid checkout values | empty, whitespace-only, `!@#`, `abc-!?` | Required-field and AC5 validation |
| Empty cart | no selected items | Empty-state and checkout guard |

| Acceptance criterion / rule | Scenarios |
|---|---|
| AC1 — Cart review | TC-01, TC-02, TC-11, TC-12 |
| AC2 — Checkout information entry | TC-03, TC-04, TC-10 |
| AC3 — Order overview | TC-06, TC-07, TC-10 |
| AC4 — Order completion | TC-08, TC-09 |
| AC5 — Invalid data handling | TC-05 |
| Business Rule 1 — Auth required | TC-13 |
| Business Rule 2 — Clear cart | TC-09 |
| Technical Note — Browser Back | TC-10 |
