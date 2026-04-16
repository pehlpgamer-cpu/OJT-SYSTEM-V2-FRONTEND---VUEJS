# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student.spec.js >> Student Portal Flow >> successfully navigates to student dashboard and displays profile info
- Location: e2e\student.spec.js:63:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/student/dashboard" until "load"
============================================================
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
        - textbox "Email address" [ref=e14]: student@example.com
      - generic [ref=e15]:
        - generic [ref=e16]: Password
        - textbox "Password" [ref=e17]: securepass123
    - button "Sign in" [active] [ref=e19]
```