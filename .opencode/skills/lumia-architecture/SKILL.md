---
name: lumia-architecture
description: Use when changing project structure, creating feature modules, designing shared abstractions, modifying state management, changing API boundaries, refactoring application architecture or making significant technical decisions in Lumia 2.0.
---

# Lumia Architecture Engineering

## 1. Objective

Preserve and evolve Lumia 2.0 through deliberate architectural decisions.

Prioritize:

- Separation of concerns.
- Low coupling.
- High cohesion.
- Reusability.
- Maintainability.
- Type safety.
- Explicit data ownership.
- Consistent application patterns.

Do not introduce architectural complexity without a concrete need.

## 2. Existing Architecture

Lumia follows a Nuxt application architecture with three major boundaries:

### app/

Frontend application.

Contains:

- Pages.
- Layouts.
- Components.
- Composables.
- Middleware.
- Plugins.
- Feature modules.
- Frontend assets.

### server/

Nitro server layer.

Contains:

- Internal API handlers.
- External backend proxying.
- Server-side authentication integration.
- Server utilities.

### shared/

Cross-layer reusable code.

Contains:

- Types.
- Validation schemas.
- Pricing logic.
- Design tokens.
- Shared utilities.

Preserve these boundaries.

## 3. Architectural Decision Process

Before introducing a new abstraction:

1. Identify the problem.
2. Search for an existing solution.
3. Determine whether the problem is local or cross-cutting.
4. Evaluate the simplest suitable design.
5. Consider future maintenance costs.
6. Explain meaningful trade-offs.

Prefer the smallest coherent architectural change.

## 4. Feature Organization

Use app/features/ for domain-specific logic when it improves separation and reuse.

A feature may contain:

- Components.
- Composables.
- Stores.
- Types.
- Domain-specific helpers.

Do not force every component into a feature directory.

Keep globally reusable presentation components in app/components/.

Avoid creating deeply nested folder structures without a practical reason.

## 5. Dependency Direction

Maintain clear dependencies.

Preferred direction:

- Pages compose application functionality.
- Components display and interact with data.
- Composables coordinate reusable reactive logic.
- Features own domain-specific functionality.
- Server endpoints handle server-side integration.
- Shared modules contain reusable cross-layer definitions.

Avoid circular dependencies.

Avoid importing page-specific logic into shared modules.

Never expose server-only functionality to client bundles.

## 6. State Management Architecture

Existing conventions:

- Pinia for domain state.
- Nuxt useState for selected application-wide state.
- Component-local state for local interactions.

Choose the smallest appropriate state scope.

Do not:

- Duplicate sources of truth.
- Store derived values unnecessarily.
- Put all state into one global store.
- Introduce a new state library without justification.
- Share request-specific SSR state across users.

When changing a store, inspect all consumers and preserve its public contract unless the task explicitly requires otherwise.

## 7. API and Backend Boundaries

The architecture uses:

Frontend → Nitro internal API → External Fastify API.

Preserve this boundary.

The Nitro API layer is responsible for appropriate server-side concerns such as:

- Proxying.
- Cookie forwarding.
- Authentication context.
- Input validation.
- Response handling.
- Error normalization.

Do not move secrets or backend credentials to frontend code.

Do not duplicate backend business rules in the frontend.

The frontend may implement presentation-level calculations, but authoritative business rules must remain consistent with the backend.

## 8. Shared Modules

Use shared/ for code that is genuinely shared across execution boundaries.

Good candidates:

- Type definitions.
- Validation schemas.
- Pure pricing calculations.
- Design tokens.
- Cross-layer constants.

Do not move code into shared/ merely to make imports convenient.

Ensure shared modules do not depend on browser-only or server-only APIs.

## 9. Component Architecture

Create components around meaningful responsibilities.

Avoid:

- Giant page components.
- Components with unrelated responsibilities.
- Excessive abstraction.
- Premature generic component systems.
- Prop drilling that could be simplified through existing composition patterns.
- Hidden business logic in visual primitives.

A component should have a clear contract and predictable behavior.

## 10. Refactoring Rules

When refactoring:

1. Understand the current behavior.
2. Identify all consumers.
3. Preserve public contracts.
4. Minimize unrelated changes.
5. Keep the diff understandable.
6. Validate behavior after modification.

Do not combine broad architectural refactoring with unrelated feature work.

Prefer incremental evolution over rewriting established modules.

## 11. Dependencies

Before adding a dependency:

- Check whether the functionality already exists.
- Inspect existing installed packages.
- Evaluate maintenance and compatibility.
- Consider bundle size.
- Consider SSR compatibility.
- Explain the reason for introducing it.

Do not add dependencies for trivial functionality.

## 12. Architecture Documentation

When an important architecture decision is made, report:

- Problem.
- Existing approach.
- Proposed approach.
- Files and boundaries affected.
- Advantages.
- Trade-offs.
- Migration or compatibility implications.

Do not silently change architectural conventions.

## 13. Architecture Review Checklist

- [ ] Existing patterns were inspected.
- [ ] Responsibilities remain separated.
- [ ] Dependency direction is valid.
- [ ] No circular dependencies were introduced.
- [ ] Shared modules remain cross-layer safe.
- [ ] State ownership is clear.
- [ ] API boundaries are preserved.
- [ ] No unnecessary abstractions were added.
- [ ] Existing consumers remain compatible.
- [ ] Significant decisions are documented.

## 14. Definition of Done

An architectural change is complete only when it improves or preserves maintainability without introducing unnecessary complexity or breaking established boundaries.
