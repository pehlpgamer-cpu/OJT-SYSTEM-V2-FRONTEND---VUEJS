import { test, expect } from '@playwright/test';

test.describe('Student Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the login API response for a Student user
    await page.route('**/api/v1/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-student-jwt-token',
          user: { id: 1, role: 'student', email: 'student@example.com' }
        })
      });
    });

    // Mock student profile fetch
    await page.route('**/api/v1/student/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            first_name: 'John',
            last_name: 'Doe',
            university: 'State University',
            course: 'Computer Science',
            skills: ['Vue.js', 'JavaScript', 'Tailwind']
          }
        })
      });
    });

    // Mock job matches fetch
    await page.route('**/api/v1/student/matches', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              posting_id: 101,
              title: 'Frontend Developer Intern',
              company_name: 'Tech Corp',
              match_score: 95,
              status: 'pending'
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
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Computer Science')).toBeVisible();
  });

  test('navigates to job matches and views recommended postings', async ({ page }) => {
    // Navigate to matches board
    await page.click('text=Job Matches');
    await page.waitForURL('**/student/matches');

    const matchesHeader = page.locator('h1', { hasText: 'Your Job Matches' });
    await expect(matchesHeader).toBeVisible();

    // Verify mocked job posting card rendered based on match_score
    await expect(page.locator('text=Frontend Developer Intern')).toBeVisible();
    await expect(page.locator('text=95% Match')).toBeVisible();
  });
});
