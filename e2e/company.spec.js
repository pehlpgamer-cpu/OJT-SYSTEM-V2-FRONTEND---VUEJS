import { test, expect } from '@playwright/test';
import { createJwt, mockCompanyPostings, mockCompanyProfile, mockCurrentUser } from './helpers.js';

test.describe('Company Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the login API response for a Company user
    const user = { id: 2, role: 'company', email: 'hr@techcorp.com' };
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

    // Mock active and closed postings
    await mockCompanyPostings(page);

    // Mock applicant fetch for a dummy posting '101'
    await page.route('**/api/company/postings/*/applications', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 55,
              student_id: 1,
              posting_id: 101,
              status: 'pending',
              cover_letter: 'I have deep experience with Vue 3 and Vite in my academic projects.',
              created_at: '2026-04-10T12:30:00Z'
            }
          ]
        })
      });
    });

    // Perform Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@techcorp.com');
    await page.fill('input[type="password"]', 'companypass123');
    await page.click('button[type="submit"]');

    // Wait for redirect to Company dashboard
    await page.waitForURL('**/company/dashboard');
  });

  test('successfully navigates to company dashboard and displays stats', async ({ page }) => {
    // Verify Dashboard layout headers
    const dashboardHeader = page.locator('h1', { hasText: 'Company Dashboard' });
    await expect(dashboardHeader).toBeVisible();

    // Verify company name rendered
    await expect(page.locator('text=Tech Corp')).toBeVisible();
    // Verify stats from mocked endpoints
    await expect(page.locator('text=Active Postings')).toBeVisible();
    await expect(page.locator('main').getByText('1').first()).toBeVisible(); // Due to array length 1 mock
  });

  test('can navigate to job postings and view active list', async ({ page }) => {
    // Navigate to Postings section
    await page.click('text=Manage Postings');
    await page.waitForURL('**/company/postings');

    // Verify list headers
    const listHeader = page.locator('main').getByRole('heading', { name: 'Job Postings' });
    await expect(listHeader).toBeVisible();

    // Ensure mock posting is present
    await expect(page.locator('text=Frontend Developer Intern')).toBeVisible();
    await expect(page.getByText('ACTIVE', { exact: true })).toBeVisible();
    await expect(page.locator('text=Remote')).toBeVisible();
  });

  test('can navigate to applications review and verify candidate', async ({ page }) => {
    await page.goto('/company/postings/101/applications');
    
    // Verify Review dashboard
    const reviewHeader = page.locator('main').getByRole('heading', { name: 'Review Applications' });
    await expect(reviewHeader).toBeVisible();

    // Ensure candidate mock mounted
    await expect(page.locator('text=Student #1')).toBeVisible();
    await expect(page.locator('text=PENDING')).toBeVisible();
    // Validate the candidate's cover letter string is present
    await expect(page.locator('text=I have deep experience with Vue 3 and Vite')).toBeVisible();
    
    // Verify decision actions exist
    const acceptBtn = page.locator('button', { hasText: 'Accept' });
    const rejectBtn = page.locator('button', { hasText: 'Reject' });
    const shortlistBtn = page.locator('button', { hasText: 'Shortlist' });

    await expect(acceptBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();
    await expect(shortlistBtn).toBeVisible();
  });
});
