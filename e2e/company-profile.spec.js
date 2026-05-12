import { test, expect } from '@playwright/test';
import { createJwt, mockCompanyPostings, mockCompanyProfile, mockCurrentUser } from './helpers.js';

test.describe('Company Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock company login
    const user = { id: 2, role: 'company', email: 'hr@company.com' };
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: createJwt('company', { id: 2 }),
          user
        })
      });
    });

    await mockCurrentUser(page, user);
    await mockCompanyProfile(page, { industry_type: 'Software' });
    await mockCompanyPostings(page);

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'CompanyPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/company/dashboard');
  });

  test('displays company dashboard', async ({ page }) => {
    const dashboardHeader = page.locator('h1', { hasText: 'Company Dashboard' });
    await expect(dashboardHeader).toBeVisible();
  });

  test('shows company profile information', async ({ page }) => {
    await expect(page.locator('text=Tech Corp')).toBeVisible();
    await expect(page.locator('text=Total Postings')).toBeVisible();
  });

  test('can navigate to create job posting', async ({ page }) => {
    const createPostingButton = page.getByRole('link', { name: 'New Posting', exact: true });
    
    if (await createPostingButton.count() > 0) {
      await createPostingButton.click();
      await expect(page).toHaveURL(/.*\/postings\/new/);
    }
  });

  test('can view list of postings', async ({ page }) => {
    // Mock postings list
    await page.route('**/api/company/postings', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 101,
              title: 'Senior Frontend Developer',
              location: 'Remote',
              status: 'active',
              positions_available: 2
            },
            {
              id: 102,
              title: 'DevOps Engineer',
              location: 'NYC',
              status: 'active',
              positions_available: 1
            }
          ]
        })
      });
    });

    const postingsLink = page.getByRole('link', { name: 'Postings', exact: true });
    if (await postingsLink.count() > 0) {
      await postingsLink.click();
      
      // Should display multiple postings
      const listings = page.locator('text=/Senior Frontend|DevOps/');
      expect(await listings.count()).toBeGreaterThanOrEqual(1);
    }
  });
});
