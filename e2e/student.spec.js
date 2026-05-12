import { test, expect } from '@playwright/test';
import { createJwt, mockCurrentUser, mockStudentProfile } from './helpers.js';

test.describe('Student Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the login API response for a Student user
    await page.route('**/api/auth/login', async route => {
      const user = { id: 1, role: 'student', email: 'student@example.com' };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: createJwt('student', { id: 1 }),
          user
        })
      });
    });

    await mockCurrentUser(page, { id: 1, role: 'student', email: 'student@example.com' });
    await mockStudentProfile(page);

    // Mock job matches fetch
    await page.route('**/api/matches', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              posting_id: 101,
              overall_score: 95,
              skill_score: 90,
              location_score: 100,
              availability_score: 95,
              OjtPosting: {
                id: 101,
                title: 'Frontend Developer Intern',
                location: 'Remote',
                duration_weeks: 12,
                Company: { company_name: 'Tech Corp' }
              }
            }
          ]
        })
      });
    });

    // Perform Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@example.com');
    await page.fill('input[type="password"]', 'securepass123');
    await page.click('button[type="submit"]');

    // Wait for the mock to resolve and perform the client-side redirect
    await page.waitForURL('**/student/dashboard');
  });

  test('successfully navigates to student dashboard and displays profile info', async ({ page }) => {
    // Verify Dashboard layout headers
    const dashboardHeader = page.locator('h1', { hasText: 'Student Dashboard' });
    await expect(dashboardHeader).toBeVisible();

    // Verify mock profile data loaded based on our route mocking
    await expect(page.locator('text=Welcome, John!')).toBeVisible();
    await expect(page.locator('text=Profile Completeness')).toBeVisible();
  });

  test('navigates to job matches and views recommended postings', async ({ page }) => {
    // Navigate to matches board
    await page.click('text=Job Matches');
    await page.waitForURL('**/student/matches');

    const matchesHeader = page.locator('main').getByRole('heading', { name: 'Job Matches' });
    await expect(matchesHeader).toBeVisible();

    // Verify mocked job posting card rendered based on match_score
    await expect(page.locator('text=Frontend Developer Intern')).toBeVisible();
    await expect(page.getByText('95%', { exact: true }).first()).toBeVisible();
  });
});
