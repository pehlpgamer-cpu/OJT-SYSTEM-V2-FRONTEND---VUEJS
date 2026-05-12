export function createJwt(role = 'student', overrides = {}) {
  const payload = {
    id: overrides.id || 1,
    role,
    exp: Math.floor(Date.now() / 1000) + 7200,
    ...overrides
  }

  return [
    'eyJhbGciOiJIUzI1NiJ9',
    Buffer.from(JSON.stringify(payload)).toString('base64url'),
    'signature'
  ].join('.')
}

export async function mockCurrentUser(page, user) {
  await page.route('**/api/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user, data: { user } })
    })
  })
}

export async function mockStudentProfile(page, profile = {}) {
  await page.route('**/api/students/profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          first_name: 'John',
          last_name: 'Doe',
          academic_program: 'Computer Science',
          bio: 'Passionate about web development',
          ...profile
        }
      })
    })
  })

  await page.route('**/api/students/skills', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        skills: [
          { id: 1, skill_name: 'Vue.js', proficiency_level: 'advanced', years_of_experience: 1 }
        ]
      })
    })
  })
}

export async function mockCompanyProfile(page, profile = {}) {
  await page.route('**/api/company/profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          company_name: 'Tech Corp',
          industry_type: 'Software Development',
          company_website: 'https://techcorp.com',
          address: 'New York, NY',
          ...profile
        }
      })
    })
  })
}

export async function mockCompanyPostings(page, postings = []) {
  await page.route('**/api/company/postings', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: postings.length > 0
          ? postings
          : [
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
    })
  })
}
