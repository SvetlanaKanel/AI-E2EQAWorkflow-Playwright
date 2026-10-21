import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://www.saucedemo.com';
const USERNAME = 'standard_user';
const PASSWORD = 'secret_sauce';
const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';
const BACKPACK_PRICE = '$29.99';
const BIKE_LIGHT_PRICE = '$9.99';
const VALID_INFO = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '94105' };

async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.getByLabel('Username').fill(USERNAME);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/inventory\.html$/);
}

async function addProduct(page: Page, product: string) {
  const card = page.locator('.inventory_item').filter({ has: page.getByRole('button', { name: `View details for ${product}` }) });
  await card.getByRole('button', { name: 'Add to cart' }).click();
  await expect(card.getByRole('button', { name: 'Remove' })).toBeVisible();
}

async function openCart(page: Page) {
  await page.getByRole('button', { name: /^Cart/ }).click();
  await expect(page).toHaveURL(/cart\.html$/);
}

async function startCheckout(page: Page) {
  await openCart(page);
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
  await expect(page.getByText('Checkout: Your Information')).toBeVisible();
}

async function fillValidInfo(page: Page) {
  await page.getByLabel('First Name').fill(VALID_INFO.firstName);
  await page.getByLabel('Last Name').fill(VALID_INFO.lastName);
  await page.getByLabel('Zip/Postal Code').fill(VALID_INFO.postalCode);
}

async function proceedToOverview(page: Page) {
  await startCheckout(page);
  await fillValidInfo(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/checkout-step-two\.html$/);
  await expect(page.getByText('Checkout: Overview')).toBeVisible();
}

function cartRow(page: Page, product: string) {
  return page.locator('.cart_item').filter({ has: page.getByText(product, { exact: true }) });
}

function overviewRow(page: Page, product: string) {
  return page.locator('.cart_item').filter({ has: page.getByText(product, { exact: true }) });
}

