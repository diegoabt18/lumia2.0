---
name: lumia-ui-ux
description: Use when designing, implementing, redesigning or reviewing visual interfaces, page layouts, product cards, navigation, forms, checkout flows, responsive layouts or design-system components in Lumia 2.0.
---

# Lumia UI/UX Engineering

## 1. Objective

Create premium, modern, elegant and highly usable interfaces for Lumia 2.0.

Think like a senior product designer and frontend design engineer.

The goal is not to make interfaces merely attractive. The goal is to create coherent, intuitive and polished shopping experiences.

## 2. Design Philosophy

Lumia should communicate:

- Professionalism.
- Trust.
- Clarity.
- Quality.
- Simplicity.
- Visual refinement.
- Consistency.

Avoid generic dashboard aesthetics, template-like layouts and excessive decoration.

Every visual decision must serve a purpose.

## 3. Inspect Before Designing

Before modifying a visual interface:

1. Inspect the current page.
2. Inspect its parent layout.
3. Inspect related components.
4. Inspect shared design tokens.
5. Inspect Tailwind configuration.
6. Inspect global styles.
7. Inspect existing interaction patterns.
8. Identify visual inconsistencies.

Do not redesign a component in isolation if it affects the visual language of the application.

## 4. Existing Design System

The project has:

- Tailwind CSS 3.4.
- Shared tokens in shared/design-system/tokens.ts.
- Tailwind configuration in tailwind.config.ts.
- Global CSS.
- Custom UI primitives.
- Tabler Icons.

These are the primary design resources.

Always inspect their current definitions before introducing new values.

### Design token rules

- Reuse existing colors.
- Reuse spacing scales.
- Reuse typography definitions.
- Reuse radius values.
- Reuse shadows.
- Respect existing semantic color roles.

If a missing token is genuinely necessary, explain why and maintain the existing naming and semantic conventions.

Avoid scattered arbitrary values.

## 5. Visual Hierarchy

Every page should establish a clear reading order.

Prioritize:

1. Primary purpose of the page.
2. Most important content.
3. Primary user action.
4. Supporting information.
5. Secondary actions.

Use spacing, typography, contrast and positioning to communicate importance.

Avoid giving every element equal visual weight.

## 6. Typography

Typography must be intentional.

Evaluate:

- Font family.
- Font weight.
- Font size.
- Line height.
- Letter spacing.
- Text width.
- Hierarchy between headings and body text.

Avoid:

- Excessively small text.
- Too many font sizes.
- Inconsistent heading weights.
- Long lines that reduce readability.
- Decorative typography that harms usability.

Use existing typography tokens and conventions whenever possible.

## 7. Layout and Spacing

Use a consistent spacing system.

Prioritize:

- Clear section separation.
- Balanced content density.
- Consistent alignment.
- Appropriate content width.
- Predictable vertical rhythm.
- Comfortable interactive areas.

Use CSS Grid and Flexbox appropriately.

Avoid unnecessary fixed heights and arbitrary absolute positioning.

Do not create excessive empty space merely to imitate a premium design.

## 8. Color and Contrast

Use color intentionally.

Primary actions should be visually distinguishable.

Maintain clear contrast between:

- Backgrounds.
- Content surfaces.
- Text.
- Borders.
- Interactive elements.
- Status indicators.

Do not invent colors when an existing semantic token is available.

Do not rely on color alone to communicate errors, success or warnings.

## 9. Component Quality

Inspect and reuse existing components.

Pay special attention to:

- Buttons.
- Inputs.
- Selects.
- Cards.
- Product cards.
- Navigation.
- Modals.
- Drawers.
- Badges.
- Alerts.
- Tables.
- Pagination.
- Empty states.
- Loading indicators.

Every component should have consistent:

- Padding.
- Alignment.
- Typography.
- Radius.
- Interaction behavior.
- Focus treatment.

Avoid introducing a second visual language.

## 10. E-commerce Experience

Lumia is an e-commerce application.

Prioritize the shopping journey.

### Product catalog

Ensure:

- Products are easy to scan.
- Images have consistent presentation.
- Prices are immediately understandable.
- Promotions are clearly distinguished.
- Filters are accessible.
- Sorting is predictable.
- Empty states explain what happened.
- Product cards have coherent interaction states.

### Product detail page

Ensure:

- Product imagery is prominent.
- Product information has clear hierarchy.
- Price and availability are understandable.
- Purchase actions are easy to find.
- Variant selection is intuitive.
- Related products do not distract from the main purchase.

### Cart

Ensure:

- Product quantities are easy to modify.
- Prices and totals are clear.
- Removal actions are understandable.
- Loading and update feedback are visible.
- Empty cart state provides a useful next step.

### Checkout

Prioritize:

- Simplicity.
- Trust.
- Clear progression.
- Understandable validation.
- Minimal distractions.
- Visible submission feedback.
- Clear order summary.

Do not add unnecessary steps.

## 11. Responsive Design

Design for multiple screen sizes.

Inspect:

- Mobile.
- Tablet.
- Laptop.
- Desktop.
- Large desktop.

Pay special attention to:

- Navigation.
- Product grids.
- Product galleries.
- Forms.
- Tables.
- Modals.
- Cart summaries.
- Checkout layout.

Avoid merely shrinking desktop layouts.

Reorganize content when necessary.

Prevent:

- Horizontal overflow.
- Clipped content.
- Tiny touch targets.
- Overlapping elements.
- Unusable mobile navigation.

## 12. Interaction Design

All interactive components should have appropriate states:

- Default.
- Hover.
- Focus.
- Active.
- Disabled.
- Loading.
- Success.
- Error.

Use transitions intentionally.

Prefer subtle and purposeful motion.

Avoid animations that delay essential actions or interfere with accessibility.

Respect reduced-motion preferences.

## 13. Accessibility

Follow semantic HTML and accessible interaction patterns.

Check:

- Keyboard navigation.
- Focus visibility.
- Labels.
- Accessible names.
- Contrast.
- Heading hierarchy.
- Form errors.
- Screen-reader feedback.
- Alternative text.

Use ARIA only when native HTML semantics are insufficient.

## 14. Visual Anti-Patterns

Avoid:

- Generic template layouts.
- Excessive gradients.
- Unnecessary glassmorphism.
- Arbitrary shadows.
- Too many rounded containers.
- Excessive borders.
- Inconsistent icon sizes.
- Random spacing values.
- Decorative elements without purpose.
- Overloaded pages.
- Inconsistent button styles.
- Fake reviews or fabricated trust indicators.
- Placeholder content presented as real information.

Do not manufacture ratings, review counts, product availability or other commercial information.

## 15. Design Review

Before completing a visual task, evaluate:

### Composition
- Is the page hierarchy clear?
- Is the content balanced?
- Is the primary action obvious?

### Consistency
- Does it match the existing design system?
- Are spacing and typography coherent?
- Are components reused correctly?

### Usability
- Is the interface understandable?
- Are interactions predictable?
- Are important states covered?

### Responsive behavior
- Does it work on mobile?
- Does it scale naturally?
- Is content accessible at all sizes?

### Polish
- Are alignments precise?
- Are icons consistent?
- Are transitions appropriate?
- Is there unnecessary visual noise?

## 16. Definition of Visual Done

A visual implementation is complete only when:

- It fits Lumia's existing visual language.
- It has clear hierarchy.
- It is responsive.
- It has appropriate interaction states.
- It is accessible.
- It does not introduce arbitrary design decisions.
- It maintains functional behavior.

Never consider an interface complete simply because the markup renders.
