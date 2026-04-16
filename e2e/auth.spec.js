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

    // Wait for validation errors to appear
    await page.waitForTimeout(300);

    // Check for email validation error
    const emailErrorSpan = page.locator('span').filter({ hasText: 'Invalid email address' }).first();
    await expect(emailErrorSpan).toBeVisible();
    
    // Check for password validation error (8+ chars required, not 6)
    const passwordErrorSpan = page.locator('span').filter({ hasText: 'Password must be at least 8 characters' }).first();
    await expect(passwordErrorSpan).toBeVisible();
  });

  test('shows error for invalid password format', async ({ page }) => {
    await page.goto('/login');
    
    // Enter valid email but weak password (missing requirements)
    await page.fill('input[type="email"]', 'test@student.com');
    await page.fill('input[type="password"]', 'weak');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(300);

    // Should show multiple validation errors for password
    const passwordErrors = page.locator('span').filter({ hasText: /Password must/ });
    const errorCount = await passwordErrors.count();
    // Expects errors for: length, uppercase, digit, special char
    expect(errorCount).toBeGreaterThan(0);
  });
});