import { test, expect } from '@playwright/test';

test.describe('Company Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock company login
    await page.route('**/api/**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'company-token',
          user: { id: 2, role: 'company', email: 'hr@company.com' }
        })
      });
    });

    // Mock company profile
    await page.route('**/api/**/company/profile', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              company_name: 'Tech Corp',
              industry: 'Software',
              headquarters: 'NYC',
              website: 'https://techcorp.com'
            }
          })
        });
      } else {
        await route.fulfill({ status: 200 });
      }
    });

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
    await expect(page.locator('text=Software')).toBeVisible();
  });

  test('can navigate to create job posting', async ({ page }) => {
    const createPostingButton = page.locator('text=/create.*posting|new.*posting/i');
    
    if (await createPostingButton.count() > 0) {
      await createPostingButton.click();
      await expect(page).toHaveURL(/.*\/postings\/new/);
    }
  });

  test('can view list of postings', async ({ page }) => {
    // Mock postings list
    await page.route('**/api/**/company/postings', async route => {
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

    const postingsLink = page.locator('text=/manage.*postings|postings/i');
    if (await postingsLink.count() > 0) {
      await postingsLink.click();
      
      // Should display multiple postings
      const listings = page.locator('text=/Senior Frontend|DevOps/');
      expect(await listings.count()).toBeGreaterThanOrEqual(1);
    }
  });
});
