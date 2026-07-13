# Angular Development Guidelines

You are an expert in TypeScript, Angular 20+, and scalable frontend architecture. Build production-quality applications that are maintainable, performant, accessible, and follow modern Angular best practices.

---

# Core Principles

- Prioritize readability over clever code.
- Prefer composition over inheritance.
- Keep features modular and self-contained.
- Follow the Single Responsibility Principle.
- Write code that is easy to extend and refactor.
- Favor explicitness over implicit behavior.
- Every implementation should be production-ready.

---

# TypeScript Best Practices

- Enable strict mode.
- Prefer type inference where obvious.
- Never use `any`.
- Use `unknown` when the type is uncertain.
- Prefer interfaces for object contracts.
- Use type aliases for unions and mapped types.
- Prefer readonly properties where possible.
- Avoid unnecessary enums; use string literal unions when appropriate.
- Use discriminated unions for complex state.
- Prefer `const` over `let`.
- Avoid non-null assertions (`!`) unless absolutely necessary.
- Keep functions small and pure whenever possible.

---

# Angular Best Practices

- Use standalone components, directives, and pipes.
- Do **not** specify `standalone: true`; Angular v20+ assumes standalone by default.
- Use Signals for component state.
- Use `computed()` for derived state.
- Use `effect()` only for side effects.
- Use lazy loading for all feature routes.
- Use functional route guards and resolvers.
- Use `inject()` instead of constructor injection.
- Prefer feature-based folder organization.
- Avoid circular dependencies.
- Prefer dependency inversion through interfaces when appropriate.

---

# Components

Components should:

- Have a single responsibility.
- Remain small and focused.
- Be reusable whenever practical.
- Use `ChangeDetectionStrategy.OnPush`.
- Prefer inline templates only for very small components.
- Use external HTML and CSS files for maintainability.
- Use `input()` and `output()` functions instead of decorators.
- Keep business logic out of components.
- Delegate data access to services.
- Avoid deeply nested component trees.

Use the `host` property instead of:

- `@HostBinding`
- `@HostListener`

---

# Templates

Templates should remain declarative.

Use:

- `@if`
- `@for`
- `@switch`
- `@defer`

Avoid:

- Complex expressions
- Business logic
- Function calls inside templates
- Nested ternary operators

Prefer:

- Class bindings over `ngClass`
- Style bindings over `ngStyle`

Use `track` with every `@for` loop.

Example:

```html
@for (transaction of transactions(); track transaction.id) {

}
```

Never assume browser globals such as:

- Date
- window
- document

inside templates.

---

# State Management

Use Signals as the default state management solution.

Use:

- signal()
- computed()
- linkedSignal()
- resource() where appropriate

Never use:

- mutate()

Instead use:

- set()
- update()

State should remain:

- Predictable
- Immutable
- Easy to debug

---

# Routing

Each feature should own its own routes.

Lazy load every feature.

Use route guards for:

- Authentication
- Authorization

Keep route configuration modular.

---

# Services

Every service should have one responsibility.

Use:

```ts
providedIn: 'root'
```

Use:

```ts
inject()
```

instead of constructor injection.

Services should:

- Communicate with APIs
- Handle business logic
- Transform data
- Never manipulate the DOM

---

# HTTP

Use Angular HttpClient.

Implement:

- Authentication interceptor
- Error interceptor
- Loading interceptor (if required)

Handle:

- Timeouts
- Network failures
- Unauthorized requests
- Retry only when appropriate

Never call HttpClient directly from components.

---

# Forms

Use Reactive Forms exclusively.

Every form should include:

- Validation
- Accessible labels
- Helpful error messages
- Loading state
- Disabled submit button while invalid

Never use Template-driven Forms.

---

# Styling

Use:

- Tailwind CSS
- CSS variables
- Design tokens

Avoid:

- Inline styles
- Deep selector nesting
- !important

Keep spacing, typography, and colors consistent.

---

# Accessibility

Every page must satisfy:

- WCAG AA
- AXE
- Keyboard navigation
- Visible focus indicators
- Semantic HTML
- ARIA labels where necessary
- Proper heading hierarchy
- Color contrast requirements

Every interactive element must be reachable via keyboard.

Never remove focus outlines without replacing them.

---

# Images

Use:

NgOptimizedImage

for all static images.

Provide:

- width
- height
- alt text

Avoid layout shifts.

---

# Performance

Prefer:

- Lazy loading
- Route-level code splitting
- Deferred loading
- Signals over unnecessary Observables
- OnPush change detection

Always:

- Track list rendering
- Minimize change detection
- Avoid unnecessary subscriptions

Optimize Largest Contentful Paint (LCP).

---

# Error Handling

Handle every failure gracefully.

Provide:

- Friendly messages
- Retry actions where appropriate
- Fallback UI
- Empty states

Never expose raw backend errors.

---

# Security

Never trust client input.

Always:

- Sanitize user content
- Escape dynamic HTML
- Protect routes
- Store JWT securely
- Handle token expiration
- Validate permissions

Never expose secrets in the frontend.

---

# Folder Structure

```
src/
├── app/
│
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── services/
│   ├── models/
│   ├── constants/
│   └── utils/
│
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   ├── layouts/
│   └── ui/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── analytics/
│   ├── transactions/
│   ├── profile/
│   └── settings/
│
└── app.routes.ts
```

---

# Naming Conventions

Components:

- DashboardComponent
- TransactionCardComponent

Services:

- AuthService
- DashboardService

Signals:

- user
- transactions
- loading

Computed values:

- filteredTransactions
- totalIncome
- monthlyExpenses

Avoid abbreviations.

---

# Testing

Prefer:

- Component testing
- Service testing

Test:

- Business logic
- Services
- State transformations
- Route guards

Avoid testing framework internals.

---

# Documentation

Every exported:

- Service
- Interface
- Utility
- Complex function

should have concise documentation where necessary.

Keep README up to date.

---

# AI Usage

AI may assist with:

- Boilerplate generation
- Refactoring
- Documentation
- Debugging
- Test generation
- Code reviews

Every AI-generated solution must be:

- Reviewed
- Understood
- Modified when necessary
- Tested before merging

AI is a productivity tool, not the source of truth.

---

# Definition of Done

A feature is complete only when:

- Builds successfully
- Lint passes
- No TypeScript errors
- No console errors
- Responsive across supported breakpoints
- Accessible (WCAG AA)
- Performance considered
- Loading states implemented
- Error states implemented
- Empty states implemented
- Code reviewed
- Follows project conventions