test.describe('Saucedemo checkout', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // TC-13 must start logged out; all other scenarios start authenticated with an empty cart.
    if (!testInfo.title.startsWith('TC-13')) {
      await login(page);
    }
  });

  test('TC-01 — Cart displays selected items, quantities, and prices (AC1)', async ({ page }) => {
    // Add Sauce Labs Backpack and Sauce Labs Bike Light to the cart.
    await addProduct(page, BACKPACK);
    await addProduct(page, BIKE_LIGHT);
    await expect(page.getByRole('button', { name: 'Cart, 2 items' })).toBeVisible();

    // Open Cart and verify both selected products and their item details.
    await openCart(page);
    const backpack = cartRow(page, BACKPACK);
    const bikeLight = cartRow(page, BIKE_LIGHT);
    await expect(backpack).toContainText(BACKPACK_PRICE);
    await expect(backpack).toContainText('carry.allTheThings()');
    await expect(backpack.locator('.cart_quantity')).toHaveText('1');
    await expect(bikeLight).toContainText(BIKE_LIGHT_PRICE);
    await expect(bikeLight).toContainText("A red light isn't the desired state in testing");
    await expect(bikeLight.locator('.cart_quantity')).toHaveText('1');
    await expect(page.getByRole('button', { name: 'Continue Shopping' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
    await expect(page.locator('.summary_subtotal')).toHaveCount(0);
  });

  test('TC-02 — Continue Shopping returns to inventory with cart retained (AC1)', async ({ page }) => {
    // Add Backpack, open Cart, and continue shopping.
    await addProduct(page, BACKPACK);
    await openCart(page);
    await page.getByRole('button', { name: 'Continue Shopping' }).click();
    await expect(page).toHaveURL(/inventory\.html$/);

    // Reopen Cart and verify the selected item and count remain.
    await openCart(page);
    await expect(page.getByRole('button', { name: 'Cart, 1 item' })).toBeVisible();
    await expect(cartRow(page, BACKPACK)).toContainText(BACKPACK_PRICE);
  });

  test('TC-03 — Proceed from cart to checkout information (AC2)', async ({ page }) => {
    // Add an item, open checkout information, and verify the form controls.
    await addProduct(page, BACKPACK);
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByText('Checkout: Your Information')).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Zip/Postal Code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // Submit valid customer information and verify checkout overview retains the order.
    await fillValidInfo(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
    await expect(overviewRow(page, BACKPACK)).toContainText(BACKPACK_PRICE);
  });

  test('TC-04 — Each required checkout field is validated independently (AC2)', async ({ page }) => {
    // Open checkout information and submit all fields blank.
    await addProduct(page, BACKPACK);
    await startCheckout(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('First Name is required');
    await expect(page).toHaveURL(/checkout-step-one\.html$/);

    // Omit only Postal Code while supplying both names.
    await fillValidInfo(page);
    await page.getByLabel('Zip/Postal Code').clear();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('Postal Code is required');

    // Omit only Last Name while supplying First Name and Postal Code.
    await page.getByLabel('First Name').fill(VALID_INFO.firstName);
    await page.getByLabel('Last Name').clear();
    await page.getByLabel('Zip/Postal Code').fill(VALID_INFO.postalCode);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('Last Name is required');

    // Omit only First Name while supplying Last Name and Postal Code.
    await page.getByLabel('First Name').clear();
    await page.getByLabel('Last Name').fill(VALID_INFO.lastName);
    await page.getByLabel('Zip/Postal Code').fill(VALID_INFO.postalCode);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('First Name is required');

    // Dismiss validation feedback and verify the form remains usable with entered values.
    await page.locator('[data-test="error-button"]').click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('Last Name')).toHaveValue(VALID_INFO.lastName);
    await expect(page.getByLabel('Zip/Postal Code')).toHaveValue(VALID_INFO.postalCode);
  });

  test('TC-05 — Invalid or incomplete checkout information is rejected (AC5)', async ({ page }) => {
    // Open checkout information and submit whitespace-only values; reject blank-equivalent data.
    await addProduct(page, BACKPACK);
    await startCheckout(page);
    await page.getByLabel('First Name').fill('   ');
    await page.getByLabel('Last Name').fill('   ');
    await page.getByLabel('Zip/Postal Code').fill('   ');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await expect(page.getByRole('alert')).toBeVisible();

    // Submit special-character names and otherwise complete information; validation is required.
    await page.getByLabel('First Name').fill('!@#');
    await page.getByLabel('Last Name').fill('!@#');
    await page.getByLabel('Zip/Postal Code').fill(VALID_INFO.postalCode);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await expect(page.getByRole('alert')).toBeVisible();

    // Submit malformed postal data and otherwise valid names; validation is required.
    await page.getByLabel('First Name').fill(VALID_INFO.firstName);
    await page.getByLabel('Last Name').fill(VALID_INFO.lastName);
    await page.getByLabel('Zip/Postal Code').fill('abc-!?');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await expect(page.getByRole('alert')).toBeVisible();

    // Replace invalid data with valid values and verify the checkout can proceed.
    await fillValidInfo(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
    await expect(page.getByText('Checkout: Overview')).toBeVisible();
  });

  test('TC-06 — Overview summarizes order, payment, shipping, subtotal, tax, and total (AC3)', async ({ page }) => {
    // Add the pricing test set and proceed to Overview with valid customer information.
    await addProduct(page, BACKPACK);
    await addProduct(page, BIKE_LIGHT);
    await proceedToOverview(page);

    // Verify expected item quantities and unit prices.
    const backpack = overviewRow(page, BACKPACK);
    const bikeLight = overviewRow(page, BIKE_LIGHT);
    await expect(backpack).toContainText(BACKPACK_PRICE);
    await expect(backpack.locator('.cart_quantity')).toHaveText('1');
    await expect(bikeLight).toContainText(BIKE_LIGHT_PRICE);
    await expect(bikeLight.locator('.cart_quantity')).toHaveText('1');

    // Verify payment, shipping, and price summary values.
    await expect(page.getByText('SauceCard #31337')).toBeVisible();
    await expect(page.getByText('Free Pony Express Delivery!')).toBeVisible();
    await expect(page.getByText('Item total: $39.98', { exact: true })).toBeVisible();
    await expect(page.getByText('Tax: $3.20', { exact: true })).toBeVisible();
    await expect(page.getByText('Total: $43.18', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('TC-07 — Cancel checkout returns to inventory without completing an order (AC3)', async ({ page }) => {
    // Proceed to the order overview and cancel checkout.
    await addProduct(page, BACKPACK);
    await proceedToOverview(page);
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify Products is shown and the uncompleted item remains in Cart.
    await expect(page).toHaveURL(/inventory\.html$/);
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page.getByText('Thank you for your order!')).toHaveCount(0);
    await openCart(page);
    await expect(cartRow(page, BACKPACK)).toContainText(BACKPACK_PRICE);
  });

  test('TC-08 — Finish order shows confirmation and Back Home returns to products (AC4)', async ({ page }) => {
    // Complete a valid single-item order.
    await addProduct(page, BACKPACK);
    await proceedToOverview(page);
    await page.getByRole('button', { name: 'Finish' }).click();

    // Verify successful order confirmation.
    await expect(page).toHaveURL(/checkout-complete\.html$/);
    await expect(page.getByText('Checkout: Complete!')).toBeVisible();
    await expect(page.getByText('Thank you for your order!')).toBeVisible();

    // Return to Products using Back Home.
    await page.getByRole('button', { name: 'Back Home' }).click();
    await expect(page).toHaveURL(/inventory\.html$/);
    await expect(page.getByText('Products')).toBeVisible();
  });

  test('TC-09 — Completed order clears the cart (AC4; Business Rule 2)', async ({ page }) => {
    // Complete an order and return to Products.
    await addProduct(page, BACKPACK);
    await proceedToOverview(page);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page.getByText('Thank you for your order!')).toBeVisible();
    await page.getByRole('button', { name: 'Back Home' }).click();
    await expect(page).toHaveURL(/inventory\.html$/);

    // Open Cart and verify no item rows or badge content remain.
    await openCart(page);
    await expect(page.locator('.cart_item')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  });

  test('TC-10 — Browser Back navigation through checkout preserves safe state (AC2, AC3)', async ({ page }) => {
    // Reach Overview with a Backpack and valid checkout information.
    await addProduct(page, BACKPACK);
    await proceedToOverview(page);

    // Use browser Back once and verify checkout information is restored and remains usable.
    await page.goBack();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await expect(page.getByText('Checkout: Your Information')).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cart, 1 item' })).toBeVisible();
    await fillValidInfo(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
    await expect(overviewRow(page, BACKPACK)).toContainText(BACKPACK_PRICE);

    // Resubmitting checkout information adds a history entry, so the first Back returns to it.
    await page.goBack();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);

    // Go Back once more to return to Cart and verify the item is retained.
    await page.goBack();
    await expect(page).toHaveURL(/cart\.html$/);
    await expect(cartRow(page, BACKPACK)).toContainText(BACKPACK_PRICE);
  });

  test('TC-11 — Empty cart cannot begin checkout (AC1, AC2)', async ({ page }) => {
    // Open Cart without selecting products and verify the empty state.
    await openCart(page);
    await expect(page.locator('.cart_item')).toHaveCount(0);
    await expect(page.getByText(BACKPACK, { exact: true })).toHaveCount(0);

    // Sauce Demo exposes Checkout while empty; verify required information still blocks progression.
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await expect(page.getByRole('alert')).toContainText('First Name is required');
    await expect(page.getByText('Checkout: Overview')).toHaveCount(0);
  });

  test('TC-12 — Cart item can be removed and cart count updates (AC1)', async ({ page }) => {
    // Add both products, open Cart, and verify the initial contents and count.
    await addProduct(page, BACKPACK);
    await addProduct(page, BIKE_LIGHT);
    await openCart(page);
    await expect(page.getByRole('button', { name: 'Cart, 2 items' })).toBeVisible();
    await expect(cartRow(page, BACKPACK)).toBeVisible();
    const bikeLight = cartRow(page, BIKE_LIGHT);
    await expect(bikeLight).toBeVisible();

    // Remove Bike Light and verify the count, row removal, and remaining Backpack details.
    await bikeLight.getByRole('button', { name: 'Remove' }).click();
    await expect(bikeLight).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cart, 1 item' })).toBeVisible();
    const backpack = cartRow(page, BACKPACK);
    await expect(backpack).toContainText(BACKPACK_PRICE);
    await expect(backpack.locator('.cart_quantity')).toHaveText('1');
  });

  test('TC-13 — Checkout access requires authentication (Business Rule 1)', async ({ page }) => {
    // Navigate directly to checkout while logged out and verify access is blocked.
    await page.goto(`${BASE_URL}/checkout-step-one.html`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByText(/You can only access/)).toBeVisible();

    // Log in and verify authenticated access to inventory and checkout.
    await page.getByLabel('Username').fill(USERNAME);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/inventory\.html$/);
    await addProduct(page, BACKPACK);
    await startCheckout(page);
    await expect(page.getByLabel('First Name')).toBeVisible();
  });
});
