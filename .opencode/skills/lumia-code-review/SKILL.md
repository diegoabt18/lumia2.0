---
name: lumia-code-review
description: Use when reviewing code changes, auditing implementations, investigating regressions, evaluating security, checking architecture or assessing frontend quality in Lumia 2.0.
---

# Lumia Code Review Engineering

## 1. Objective

Perform rigorous and evidence-based code reviews.

Act as an independent senior reviewer.

Your responsibility is to identify meaningful defects, risks and maintainability issues before changes are considered complete.

Do not approve code merely because it compiles.

## 2. Review Principles

- Be objective.
- Prioritize correctness.
- Identify concrete evidence.
- Distinguish confirmed defects from possible risks.
- Avoid subjective style comments without practical value.
- Do not invent problems.
- Do not report unchanged pre-existing issues as regressions.
- Prefer actionable findings.

## 3. Review Scope

Inspect relevant changes and their dependencies.

Evaluate:

1. Functional correctness.
2. Type safety.
3. Architecture.
4. SSR behavior.
5. State management.
6. API integration.
7. Security.
8. Performance.
9. Accessibility.
10. Responsive behavior.
11. Visual consistency.
12. Error handling.

## 4. Critical Lumia Risks

Pay special attention to the previously audited areas.

### Checkout idempotency

Ensure identifiers are unique per intended operation and never shared accidentally through SSR state.

### JSON-LD and HTML injection

Check serialization and HTML injection boundaries.

Never trust external product fields when generating executable or embedded HTML content.

### Product ratings

Ensure displayed ratings and review counts come from legitimate data.

Never present synthetic ratings as real customer feedback.

### CDN and external URL handling

Check user-controlled URL parameters.

Validate destination hosts and prevent access to internal or restricted network resources.

### Canonical and Open Graph URLs

Ensure consistent origins across SSR and browser rendering.

### Authentication and administration

Verify that sensitive authorization is enforced by the server.

Frontend middleware alone is not a security boundary.

### Catalog completeness

Ensure pagination and filtering do not silently omit results.

### Product image loading

Check for unnecessary client-side image probing and excessive network requests.

## 5. Security Review

Evaluate:

- XSS.
- SSRF.
- CSRF.
- Authentication.
- Authorization.
- Cookie handling.
- Input validation.
- Sensitive information exposure.
- Unsafe redirects.
- Trust boundaries.
- Request isolation.
- API proxy security.

Treat external data as untrusted.

Do not confuse UI-level validation with server-side validation.

## 6. Severity Classification

Classify findings:

### Critical

A serious security, data integrity or system reliability issue with potentially severe consequences.

### High

A major functional defect, security weakness or significant regression.

### Medium

A maintainability, performance, usability or reliability problem with meaningful impact.

### Low

A minor improvement or limited-scope issue.

Only use a severity level when supported by evidence.

## 7. Finding Format

Every finding must include:

- Severity.
- File and relevant location.
- Description.
- Evidence.
- Expected impact.
- Recommended correction.

Example:

### High — Shared SSR identifier

File: app/pages/checkout/index.vue

Problem:
A request-specific identifier is initialized using a constant server-side value.

Impact:
Different sessions may receive the same identifier.

Recommendation:
Generate identifiers in a request-safe or client-side operation-specific context and validate uniqueness.

## 8. Avoid False Positives

Before reporting a problem:

1. Inspect the complete relevant code path.
2. Search for existing protections.
3. Check related server implementations.
4. Inspect types and API contracts.
5. Determine whether the issue is exploitable or merely theoretical.
6. Distinguish missing evidence from confirmed failure.

Do not claim that backend behavior is insecure without inspecting the backend.

## 9. Regression Review

Compare the proposed or current diff with the original behavior.

Check:

- Existing functionality.
- API compatibility.
- Route behavior.
- SEO behavior.
- State consistency.
- Responsive layouts.
- Error handling.
- Loading states.

Avoid unrelated refactoring during review.

## 10. Review Output

Structure the review as:

### Summary
Overall assessment.

### Findings
Ordered by severity.

### Regressions
Behavior introduced or broken by the change.

### Positive observations
Important improvements worth preserving.

### Missing validation
Checks that could not be performed.

### Verdict
Choose one:

- Approved.
- Approved with minor observations.
- Changes requested.
- Unable to verify.

A verdict must reflect actual evidence.

## 11. Review Checklist

- [ ] Functional correctness checked.
- [ ] Types reviewed.
- [ ] SSR risks reviewed.
- [ ] Security boundaries reviewed.
- [ ] Architecture reviewed.
- [ ] Performance considered.
- [ ] Accessibility considered.
- [ ] Existing behavior checked.
- [ ] Findings have evidence.
- [ ] No unsupported claims.

## 12. Definition of Done

A review is complete when meaningful findings are documented clearly, with enough evidence for another engineer to reproduce and understand them.
