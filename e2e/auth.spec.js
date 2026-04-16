import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // The router might redirect unauthenticated users to /login 
    await expect(page).toHaveURL(/.*\/login/);

    const loginHeader = page.locator('h2', { hasText: 'Sign in to your account' });
    await expect(loginHeader).toBeVisible();
  });

  test('shows validation errors on empty submission', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('button[type="submit"]');

    const emailError = page.locator('text=Email must be a valid email address');
    const passwordError = page.locator('span', { hasText: 'Password must be at least 6 characters' });

    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
  });
});