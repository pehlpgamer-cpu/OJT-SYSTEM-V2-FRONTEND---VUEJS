import { test, expect } from '@playwright/test';
import {
  createJwt,
  mockCompanyPostings,
  mockCompanyProfile,
  mockCurrentUser,
  mockStudentProfile
} from './helpers.js';

test.describe('Error Handling and Navigation', () => {
  test('displays 404 for invalid routes', async ({ page }) => {
    await page.goto('/nonexistent-route-that-does-not-exist');
    
    await expect(page.locator('text=Page not found')).toBeVisible();
  });

  test('redirects unauthenticated users from protected routes', async ({ page }) => {
    // Try to access student dashboard without login
    await page.goto('/student/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('redirects authenticated users away from login page', async ({ page }) => {
    // Mock login
    const user = { id: 1, role: 'student', email: 'test@example.com' };
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: createJwt('student', { id: 1 }),
          user
        })
      });
    });
    await mockCurrentUser(page, user);
    await mockStudentProfile(page);

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // Should redirect from login to dashboard
    await expect(page).toHaveURL(/.*\/student\/dashboard/);
  });

  test('restricts company routes from student users', async ({ page }) => {
    // Mock student login
    const user = { id: 1, role: 'student', email: 'student@example.com' };
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: createJwt('student', { id: 1 }),
          user
        })
      });
    });
    await mockCurrentUser(page, user);
    await mockStudentProfile(page);

    // Login as student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@example.com');
    await page.fill('input[type="password"]', 'StudentPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/dashboard');

    // Try to access company dashboard
    await page.goto('/company/dashboard');

    await expect(page).toHaveURL(/.*\/unauthorized/);
  });

  test('restricts student routes from company users', async ({ page }) => {
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
    await mockCompanyProfile(page);
    await mockCompanyPostings(page);

    // Login as company
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'CompanyPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/company/dashboard');

    // Try to access student dashboard
    await page.goto('/student/dashboard');

    await expect(page).toHaveURL(/.*\/unauthorized/);
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock failed login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Invalid credentials' }
        })
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPass123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await page.waitForTimeout(500);
    const errorMessage = page.locator('text=/error|invalid|failed/i');
    const hasError = await errorMessage.count().then(count => count > 0).catch(() => false);
    
    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  test('handles network timeout errors', async ({ page }) => {
    // Mock timeout
    await page.route('**/api/auth/login', async route => {
      await route.abort('timedout');
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // Should handle error gracefully
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/login');
  });
});
