---
name: lumia-security
description: Use when handling authentication, authorization, cookies, CSRF, input validation, HTML or JSON-LD output, external URLs, CDN proxies, secrets, idempotency, rate limiting, security headers or any security-sensitive change in Lumia 2.0.
---

# Lumia Security Engineering

## 1. Objective

Protect Lumia 2.0 against realistic security failures without weakening usability, performance or the existing architecture.

Security is a design and implementation concern, not a final review step. Apply this skill while designing, implementing and validating security-sensitive changes.

Do not claim that a system is secure or insecure without inspecting the relevant code path.

## 2. Security Context

Lumia is an e-commerce frontend with:

- Nuxt SSR.
- Vue on the client.
- Nitro on Cloudflare Workers.
- An internal `/api/*` layer that proxies an external Fastify backend.
- Cookie-based authentication through the proxy.
- Google OAuth as the primary login flow.
- Turnstile integration.
- Public product and category data.
- Sensitive order, cart, account and administration data.

Treat the browser, query parameters, request bodies, headers, product fields and upstream responses as untrusted.

## 3. Core Principles

- Validate at the trust boundary, not only in the UI.
- Encode output for its exact context.
- Enforce authorization on the server.
- Keep secrets out of client-reachable configuration.
- Fail closed on unexpected security conditions.
- Prefer allowlists over blocklists.
- Minimize data exposure.
- Keep security behavior explicit and testable.
- Distinguish confirmed vulnerabilities from theoretical risks.

## 4. Trust Boundaries

Identify the boundary before changing behavior:

- Browser → Nitro `/api/*`.
- Nitro → external Fastify API.
- Public data → SSR-rendered HTML and metadata.
- User input → validation schemas and database.
- Configuration → server runtime and client bundle.

Never assume that a value is safe because it came from the application itself.

## 5. Input Validation

Validate every externally supplied value:

- Route params and slugs.
- Query parameters.
- Request bodies.
- Headers used for decisions.
- Form fields.
- File, folder and image identifiers.
- Redirect targets.

Rules:

- Use Zod or existing schema patterns for structured input.
- Validate on the server, even when the client already validated.
- Reject unexpected shapes instead of coercing silently.
- Constrain numbers, lengths, enums and formats.
- Do not pass raw query objects to upstream services.

Existing Lumia examples:

- `folder` is validated in `server/api/cdn/images.get.ts`; keep this pattern for every external identifier.
- Checkout uses Zod in `app/pages/checkout/index.vue`; reuse this approach instead of manual validation for new sensitive flows.

## 6. Output Encoding and XSS

Encode data for the context where it is rendered:

- HTML text.
- HTML attributes.
- URLs.
- JavaScript or JSON embedded in HTML.
- CSS.

Rules:

- Avoid `v-html` and `innerHTML` unless the content is trusted and sanitized.
- Never insert user-controlled strings into executable contexts.
- Do not build HTML by concatenating untrusted values.
- Treat product names, descriptions, review text and metadata as untrusted.

## 7. JSON-LD and Embedded Data

Structured data is a common injection point.

- Serialize JSON-LD with a helper that escapes `<`, `>`, `&` and the relevant Unicode separators before inserting it into a `<script>` element.
- Never use `innerHTML: JSON.stringify(data)` directly.
- Validate the shape of the data included in structured markup.
- Keep JSON-LD aligned with the actual visible product data.

Known Lumia location:

- `app/pages/products/[slug].vue` builds and injects JSON-LD. Any change there must preserve safe serialization.

## 8. SSRF and External URLs

Never request a URL controlled by the user without validation.

Rules:

- Use an allowlist of approved hosts derived from configuration.
- Require HTTPS for external resources.
- Reject credentials, fragments and unexpected schemes.
- Block loopback, private, link-local, metadata and internal network addresses.
- Apply timeouts and response-size limits.
- Do not follow redirects to unapproved hosts.
- Do not expose the raw upstream error to the client.

Known Lumia location:

- `server/api/cdn/images.get.ts` accepts a `base` query value. Any change must validate it against the configured CDN origin instead of trusting it.

## 9. Authentication

- Authentication must be established by the server.
- Do not trust client-provided identity, role or session data.
- Do not store tokens in insecure client storage when cookies are the established mechanism.
- Preserve the existing OAuth flow through Nitro.
- Validate return paths before redirecting after login.
- Ensure logout clears the server session and local authentication state.

## 10. Authorization

Frontend middleware is a UX mechanism, not a security boundary.

- Sensitive operations must be authorized by Nitro or the backend.
- Admin routes must be protected server-side, not only by `app/middleware/admin.ts`.
- Verify ownership for orders, carts and account resources.
- Do not rely on hidden UI or disabled buttons for protection.
- Reuse `server/utils/require-admin.ts` when server-side admin checks are required.

## 11. Sessions and Cookies

- Preserve the existing cookie-forwarding behavior in the Nitro proxy.
- Use `HttpOnly`, `Secure` and appropriate `SameSite` settings for session cookies.
- Avoid exposing session cookies to client-side JavaScript.
- Do not log cookie values or authorization headers.
- Limit cookie scope and lifetime to what the application needs.
- Consider cookie domain and subdomain boundaries before changing configuration.

