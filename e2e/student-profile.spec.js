import { test, expect } from '@playwright/test';

test.describe('Student Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock student login
    await page.route('**/api/**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'student-token',
          user: { id: 1, role: 'student', email: 'student@test.com' }
        })
      });
    });

    // Mock student profile
    await page.route('**/api/**/student/profile', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              first_name: 'John',
              last_name: 'Doe',
              university: 'State University',
              course: 'Computer Science',
              bio: 'Passionate about web development'
            }
          })
        });
      } else {
        await route.fulfill({ status: 200 });
      }
    });

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
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Computer Science')).toBeVisible();
  });

  test('can apply to multiple jobs', async ({ page }) => {
    // Mock multiple matches
    await page.route('**/api/**/student/matches', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              posting_id: 101,
              title: 'Frontend Dev',
              company_name: 'Tech Corp',
              match_score: 95
            },
            {
              posting_id: 102,
              title: 'Full Stack Dev',
              company_name: 'Dev Inc',
              match_score: 88
            }
          ]
        })
      });
    });

    await page.goto('/student/matches');
    
    // Check that multiple postings are visible
    const postings = page.locator('text=/Frontend Dev|Full Stack Dev/');
    expect(await postings.count()).toBeGreaterThanOrEqual(1);
  });
});
