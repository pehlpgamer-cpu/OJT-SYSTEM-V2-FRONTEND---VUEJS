# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication Flow >> shows validation errors on empty submission
- Location: e2e\auth.spec.js:14:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Email must be a valid email address')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Email must be a valid email address')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - heading "Sign in to your account" [level=2] [ref=e7]
    - paragraph [ref=e8]:
      - text: Or
      - link "register for a new account" [ref=e9] [cursor=pointer]:
        - /url: /register
  - generic [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Email address
        - textbox "Email address" [active] [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]: Password
        - textbox "Password" [ref=e17]
    - button "Sign in" [ref=e19]
```