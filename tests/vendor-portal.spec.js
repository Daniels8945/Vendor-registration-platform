import { test, expect } from '@playwright/test';

test.describe('Vendor Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vendor');
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  test.describe('Login Page', () => {
    test('renders login form', async ({ page }) => {
      await expect(page.getByPlaceholder(/enter your vendor code/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /access portal/i })).toBeVisible();
    });

    test('shows error for empty vendor code', async ({ page }) => {
      await page.getByRole('button', { name: /access portal/i }).click();
      await expect(page.getByText(/please enter your vendor code/i)).toBeVisible();
    });

    test('shows error for unknown vendor code', async ({ page }) => {
      await page.getByPlaceholder(/enter your vendor code/i).fill('INVALID-CODE-0000');
      await page.getByRole('button', { name: /access portal/i }).click();
      await expect(page.getByText(/vendor not found/i)).toBeVisible();
    });
  });

  // ─── Authenticated flow (seed a vendor via admin then log in) ─────────────

  test.describe('Authenticated vendor', () => {
    let vendorCode;

    test.beforeEach(async ({ page }) => {
      // Create an approved vendor through the admin portal
      await page.goto('/admin');
      await page.getByRole('button', { name: /vendor list/i }).click();
      await page.getByRole('button', { name: /add vendor/i }).click();

      await page.getByLabel(/company legal name/i).fill('E2E Vendor Ltd');
      await page.getByLabel(/products\/services/i).fill('End-to-end testing services');
      await page.getByLabel(/company website/i).fill('https://e2evendor.test');
      await page.getByPlaceholder(/street address$/i).fill('99 Test Road');
      await page.getByPlaceholder(/city/i).fill('Lagos');
      await page.locator('select[name="country"]').selectOption('Nigeria');
      await page.getByPlaceholder(/first name/i).fill('E2E');
      await page.getByPlaceholder(/last name/i).fill('Tester');
      await page.getByLabel(/contact email/i).fill('e2e@vendor.test');
      await page.getByRole('button', { name: /register vendor/i }).click();
      await expect(page.getByRole('heading', { name: /vendor list/i })).toBeVisible({ timeout: 5000 });

      // Grab the vendor code from the first row of the table
      const codeCell = page.locator('tbody tr:first-child td:first-child span');
      vendorCode = await codeCell.innerText();

      // Approve the vendor
      await page.locator('button[title="Actions"]').first().click();
      await page.getByRole('button', { name: /^approve$/i }).click();

      // Log in as the vendor
      await page.goto('/vendor');
      await page.getByPlaceholder(/enter your vendor code/i).fill(vendorCode);
      await page.getByRole('button', { name: /access portal/i }).click();
      await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 5000 });
    });

    test('dashboard renders after login', async ({ page }) => {
      await expect(page.getByText('E2E Vendor Ltd')).toBeVisible();
    });

    test('navigates to Invoices view', async ({ page }) => {
      await page.getByRole('button', { name: /^invoices$/i }).click();
      await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible();
    });

    test('invoice table is empty initially', async ({ page }) => {
      await page.getByRole('button', { name: /^invoices$/i }).click();
      await expect(page.getByText(/no invoices submitted yet/i)).toBeVisible();
    });

    test('Submit Invoice button opens form', async ({ page }) => {
      await page.getByRole('button', { name: /^invoices$/i }).click();
      await page.getByRole('button', { name: /submit invoice/i }).click();
      await expect(page.getByRole('heading', { name: /submit new invoice/i })).toBeVisible();
    });

    test('submits a new invoice', async ({ page }) => {
      await page.getByRole('button', { name: /^invoices$/i }).click();
      await page.getByRole('button', { name: /submit invoice/i }).click();

      await page.getByLabel(/amount/i).fill('50000');
      await page.locator('input[name="invoiceDate"]').fill('2026-04-01');
      await page.locator('input[name="dueDate"]').fill('2026-04-30');
      await page.getByLabel(/description/i).fill('Playwright automated test invoice');

      await page.getByRole('button', { name: /^submit invoice$/i }).click();
      await expect(page.getByText(/invoice submitted/i)).toBeVisible({ timeout: 5000 });
    });

    test('navigates to Documents view', async ({ page }) => {
      await page.getByRole('button', { name: /^documents$/i }).click();
      await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
    });

    test('documents table is empty initially', async ({ page }) => {
      await page.getByRole('button', { name: /^documents$/i }).click();
      await expect(page.getByText(/no documents uploaded yet/i)).toBeVisible();
    });

    test('logout clears session and shows login', async ({ page }) => {
      await page.getByRole('button', { name: /log out/i }).click();
      await expect(page.getByPlaceholder(/enter your vendor code/i)).toBeVisible();
    });
  });
});
