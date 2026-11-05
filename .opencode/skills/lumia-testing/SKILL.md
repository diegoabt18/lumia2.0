---
name: lumia-testing
description: Use when validating implementations, investigating bugs, planning automated tests, checking SSR behavior, verifying user flows or improving testing coverage in Lumia 2.0.
---

# Lumia Testing and Validation Engineering

## 1. Objective

Verify that Lumia 2.0 implementations work correctly and preserve existing functionality.

Testing must be evidence-based.

Never claim that functionality works simply because the code looks correct.

## 2. Current Testing Baseline

The previous audit found:

- No established automated testing framework.
- No existing unit test suite.
- No established end-to-end test suite.
- No ESLint configuration.
- No Prettier configuration.
- No CI workflow.

Reinspect the project before assuming these conditions remain unchanged.

## 3. Validation Strategy

Select validation methods according to the task.

### Static validation

Inspect:

- TypeScript correctness.
- Imports.
- Component contracts.
- API response types.
- Nullability.
- Potential runtime errors.

### Build validation

Inspect available package scripts.

Run the relevant build command when appropriate.

Do not invent scripts.

### Manual validation

When automated tests are unavailable, define reproducible manual checks.

### Automated validation

When a suitable test framework exists, use it consistently.

Do not introduce an entire testing framework for a trivial change without considering project-wide value.

## 4. Critical E-commerce Flows

Prioritize the following flows.

### Product catalog

Verify:

- Product listing.
- Pagination.
- Filtering.
- Sorting.
- Search.
- Empty results.
- Loading states.
- API failures.

### Product detail

Verify:

- Correct product loading.
- Missing product behavior.
- Image gallery.
- Product variants.
- Price presentation.
- SEO metadata.
- Purchase interactions.

### Cart

Verify:

- Add product.
- Remove product.
- Update quantity.
- Quantity limits.
- Price calculations.
- Optimistic updates.
- Rollback on failure.
- Empty cart state.

### Checkout

Verify:

- Form validation.
- Required fields.
- Invalid values.
- Submission state.
- Duplicate submissions.
- Idempotency behavior.
- API failures.
- Order confirmation.
- Turnstile integration where configured.

### Authentication

Verify:

- Logged-out behavior.
- Login initiation.
- Session loading.
- Authentication failures.
- Logout.
- Protected navigation.
- Server-side authorization assumptions.

Do not assume that frontend navigation guards provide authorization.

## 5. SSR and Hydration Testing

When a change affects SSR, verify:

- Direct URL navigation.
- Server-rendered content.
- Browser hydration.
- Request-specific state isolation.
- No browser-only API errors on the server.
- No hydration warnings.
- Correct SEO metadata.

Pay special attention to shared state and user-specific identifiers.

## 6. Responsive Validation

For visual changes, inspect:

- Small mobile.
- Standard mobile.
- Tablet.
- Desktop.
- Large desktop.

Check:

- Horizontal overflow.
- Navigation.
- Product grids.
- Images.
- Forms.
- Buttons.
- Modals.
- Cart and checkout layouts.

Do not declare responsive validation complete if only desktop was inspected.

## 7. Accessibility Validation

Check:

- Keyboard navigation.
- Focus visibility.
- Accessible names.
- Form labels.
- Error messages.
- Semantic headings.
- Contrast.
- Interactive states.

Use automated accessibility tools when available.

## 8. Regression Prevention

For every modification:

1. Identify affected functionality.
2. Identify neighboring functionality.
3. Check shared component consumers.
4. Validate important existing behavior.
5. Inspect the final diff.

When a bug is fixed, define a regression check that would detect the same problem in the future.

## 9. Test Quality

Tests should:

- Verify behavior rather than implementation details.
- Be deterministic.
- Avoid depending on production services unnecessarily.
- Use realistic test data.
- Cover important edge cases.
- Be maintainable.
- Avoid unnecessary mocking.

Do not create tests that simply repeat the implementation's assumptions.

## 10. Failure Reporting

If a validation fails:

- Report the exact command or check.
- Include the relevant error.
- Identify whether it is related to the change.
- Distinguish existing failures from newly introduced failures.
- Do not hide or suppress failures to produce a successful result.

If a check cannot run, explain why.

## 11. Validation Report

Use this format:

### Validation Summary

Brief overview.

### Checks Executed

List actual commands and checks.

### Results

For each check, indicate:

- Passed.
- Failed.
- Not executed.
- Blocked.

### Regression Risks

Explain remaining concerns.

### Recommendations

Describe missing tests or additional checks that would improve confidence.

## 12. Definition of Done

An implementation is validated only when:

- Relevant checks were selected.
- Available checks were executed.
- Important user flows were considered.
- SSR implications were checked when relevant.
- Failures were reported honestly.
- Remaining limitations are documented.
