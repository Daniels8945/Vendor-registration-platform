import { test, expect } from '@playwright/test';

test.describe('Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  // ─── Dashboard ────────────────────────────────────────────────────────────

  test('dashboard renders heading and stat cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/total vendors/i)).toBeVisible();
    await expect(page.getByText(/approved/i)).toBeVisible();
    await expect(page.getByText(/pending review/i)).toBeVisible();
  });

  // ─── Sidebar navigation ───────────────────────────────────────────────────

  test('sidebar navigates to Vendor List', async ({ page }) => {
    await page.getByRole('button', { name: /vendor list/i }).click();
    await expect(page.getByRole('heading', { name: /vendor list/i })).toBeVisible();
  });

  test('sidebar navigates to Invoices', async ({ page }) => {
    await page.getByRole('button', { name: /^invoices$/i }).click();
    await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible();
  });

  test('sidebar navigates to Documents', async ({ page }) => {
    await page.getByRole('button', { name: /^documents$/i }).click();
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
  });

  // ─── Vendor List ──────────────────────────────────────────────────────────

  test.describe('Vendor List', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /vendor list/i }).click();
    });

    test('renders table headers', async ({ page }) => {
      await expect(page.getByText('Vendor Code')).toBeVisible();
      await expect(page.getByText('Company Name')).toBeVisible();
      await expect(page.getByText('Type')).toBeVisible();
      await expect(page.getByText('Contact Person')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Actions')).toBeVisible();
    });

    test('search input filters vendors', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search by company name/i);
      await searchInput.fill('nonexistent-vendor-xyz');
      await expect(page.getByText(/no vendors found/i)).toBeVisible();
    });

    test('status filter dropdown renders options', async ({ page }) => {
      const select = page.locator('select').first();
      await expect(select.locator('option', { hasText: 'All Status' })).toBeAttached();
      await expect(select.locator('option', { hasText: 'Pending Review' })).toBeAttached();
      await expect(select.locator('option', { hasText: 'Approved' })).toBeAttached();
      await expect(select.locator('option', { hasText: 'Rejected' })).toBeAttached();
    });

    test('Add Vendor button navigates to add form', async ({ page }) => {
      await page.getByRole('button', { name: /add vendor/i }).click();
      await expect(page.getByRole('heading', { name: /add new vendor/i })).toBeVisible();
    });
  });

  // ─── Add Vendor Form ──────────────────────────────────────────────────────

  test.describe('Add Vendor Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /vendor list/i }).click();
      await page.getByRole('button', { name: /add vendor/i }).click();
    });

    test('renders all required fields', async ({ page }) => {
      await expect(page.getByLabel(/company legal name/i)).toBeVisible();
      await expect(page.getByLabel(/products\/services/i)).toBeVisible();
      await expect(page.getByLabel(/company website/i)).toBeVisible();
      await expect(page.getByLabel(/contact email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /register vendor/i })).toBeVisible();
    });

    test('business type radio buttons are present', async ({ page }) => {
      await expect(page.getByRole('radio', { name: /manufacturer/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /distributor/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /service provider/i })).toBeVisible();
    });

    test('cancel button returns to vendor list', async ({ page }) => {
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page.getByRole('heading', { name: /vendor list/i })).toBeVisible();
    });

    test('submitting blank required fields shows browser validation', async ({ page }) => {
      await page.getByRole('button', { name: /register vendor/i }).click();
      // HTML5 required validation prevents submission — form stays on page
      await expect(page.getByRole('heading', { name: /add new vendor/i })).toBeVisible();
    });

    test('fills and submits a new vendor', async ({ page }) => {
      await page.getByLabel(/company legal name/i).fill('Playwright Test Co');
      await page.getByRole('radio', { name: /distributor/i }).check();
      await page.getByLabel(/products\/services/i).fill('Testing services and QA tools');
      await page.getByLabel(/company website/i).fill('https://example.com');

      // Address
      await page.getByPlaceholder(/street address$/i).fill('123 Test Street');
      await page.getByPlaceholder(/city/i).fill('Lagos');
      await page.locator('select[name="country"]').selectOption('Nigeria');

      // Contact
      await page.getByPlaceholder(/first name/i).fill('John');
      await page.getByPlaceholder(/last name/i).fill('Doe');
      await page.getByLabel(/contact email/i).fill('john@playwright.test');

      await page.getByRole('button', { name: /register vendor/i }).click();

      // Should redirect to vendor list and show success toast
      await expect(page.getByRole('heading', { name: /vendor list/i })).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── Vendor actions dropdown ──────────────────────────────────────────────

  test.describe('Vendor actions dropdown', () => {
    test.beforeEach(async ({ page }) => {
      // Add a vendor first so the table has at least one row
      await page.getByRole('button', { name: /vendor list/i }).click();
      await page.getByRole('button', { name: /add vendor/i }).click();
      await page.getByLabel(/company legal name/i).fill('Dropdown Test Co');
      await page.getByLabel(/products\/services/i).fill('Services');
      await page.getByLabel(/company website/i).fill('https://example.com');
      await page.getByPlaceholder(/street address$/i).fill('1 Road');
      await page.getByPlaceholder(/city/i).fill('Abuja');
      await page.locator('select[name="country"]').selectOption('Nigeria');
      await page.getByPlaceholder(/first name/i).fill('Ada');
      await page.getByPlaceholder(/last name/i).fill('Test');
      await page.getByLabel(/contact email/i).fill('ada@test.com');
      await page.getByRole('button', { name: /register vendor/i }).click();
      await expect(page.getByRole('heading', { name: /vendor list/i })).toBeVisible({ timeout: 5000 });
    });

    test('opens dropdown on clicking MoreVertical button', async ({ page }) => {
      await page.locator('button[title="Actions"]').first().click();
      await expect(page.getByRole('button', { name: /view profile/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /quick view/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /delete vendor/i })).toBeVisible();
    });

    test('dropdown closes when clicking backdrop', async ({ page }) => {
      await page.locator('button[title="Actions"]').first().click();
      await expect(page.getByRole('button', { name: /view profile/i })).toBeVisible();
      // Click backdrop (fixed inset-0 overlay)
      await page.mouse.click(10, 10);
      await expect(page.getByRole('button', { name: /view profile/i })).not.toBeVisible();
    });

    test('Quick View opens vendor detail modal', async ({ page }) => {
      await page.locator('button[title="Actions"]').first().click();
      await page.getByRole('button', { name: /quick view/i }).click();
      await expect(page.getByText(/vendor code/i)).toBeVisible();
    });

    test('View Profile navigates to profile page', async ({ page }) => {
      await page.locator('button[title="Actions"]').first().click();
      await page.getByRole('button', { name: /view profile/i }).click();
      await expect(page.getByRole('button', { name: /back to vendor list/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /overview/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /invoices/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /documents/i })).toBeVisible();
    });
  });

  // ─── Vendor Profile tabs ──────────────────────────────────────────────────

  test.describe('Vendor Profile View', () => {
    test.beforeEach(async ({ page }) => {
      // Seed a vendor then open its profile
      await page.getByRole('button', { name: /vendor list/i }).click();
      await page.getByRole('button', { name: /add vendor/i }).click();
      await page.getByLabel(/company legal name/i).fill('Profile Test Corp');
      await page.getByLabel(/products\/services/i).fill('Consulting');
      await page.getByLabel(/company website/i).fill('https://example.com');
      await page.getByPlaceholder(/street address$/i).fill('5 Profile Ave');
      await page.getByPlaceholder(/city/i).fill('Kano');
      await page.locator('select[name="country"]').selectOption('Nigeria');
      await page.getByPlaceholder(/first name/i).fill('Emeka');
      await page.getByPlaceholder(/last name/i).fill('Obi');
      await page.getByLabel(/contact email/i).fill('emeka@corp.com');
      await page.getByRole('button', { name: /register vendor/i }).click();
      await expect(page.getByRole('heading', { name: /vendor list/i })).toBeVisible({ timeout: 5000 });

      await page.locator('button[title="Actions"]').first().click();
      await page.getByRole('button', { name: /view profile/i }).click();
    });

    test('shows vendor banner with company name and status', async ({ page }) => {
      await expect(page.getByText('Profile Test Corp')).toBeVisible();
      await expect(page.getByText('Pending Review')).toBeVisible();
    });

    test('Overview tab shows contact information', async ({ page }) => {
      await page.getByRole('button', { name: /overview/i }).click();
      await expect(page.getByText(/contact information/i)).toBeVisible();
      await expect(page.getByText('emeka@corp.com')).toBeVisible();
    });

    test('Invoices tab shows empty state when no invoices', async ({ page }) => {
      await page.getByRole('button', { name: /invoices/i }).click();
      await expect(page.getByText(/no invoices submitted/i)).toBeVisible();
    });

    test('Documents tab shows empty state when no documents', async ({ page }) => {
      await page.getByRole('button', { name: /documents/i }).click();
      await expect(page.getByText(/no documents uploaded/i)).toBeVisible();
    });

    test('Back button returns to vendor list', async ({ page }) => {
      await page.getByRole('button', { name: /back to vendor list/i }).click();
      await expect(page.getByRole('heading', { name: /vendor list/i })).toBeVisible();
    });
  });

  // ─── Invoices view ────────────────────────────────────────────────────────

  test.describe('Admin Invoices View', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /^invoices$/i }).click();
    });

    test('renders stat cards', async ({ page }) => {
      await expect(page.getByText(/total invoices/i)).toBeVisible();
      await expect(page.getByText(/pending review/i)).toBeVisible();
    });

    test('search input is visible', async ({ page }) => {
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });
  });

  // ─── Documents view ───────────────────────────────────────────────────────

  test.describe('Admin Documents View', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /^documents$/i }).click();
    });

    test('renders stat cards', async ({ page }) => {
      await expect(page.getByText(/total documents/i)).toBeVisible();
    });

    test('search input is visible', async ({ page }) => {
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });
  });
});
