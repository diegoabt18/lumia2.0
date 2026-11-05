---
name: lumia-frontend
description: Use when implementing, modifying, debugging or extending frontend features, Vue components, Nuxt pages, composables, forms, application state or API integrations in Lumia 2.0.
---

# Lumia Frontend Engineering

## 1. Objective

Implement maintainable, reliable and production-oriented frontend functionality in Lumia 2.0.

Follow the existing architecture and conventions. Prioritize correctness, maintainability, type safety and user experience.

## 2. Technology Baseline

Work with the existing stack:

- Nuxt 4.
- Vue 3 Composition API.
- TypeScript strict mode.
- Pinia.
- Tailwind CSS.
- Nitro.
- Zod.
- Nuxt data-fetching utilities.
- ofetch / $fetch.

Inspect package.json and project configuration before using version-specific APIs.

## 3. Before Implementing

Always inspect:

1. The target page or component.
2. Related components.
3. Existing composables.
4. Relevant feature modules.
5. Shared types and schemas.
6. Related API endpoints.
7. Existing design tokens.
8. Existing state-management patterns.

Prefer extending existing implementations over creating parallel ones.

## 4. Vue and Nuxt Conventions

### Components

- Prefer `<script setup lang="ts">`.
- Use Composition API.
- Define explicit props and emits.
- Use precise TypeScript interfaces and types.
- Keep components focused.
- Separate reusable UI from domain-specific logic.
- Avoid unnecessary component nesting.
- Avoid excessively large components.

### Composables

Use composables for reusable stateful or reactive logic.

A composable should have a clear responsibility and predictable inputs and outputs.

Avoid creating composables that merely wrap a single trivial expression.

### Pages

Pages should coordinate:

- Data loading.
- Page-level state.
- Layout composition.
- SEO metadata.
- Navigation.
- User interactions.

Move reusable domain logic into existing feature modules when appropriate.

### Component Registration

Nuxt automatically registers configured component directories.

Inspect nuxt.config.ts before adding manual imports or changing registration behavior.

## 5. Data Fetching

Use existing application patterns.

Prefer:

- useAsyncData for SSR-compatible page data.
- useFetch when its Nuxt request semantics are appropriate.
- $fetch for explicit requests and user-triggered actions.
- Internal Nitro endpoints under `/api/*`.

Avoid:

- Browser-only fetching for data required by initial page rendering.
- Duplicate requests.
- Unnecessary client-side waterfalls.
- Fetching entire datasets when pagination is available.
- Hardcoded API URLs in components.

Handle loading, error, empty and success states.

Ensure data-fetching keys and cached data are appropriate for the request context.

Never place user-specific information in shared caches without proper isolation.

## 6. API Integration

The frontend communicates with the external Fastify backend through Nitro.

Follow this flow:

Frontend → Internal Nitro endpoint → Fastify API.

Do not bypass the internal API architecture without explicit justification.

When modifying API integration:

- Inspect existing server endpoints.
- Inspect the shared API client.
- Reuse existing response types.
- Handle HTTP and business errors.
- Preserve authentication and cookie forwarding.
- Validate untrusted input.
- Avoid leaking server-only credentials.

Never invent API response structures.

If a backend contract is unclear, inspect available types and implementations before making assumptions.

## 7. State Management

Follow the existing conventions:

- Pinia for established domain stores.
- Nuxt useState for shared application state.

Use local component state when state does not need to be shared.

Rules:

- Avoid duplicated sources of truth.
- Keep derived state computed.
- Avoid unnecessary global state.
- Prevent state leakage between SSR requests.
- Keep store actions focused.
- Preserve optimistic-update rollback behavior.

Do not migrate state-management systems merely for stylistic preference.

## 8. Forms and Validation

Inspect existing forms before introducing new patterns.

Use Zod when appropriate and consistent with existing validation schemas.

Forms should provide:

- Clear labels.
- Explicit validation.
- Useful error messages.
- Submission feedback.
- Disabled states.
- Loading states.
- Success and failure handling.

Avoid maintaining different versions of the same validation rule.

Do not introduce VeeValidate simply because it is installed.

## 9. TypeScript

- Maintain strict typing.
- Avoid `any`.
- Avoid unnecessary type assertions.
- Prefer explicit API contracts.
- Model optional and nullable values correctly.
- Use discriminated unions when they clarify state.
- Avoid duplicated interfaces.
- Reuse shared types where appropriate.

Do not suppress type errors without understanding their cause.

## 10. Error Handling

Never silently swallow errors.

Handle expected failures explicitly.

Distinguish:

- Network errors.
- Authentication failures.
- Validation errors.
- Business-rule failures.
- Unexpected server errors.

Present understandable messages to users without exposing internal implementation details.

## 11. Accessibility

All interactive components must support:

- Semantic HTML.
- Keyboard interaction.
- Visible focus.
- Accessible names.
- Appropriate ARIA attributes when necessary.
- Meaningful validation messages.

Do not replace semantic controls with clickable generic elements unnecessarily.

## 12. Responsive Implementation

Implement mobile-first layouts where appropriate.

Check:

- Narrow mobile screens.
- Standard mobile screens.
- Tablets.
- Desktop.
- Large desktop.

Avoid fixed dimensions that cause overflow.

Do not solve layout problems using arbitrary absolute positioning when normal layout systems are more appropriate.

## 13. Existing Project Constraints

- Reuse Tailwind and existing CSS conventions.
- Reuse Tabler Icons.
- Respect the shared design tokens.
- Do not introduce Nuxt UI or another component framework without justification.
- Do not introduce Axios.
- Do not introduce GraphQL.
- Do not assume NuxtImg is installed.
- Do not assume test or lint scripts exist.

## 14. Implementation Quality Checklist

Before finishing:

- [ ] Existing implementations were inspected.
- [ ] No unnecessary component duplication was introduced.
- [ ] Types are correct.
- [ ] SSR compatibility was considered.
- [ ] Loading and error states exist where necessary.
- [ ] User interactions work correctly.
- [ ] Responsive behavior was considered.
- [ ] Accessibility was considered.
- [ ] Relevant validation was performed.
- [ ] The final diff was reviewed.

## 15. Completion Report

Explain:

1. What was implemented.
2. Which files changed.
3. Important implementation decisions.
4. Validation performed.
5. Remaining limitations.
