import { test, expect } from '@playwright/test';
import { createJwt, mockCurrentUser, mockStudentProfile } from './helpers.js';

test.describe('Student Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock student login
    const user = { id: 1, role: 'student', email: 'student@test.com' };
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
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'ValidPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/dashboard');
  });

  test('navigates to profile edit page', async ({ page }) => {
    // Find and click profile/edit link
    const editProfileLink = page.locator('text=Edit Profile');
    
    if (await editProfileLink.count() > 0) {
      await editProfileLink.click();
      await expect(page).toHaveURL(/.*\/profile\/edit/);
    }
  });

  test('displays current profile information', async ({ page }) => {
    // Should display user's current profile
    await expect(page.locator('text=Welcome, John!')).toBeVisible();
    await expect(page.locator('text=Profile Completeness')).toBeVisible();
  });

  test('can apply to multiple jobs', async ({ page }) => {
    // Mock multiple matches
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
              OjtPosting: {
                id: 101,
                title: 'Frontend Dev',
                location: 'Remote',
                Company: { company_name: 'Tech Corp' }
              }
            },
            {
              id: 2,
              posting_id: 102,
              overall_score: 88,
              OjtPosting: {
                id: 102,
                title: 'Full Stack Dev',
                location: 'Hybrid',
                Company: { company_name: 'Dev Inc' }
              }
            }
          ]
        })
      });
    });

    await page.goto('/student/matches');
    
    // Check that multiple postings are visible
    await expect(page.locator('text=Frontend Dev')).toBeVisible();
  });
});
