# Bug Fix Priority Matrix

## 🔴 CRITICAL - FIX TODAY (Blocking Features)

| # | Bug | File | Impact | Fix Time |
|---|-----|------|--------|----------|
| 2 | actionLoading not exported | useCompany.js:500 | ApplicationsReview crashes | 2 min |
| 3 | postingId missing parameter | useCompany.js:470 | Status updates fail 404 | 5 min |
| 5 | Coordinator select option missing | RegisterPage.vue:72 | Coordinator can't register | 2 min |
| 6 | Coordinator login redirect missing | useAuth.js:75 | Coordinator login broken | 5 min |
| 4 | Password validation mismatch | LoginPage/RegisterPage:12-20 | Registration fails | 10 min |
| 1 | errorStore import missing | useJobMatching.js:1 | Errors don't display | 2 min |

**Total Fix Time: ~25 minutes**

---

## 🟠 HIGH - FIX THIS SPRINT

| # | Bug | File | Impact | Fix Time |
|---|-----|------|--------|----------|
| 7 | Success via errorStore | MatchesPage.vue:35 | Confusing UX | 15 min |
| 8 | Sequential API calls | CompanyDashboard.vue:15 | 50% slower load | 5 min |
| 9 | handleApply dependency | MatchesPage.vue:45 | Applications may fail | 10 min |
| 10 | Missing button handlers | PostingsList.vue:85 | Posting actions broken | 20 min |

**Total Fix Time: ~50 minutes**

---

## 🟡 MEDIUM - FIX NEXT SPRINT

| # | Bug | File | Impact | Fix Time |
|---|-----|------|--------|----------|
| 11 | setFilter no validation | matchStore.js:55 | Data corruption risk | 10 min |
| 12 | No error logging | useStudentProfile.js | Hard to debug | 20 min |
| 13 | updateSkill silent fail | studentStore.js:115 | State mismatch | 10 min |
| 14 | 401 race condition | apiClient.js:130 | Redirect loops | 20 min |
| 15 | alert() in ProfileEdit | ProfileEdit.vue:65 | Poor UX | 15 min |
| 19 | Missing error catch | StudentDashboard.vue | Silent failures | 10 min |

**Total Fix Time: ~85 minutes**

---

## 🟢 LOW - TECH DEBT

| # | Bug | File | Note |
|---|-----|------|------|
| 16 | Placeholder coordinator dashboard | router/index.js:98 | Create proper view |
| 17 | Missing computed property | companyStore.js | Extract logic |
| 18 | No pagination support | useCompany.js:385 | Scale limitation |
| 20 | formatDate error message | ApplicationsReview.vue:160 | UX polish |

---

# One-Liner Command Reference

```bash
# Quick test sequence to verify critical fixes
1. Register as coordinator → verify dropdown and redirect
2. Login as student → apply to match → check success message
3. Login as company → review applications → update status
4. Monitor console for errors (should have proper logging)
5. Check network: CompanyDashboard should load in ~2s
```

---

# Files to Edit (Ordered by Criticality)

```
1. frontend/src/composables/useCompany.js (Lines 30, 470, 500)
2. frontend/src/views/Auth/RegisterPage.vue (Line 72)
3. frontend/src/composables/useAuth.js (Line 75)
4. frontend/src/views/Auth/LoginPage.vue (Lines 12-20)
5. frontend/src/composables/useJobMatching.js (Line 1)
6. frontend/src/views/Company/ApplicationsReview.vue (Line 225)
7. frontend/src/views/Student/MatchesPage.vue (Line 35)
8. frontend/src/views/Company/PostingsList.vue (Line 85)
9. frontend/src/stores/matchStore.js (Line 55)
10. frontend/src/utils/apiClient.js (Line 130)
```

---

# Risk Assessment

## Breaking Changes Impact
- BUG #2-6: 🔴 CRITICAL - System-breaking
- BUG #1, 7-10: 🟠 HIGH - Feature loss
- Other: 🟢 MEDIUM - UX/Quality

## Test Coverage Needed
- [ ] Application status update workflow
- [ ] Coordinator registration → login → dashboard
- [ ] Student password validation on register
- [ ] MatchesPage error display
- [ ] CompanyDashboard parallel loading

## Deployment Risk: 🔴 HIGH
Would recommend:
1. Fix critical bugs first (25 min)
2. Run full test suite
3. Deploy to staging
4. UAT for coordinator & student flows
5. Monitor 401 logout behavior

---
