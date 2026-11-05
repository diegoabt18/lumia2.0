---
name: lumia-performance
description: Use when optimizing rendering, SSR, hydration, data fetching, caching, images, frontend bundles, API requests, catalog performance or runtime efficiency in Lumia 2.0.
---

# Lumia Performance Engineering

## 1. Objective

Keep Lumia 2.0 fast, responsive and resource-efficient without sacrificing visual quality or maintainability.

Prioritize measurable improvements and avoid speculative optimization.

## 2. Runtime Context

Lumia uses:

- Nuxt SSR.
- Vue.
- Nitro.
- Cloudflare Workers.
- Internal API proxying.
- An external Fastify backend.

Always consider both server and browser execution.

## 3. SSR Isolation

This is a critical requirement.

Never store request-specific information in module-level mutable variables.

Avoid:

- Shared user sessions.
- Shared authentication state.
- Shared idempotency identifiers.
- User-specific data in unpartitioned caches.
- Request-specific values in global singleton objects.

Use Nuxt request-aware state mechanisms.

Verify that server-side state cannot leak between users.

## 4. Hydration

Prevent server/client rendering mismatches.

Inspect:

- Browser-only APIs.
- Random values.
- Current timestamps.
- Locale-dependent formatting.
- Client-only state.
- Conditional rendering.
- Environment-dependent values.

Do not generate different initial content on the server and client without an intentional hydration strategy.

Use client lifecycle hooks for genuinely browser-only operations.

## 5. Data Fetching

Prefer SSR-compatible data fetching for initial page content.

Use:

- useAsyncData.
- useFetch.
- $fetch for explicit actions.
- Internal Nitro endpoints.

Avoid:

- Duplicate requests.
- Unnecessary waterfalls.
- Fetching data that is not used.
- Repeated requests caused by unstable keys.
- Fetching the same data independently in multiple components without coordination.

Choose caching strategies based on data ownership and freshness requirements.

## 6. Catalog Performance

For product catalogs:

- Prefer server-side pagination.
- Request only the required fields.
- Avoid filtering incomplete datasets as if they were complete.
- Avoid unnecessary client-side sorting of large datasets.
- Keep filter state predictable.
- Prevent duplicate requests when filters change.
- Preserve pagination correctness.

Do not introduce artificial result limits without explaining the functional impact.

## 7. Image Performance

Product images are important to e-commerce usability.

Prioritize:

- Correct image dimensions.
- Responsive image delivery where supported.
- Lazy loading below the fold.
- Appropriate eager loading for important above-the-fold imagery.
- Explicit dimensions or aspect ratios.
- Stable image placeholders.
- Avoiding unnecessary image requests.

Do not probe large image URLs in the browser merely to discover whether they exist when a more efficient source of image metadata is available.

Inspect the existing CDN and image-delivery architecture before changing it.

## 8. Rendering Efficiency

Use Vue reactivity intentionally.

Avoid:

- Unnecessary watchers.
- Excessive deep reactivity.
- Repeated expensive computed calculations.
- Unnecessary component updates.
- Large synchronous computations during rendering.
- Excessively complex component trees.

Use computed values for derived data.

Use shallow reactivity where its semantics are appropriate.

Do not introduce memoization without an identified need.

## 9. Bundle and Dependencies

Prefer existing dependencies.

Avoid adding packages that significantly increase bundle size for small features.

Inspect client/server import boundaries.

Avoid accidentally including server-only dependencies in client bundles.

Consider lazy loading for large features when it provides measurable value.

## 10. Cloudflare and Nitro

Consider the deployment environment.

Do not assume:

- A persistent Node.js process.
- Unlimited execution time.
- A local filesystem.
- Shared memory between requests.
- Availability of Node-only APIs in all runtime contexts.

Verify Cloudflare compatibility before introducing runtime-specific functionality.

Be careful with in-memory caching and process-local state.

## 11. Performance Measurement

When available, use:

- Build output.
- Browser performance tools.
- Network inspection.
- Lighthouse.
- Web Vitals.
- Bundle analysis.

Distinguish measured improvements from expected improvements.

Do not claim a performance improvement without evidence.

## 12. Performance Review Checklist

- [ ] SSR isolation is preserved.
- [ ] Hydration is stable.
- [ ] No unnecessary requests were introduced.
- [ ] Image loading is appropriate.
- [ ] Catalog pagination is correct.
- [ ] Rendering work is reasonable.
- [ ] Client bundle impact was considered.
- [ ] Cloudflare compatibility was considered.
- [ ] Cache behavior is safe.
- [ ] Improvements are supported by evidence.

## 13. Definition of Done

An optimization is complete when it addresses an identifiable bottleneck or unnecessary resource cost without compromising functionality, security or maintainability.
