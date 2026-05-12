import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // The router might redirect unauthenticated users to /login 
    await expect(page).toHaveURL(/.*\/login/);

    const loginHeader = page.locator('h2', { hasText: 'Sign in to your account' });
    await expect(loginHeader).toBeVisible();
  });

  test('renders login controls', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('a', { hasText: /register/i })).toBeVisible();
  });

  test('does not apply registration password-strength rules on login', async ({ page }) => {
    let loginRequests = 0;
    await page.route('**/api/auth/login', async route => {
      loginRequests += 1;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' })
      });
    });

    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'test@student.com');
    await page.fill('input[type="password"]', 'weak');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials').first()).toBeVisible();
    expect(loginRequests).toBe(1);
  });
});