## 12. CSRF

For cookie-authenticated state-changing requests:

- Verify the request origin or a CSRF token.
- Do not rely solely on `SameSite` when the operation is sensitive.
- Ensure `POST`, `PUT`, `PATCH` and `DELETE` endpoints are protected consistently.
- Be careful with cross-origin form posts and third-party redirects.

Check the actual backend behavior before declaring an endpoint vulnerable or protected.

## 13. Idempotency and Duplicate Operations

- Generate idempotency keys per operation, not per application or per server process.
- Never initialize a shared key with a constant server-side value.
- Regenerate the key after a successful operation.
- Ensure the key cannot be reused accidentally across users or sessions.

Known Lumia location:

- `app/pages/checkout/index.vue` initializes the checkout key with a constant server value. Any related change must guarantee unique keys per user operation.

## 14. Secrets and Configuration

- Keep secrets in private runtime configuration or platform secrets.
- Never place secrets in `runtimeConfig.public`.
- Never import server-only modules into browser code.
- Never commit credentials, tokens or `.env` files.
- Review whether a new configuration value must be public before exposing it.
- Use Cloudflare secrets and the existing deployment scripts for production values.

## 15. API Proxy Security

The Nitro proxy must remain a controlled boundary.

- Do not forward arbitrary headers, paths or bodies to the upstream API.
- Allowlist upstream paths and methods where practical.
- Normalize errors without leaking internal details.
- Do not expose backend hostnames, stack traces or credentials.
- Preserve authentication and cookie forwarding intentionally.
- Validate inputs before proxying them.

## 16. Rate Limiting and Abuse Prevention

- Apply rate limits to authentication, checkout, image discovery and other expensive or sensitive endpoints.
- Reuse `server/utils/rate-limit.ts` when appropriate instead of duplicating logic.
- Verify Turnstile server-side when it is configured.
- Do not rely on client-side timers or disabled buttons as abuse protection.
- Prefer per-IP and per-session limits with sensible thresholds.

## 17. Data Protection and SSR Isolation

- Never store request-specific data in module-level mutable state.
- Never place user-specific data in shared caches.
- Cache only public data with appropriate keys.
- Avoid logging personal data, order details or authentication material.
- Ensure SSR payloads do not expose data the current user should not receive.
- Verify that server-side state cannot leak between users.

## 18. Safe Redirects

- Accept only internal paths for post-login and post-action redirects.
- Reject absolute URLs, protocol-relative URLs and unexpected schemes.
- Normalize and validate the target before navigating.
- Do not reflect untrusted redirect values into links or metadata.

## 19. Security Headers

When changing headers or rendering behavior, consider:

- Content Security Policy compatibility.
- Frame protection.
- Content type sniffing protection.
- Referrer policy.
- Permissions policy.

Do not introduce a strict policy that breaks required application behavior without verifying the impact on SSR, fonts, images and third-party integrations.

## 20. Dependencies

- Prefer existing dependencies.
- Inspect whether a package is actually used before relying on it.
- Avoid adding packages with unnecessary privileges or large attack surface.
- Do not assume that an installed package is safe or maintained.
- Report dependency risks without performing uncontrolled upgrades.

## 21. Known Lumia Security Findings

Verify the current status before modifying related areas:

1. Checkout idempotency key initialized with a constant server-side value.
2. JSON-LD injected through unescaped `innerHTML`.
3. CDN image proxy accepting a user-controlled `base` value.
4. Client-only authentication and administration guards.
5. Cookie and CSRF behavior across the Nitro proxy.
6. Unused rate-limiting utilities.
7. Untrusted input validated inconsistently across flows.
8. Secrets and public runtime configuration boundaries.

These findings are investigation priorities, not permission to perform unrelated changes.

## 22. Security Review Checklist

- [ ] All external input is validated server-side.
- [ ] Output is encoded for its context.
- [ ] JSON-LD and embedded data are safely serialized.
- [ ] External URLs are allowlisted and SSRF-resistant.
- [ ] Authentication is server-established.
- [ ] Authorization is enforced server-side.
- [ ] Cookies use appropriate security attributes.
- [ ] State-changing requests are CSRF-protected.
- [ ] Idempotency keys are unique per operation.
- [ ] Secrets are not exposed to the client.
- [ ] The API proxy does not forward untrusted data blindly.
- [ ] Sensitive endpoints are rate-limited.
- [ ] No user-specific data leaks through SSR state or caches.
- [ ] Redirects are restricted to internal paths.
- [ ] Errors do not expose internal details.
- [ ] Findings are evidence-based and severity is justified.

## 23. Reporting

Every security finding must include:

- Severity.
- File and location.
- Description.
- Evidence.
- Impact.
- Recommended correction.
- Whether the issue is confirmed or theoretical.

Do not report a backend weakness without inspecting the backend implementation or its contract.

## 24. Definition of Done

A security-sensitive change is complete only when:

- The trust boundary is understood.
- Inputs are validated at the server boundary.
- Outputs are encoded for their context.
- Authorization is enforced where the operation occurs.
- Secrets and user data remain protected.
- Known Lumia risks are addressed or explicitly documented.
- Validation results and remaining limitations are reported honestly.
