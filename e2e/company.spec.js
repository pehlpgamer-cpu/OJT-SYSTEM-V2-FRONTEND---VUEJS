import { test, expect } from '@playwright/test';

test.describe('Company Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the login API response for a Company user
    await page.route('**/api/v1/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-company-jwt-token',
          user: { id: 2, role: 'company', email: 'hr@techcorp.com' }
        })
      });
    });

    // Mock company profile fetch
    await page.route('**/api/v1/company/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            company_name: 'Tech Corp',
            industry: 'Software Development',
            headquarters: 'New York, NY',
            website: 'https://techcorp.com',
            size: '50-200'
          }
        })
      });
    });

    // Mock active and closed postings
    await page.route('**/api/v1/company/postings', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 101,
              title: 'Frontend Developer Intern',
              location: 'Remote',
              status: 'active',
              positions_available: 3,
              duration_weeks: 12,
              created_at: '2026-04-01T10:00:00Z'
            }
          ]
        })
      });
    });

    // Mock applicant fetch for a dummy posting '101'
    await page.route('**/api/v1/company/postings/*/applications', async route => {
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
    await expect(page.locator('text=Software Development')).toBeVisible();
    // Verify stats from mocked endpoints
    await expect(page.locator('text=Active Postings')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible(); // Due to array length 1 mock
  });

  test('can navigate to job postings and view active list', async ({ page }) => {
    // Navigate to Postings section
    await page.click('text=Manage Postings');
    await page.waitForURL('**/company/postings');

    // Verify list headers
    const listHeader = page.locator('h1', { hasText: 'Job Postings' });
    await expect(listHeader).toBeVisible();

    // Ensure mock posting is present
    await expect(page.locator('text=Frontend Developer Intern')).toBeVisible();
    await expect(page.locator('text=ACTIVE')).toBeVisible();
    await expect(page.locator('text=Remote')).toBeVisible();
  });

  test('can navigate to applications review and verify candidate', async ({ page }) => {
    await page.goto('/company/postings/101/applications');
    
    // Verify Review dashboard
    const reviewHeader = page.locator('h1', { hasText: 'Review Applications' });
    await expect(reviewHeader).toBeVisible();

    // Ensure candidate mock mounted
    await expect(page.locator('text=Student #1')).toBeVisible();
    await expect(page.locator('text=PENDING')).toBeVisible();
    // Validate the candidate's cover letter string is present
    await expect(page.locator('text="I have deep experience with Vue 3 and Vite in my academic projects."')).toBeVisible();
    
    // Verify decision actions exist
    const acceptBtn = page.locator('button', { hasText: 'Accept' });
    const rejectBtn = page.locator('button', { hasText: 'Reject' });
    const shortlistBtn = page.locator('button', { hasText: 'Shortlist' });

    await expect(acceptBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();
    await expect(shortlistBtn).toBeVisible();
  });
});
