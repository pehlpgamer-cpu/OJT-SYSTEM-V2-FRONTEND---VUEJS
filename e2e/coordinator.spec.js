import { test, expect } from '@playwright/test';

test.describe('Coordinator Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Mock coordinator login
    await page.route('**/api/**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'coordinator-token',
          user: { id: 3, role: 'coordinator', email: 'coordinator@university.edu' }
        })
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'coordinator@university.edu');
    await page.fill('input[type="password"]', 'CoordPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/coordinator/dashboard');
  });

  test('displays coordinator dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/coordinator\/dashboard/);
    
    const dashboardHeader = page.locator('h1', { hasText: /Coordinator Dashboard/ });
    await expect(dashboardHeader).toBeVisible();
  });

  test('shows placeholder message for development', async ({ page }) => {
    // Should show development status message
    const devMessage = page.locator('text=/development|coming soon/i');
    const hasDevMessage = await devMessage.count().then(count => count > 0).catch(() => false);
    expect(hasDevMessage).toBeTruthy();
  });

  test('displays coordinator features list', async ({ page }) => {
    // Should show placeholder features
    const studentManagement = page.locator('text=/student management|verify.*profile/i');
    const companyVerification = page.locator('text=/company verification|approve/i');
    const jobPostings = page.locator('text=/job posting|postings/i');
    const analytics = page.locator('text=/analytics|matching.*statistics/i');

    // At least some features should be visible
    const totalFeatures = await Promise.all([
      studentManagement.count(),
      companyVerification.count(),
      jobPostings.count(),
      analytics.count()
    ]).then(counts => counts.reduce((a, b) => a + b, 0));

    expect(totalFeatures).toBeGreaterThan(0);
  });

  test('shows coming soon status for features', async ({ page }) => {
    const comingSoonLabels = page.locator('text=/Coming Soon/');
    const count = await comingSoonLabels.count();
    expect(count).toBeGreaterThan(0);
  });
});
