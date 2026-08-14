import { expect, test } from '@playwright/test'
import { createJwt, mockCurrentUser, mockStudentProfile } from './helpers.js'

async function signInAsStudent(page) {
  const user = { id: 1, role: 'student', email: 'student@example.com' }

  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: createJwt('student', { id: 1 }), user })
    })
  })
  await mockCurrentUser(page, user)
  await mockStudentProfile(page)

  await page.goto('/login')
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', 'securepass123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/student/dashboard')
}

test.describe('Help & FAQ', () => {
  test('opens from the sidebar and switches role guides', async ({ page }, testInfo) => {
    await signInAsStudent(page)

    await page.getByRole('link', { name: 'Help & FAQ' }).click()
    await expect(page).toHaveURL(/\/faq$/)
    await expect(page.getByRole('heading', { name: 'How to use OJT Match' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Student guide' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Student' })).toHaveAttribute('aria-selected', 'true')

    if (process.env.CAPTURE_FAQ_SCREENSHOTS === '1') {
      await page.screenshot({ path: testInfo.outputPath('faq-desktop.png'), fullPage: true })
    }

    await page.getByRole('tab', { name: 'Company' }).click()
    await expect(page.getByRole('heading', { name: 'Company guide' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How do I review applicants?' })).toBeVisible()
    await expect(page.locator('#faq-panel-company [data-testid="restricted-link"]')).toHaveCount(5)
    await expect(page.getByRole('link', { name: 'Edit Company Profile' })).toHaveCount(0)
  })

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('reaches the FAQ from the mobile sidebar', async ({ page }, testInfo) => {
      await signInAsStudent(page)

      await page.getByRole('button', { name: 'Open navigation' }).click()
      await expect(page.getByRole('link', { name: 'Help & FAQ' })).toBeVisible()
      await page.getByRole('link', { name: 'Help & FAQ' }).click()

      await expect(page).toHaveURL(/\/faq$/)
      await expect(page.getByRole('heading', { name: 'Student guide' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Student' })).toBeInViewport()
      await expect(page.locator('aside')).toHaveCSS('translate', '-100%')
      if (process.env.CAPTURE_FAQ_SCREENSHOTS === '1') {
        await page.screenshot({ path: testInfo.outputPath('faq-mobile.png') })
      }
    })
  })
})
