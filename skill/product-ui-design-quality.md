Run Product UI Design & Quality baseline audit.
Do not modify code.
# Skill: Product UI Design & Quality

## Purpose

Design, implement, audit, and refine production web application UIs with a strong emphasis on:

* Product-specific visual identity
* Professional UI/UX
* Strong visual taste
* Operational efficiency
* Consistency
* Accessibility
* Responsive behaviour
* Data-heavy workflows
* Maintainability
* Rendered visual quality

The goal is NOT to produce a generic "modern AI-generated dashboard".

The goal is to produce an interface that feels intentionally designed for its product, users, workflows, and domain.

---

# 1. Core Philosophy

Follow this hierarchy:

```text
PRODUCT CONTEXT
      ↓
USER WORKFLOW
      ↓
UX STRUCTURE
      ↓
VISUAL DIRECTION
      ↓
DESIGN SYSTEM
      ↓
IMPLEMENTATION
      ↓
RENDERED VERIFICATION
      ↓
FINAL QUALITY GATE
```

Never start with decoration.

Never optimize visual appearance without understanding the workflow.

Never redesign working UI merely because another style looks more fashionable.

---

# 2. Role Separation

Treat the following responsibilities as separate mental roles.

## UX Architect

Answers:

* What does the user need to accomplish?
* What information is important?
* What interaction pattern fits the workflow?
* Should this be a table, form, drawer, modal, card, tab, etc.?
* What is the primary action?
* What should be immediately visible?

## Visual Designer / Taste

Answers:

* Does the interface have a coherent visual identity?
* Is the hierarchy obvious?
* Is spacing intentional?
* Is the UI restrained?
* Are colours meaningful?
* Are cards, borders, shadows, icons and decoration being overused?
* Does the interface look product-specific rather than AI-generated?

## UI Engineer

Answers:

* Is the implementation maintainable?
* Are patterns reusable?
* Are responsive layouts robust?
* Are components semantically correct?
* Is existing business logic preserved?

## Quality Auditor

Answers:

* Does the rendered UI actually work?
* Are there inconsistencies?
* Are there regressions?
* Does the design system hold across pages?
* Does the UI work across viewport sizes?

Do not allow all four roles to make uncontrolled changes simultaneously.

---

# 3. Anti-AI Design Principles

The UI should NOT automatically exhibit generic AI-generated dashboard patterns.

Avoid unnecessary:

* gradients
* glassmorphism
* excessive rounded cards
* excessive shadows
* oversized headings
* decorative hero sections
* colourful KPI cards everywhere
* excessive whitespace
* excessive icons
* excessive badges
* excessive animations
* excessive hover effects
* generic SaaS dashboard layouts
* bento layouts without a product reason
* identical cards for semantically different information

Do not make every element interactive.

Do not make every KPI clickable.

Do not use decoration to compensate for weak information hierarchy.

Prefer:

* typography
* spacing
* alignment
* contrast
* restrained colour
* meaningful grouping
* strong component hierarchy

over decorative effects.

---

# 4. Taste Rules

## Restraint

Before adding any visual element ask:

> What user problem does this solve?

If there is no meaningful answer:

Do not add it.

## Hierarchy

Not everything should compete for attention.

Use:

```text
Primary
  ↓
Secondary
  ↓
Supporting
  ↓
Decorative
```

The interface should have a clear visual focal point.

## Consistency

Repeated concepts should look repeated.

Examples:

* Primary actions
* Destructive actions
* Status badges
* Page headers
* Tables
* Filters
* Empty states
* Forms
* Modals
* Drawers

Do not create slightly different implementations of the same concept on every page.

## Context

A financial application, ecommerce admin, CMS, healthcare dashboard, and marketing website should not automatically look identical.

Visual language must reflect product context.

---

# 5. UX Pattern Selection

Before implementing a UI pattern, evaluate the workflow.

Possible patterns include:

```text
Table
Card
Form
Drawer
Modal
Tabs
Stepper
Inline edit
Command interface
Detail page
Master-detail
```

Choose based on:

* data volume
* task frequency
* information hierarchy
* workflow complexity
* screen size
* reversibility of actions
* user expertise

Do not use cards simply because cards are visually attractive.

Do not use modals for complex workflows when a page or drawer is more appropriate.

Do not use tables when the data is primarily visual rather than tabular.

---

# 6. Enterprise / Management UI Rules

For ERP, BMS, CMS, admin, and internal management systems:

Prioritize:

1. Fast scanning
2. Data density
3. Predictable workflows
4. Clear action hierarchy
5. Search/filter efficiency
6. Keyboard accessibility
7. Responsive behaviour
8. Error prevention

Avoid prioritizing:

* decorative visuals
* excessive animation
* novelty
* marketing-style layouts

---

# 7. Layout Rules

Evaluate:

* page container
* max-width
* margins
* spacing
* vertical rhythm
* content grouping
* responsive behaviour

Do not automatically remove max-width containers.

Do not automatically make everything full width.

Use full-width layouts when the content benefits from horizontal space, especially:

* large tables
* dashboards
* data grids

Use constrained layouts when the content is primarily:

* forms
* text
* configuration
* detail views

---

# 8. Table Strategy

Classify tables before choosing density.

## Entity tables

Examples:

* Products
* Orders
* Purchases
* Inventory
* Users

Prefer:

```text
size="middle"
```

## Dense financial/reporting tables

Examples:

* Trial Balance
* Journal Entries
* P&L
* General Ledger

Prefer:

```text
size="small"
```

Do not maximize density blindly.

Preserve comfortable interaction targets.

---

# 9. Typography Strategy

Use proportional sans-serif typography for normal application text.

Use monospace/tabular typography selectively for:

* currency
* SKU
* reference codes
* tax numbers
* GL account numbers
* technical identifiers

Do NOT indiscriminately apply monospace to:

* dates
* normal counts
* labels
* general text

Typography should optimize scanning without making the application visually mechanical.

---

# 10. Action Hierarchy

Use semantic action hierarchy.

## Primary workflow

Examples:

* Create
* Confirm
* Receive
* Post
* Approve

→ Solid primary button.

## Secondary inspection

Examples:

* View
* Detail

→ Text/ghost.

## Edit

→ Secondary/ghost.

## Destructive

Examples:

* Delete
* Cancel

→ Danger styling.

Confirmation should be used when the action has meaningful irreversible consequences.

Do NOT require confirmation for every state-changing action by default.

---

# 11. KPI Rules

A KPI may be interactive only when:

```text
KPI
 ↓
Existing filter/state
 ↓
Clear semantic relationship
```

Example:

```text
Draft Orders: 12
        ↓
status = DRAFT
```

Valid.

But:

```text
Average Order Value
```

should remain informational unless a meaningful filter relationship exists.

Interactive KPI cards must provide:

* hover feedback
* focus feedback
* active state
* keyboard support
* accessible label

Non-interactive KPI cards must NOT visually imply clickability.

---

# 12. Long Text Rules

Use ellipsis selectively.

Good candidates:

* Product name
* Supplier name
* Address
* Description
* Notes

Avoid unnecessary truncation of:

* SKU
* reference code
* status
* quantity
* currency
* critical identifiers

When truncating important text:

```text
ellipsis
+
Tooltip
```

must preserve access to the full value.

---

# 13. Empty / Loading / Error States

Always distinguish:

```text
EMPTY DATA
NO SEARCH RESULTS
LOADING
ERROR
PERMISSION RESTRICTED
```

Never show:

> "No data"

when the actual problem is:

> API error.

Never show:

> "Create new"

when the user simply searched for something that does not exist.

Empty states should be:

* contextual
* compact
* actionable when appropriate

Avoid decorative empty-state illustrations unless they serve a real product purpose.

---

# 14. Form Rules

For dynamic line-item forms:

Prefer:

```text
CSS Grid
or
structured table
```

over fragile flex rows with arbitrary hardcoded widths.

Desktop:

```text
Product ─────────── Qty ─ Price ─ Discount ─ Action
```

Mobile:

Do not force many narrow inputs into one row.

Use:

* stacked layout
* responsive grid
* compact structured layout
* controlled horizontal scrolling when genuinely appropriate

Never sacrifice input usability merely to keep everything on one line.

---

# 15. Responsive Design

Minimum verification:

```text
1920
1440
1366
1280
1024
768
390
```

Check:

* overflow
* clipping
* wrapping
* button targets
* table scrolling
* form layout
* modal behaviour
* drawer behaviour
* navigation
* typography
* spacing

Do not assume desktop CSS automatically works on mobile.

---

# 16. Accessibility

Check:

* semantic HTML
* keyboard navigation
* visible focus
* aria-label
* accessible button names
* icon-only actions
* tooltip behaviour
* touch target size
* colour-independent status communication

Important:

Tooltip does NOT replace aria-label.

---

# 17. Systemic-First Rule

When the same issue appears on multiple pages:

Do NOT patch every page independently.

Investigate:

```text
Shared component
Design token
Layout primitive
Global style
Reusable hook
Common table pattern
Common form pattern
```

Prefer:

```text
1 systemic fix
```

over:

```text
10 page-level workarounds
```

---

# 18. Issue Classification

Every finding must be classified by scope.

## SYSTEMIC

Affects multiple pages.

## SHARED COMPONENT

Affects a reusable component.

## PAGE-SPECIFIC

Only affects one page.

## CONTENT-SPECIFIC

Caused by unusual data/content.

Priority:

```text
P0 — Broken / workflow blocked

P1 — Major usability / operational issue

P2 — Meaningful UX inconsistency or friction

P3 — Minor polish

DO NOT FIX — No meaningful user value
```

---

# 19. Evidence-Based Recommendations

Every recommendation must explain:

```text
Problem
↓
Evidence
↓
User impact
↓
Recommendation
↓
Priority
↓
Scope
↓
Regression risk
```

Do not recommend changes merely because:

* it looks more modern
* another SaaS does it
* an AI design trend uses it
* a component library provides it

---

# 20. No Uncontrolled Redesign

Never modify unrelated areas while implementing an approved phase.

If the current task is:

```text
Table density
```

do not simultaneously redesign:

```text
Navigation
Dashboard
Forms
Colours
Modals
```

unless a direct dependency requires it.

---

# 21. Phase-Based Workflow

Always use:

```text
BASELINE
   ↓
AUDIT
   ↓
CLASSIFY
   ↓
PRIORITIZE
   ↓
DESIGN DECISION
   ↓
IMPLEMENT ONE PHASE
   ↓
RENDER
   ↓
VERIFY
   ↓
PASS?
 ┌─┴─┐
NO  YES
│    │
ADJUST NEXT PHASE
     ↓
FINAL AUDIT
```

Never perform a massive uncontrolled UI rewrite.

---

# 22. Baseline Audit

Before implementation:

Inspect:

* project structure
* routing
* shared components
* design system
* layouts
* major pages
* core workflows

Then render representative pages.

Produce:

## Visual Audit

## UX Audit

## Accessibility Audit

## Responsive Audit

## Systemic Issues

## Page-Specific Issues

## Prioritized Backlog

No code modifications.

---

# 23. Implementation Phase

Before changing code:

Define:

```text
Scope
Files
Components
Expected behaviour
Non-goals
Regression risks
```

Then implement only that phase.

Preserve:

* API contracts
* business logic
* permissions
* routing
* existing workflows

unless explicitly included in the task.

---

# 24. Rendered Verification

After implementation:

Do NOT immediately make another batch of improvements.

Render the affected UI.

Verify:

* visual hierarchy
* spacing
* density
* interaction
* responsive behaviour
* accessibility
* workflow correctness
* regression

Return:

```text
PASS
PASS WITH ADJUSTMENTS
FAIL
```

No code modifications during verification-only audits.

---

# 25. Final Quality Audit

After all approved phases:

Perform one full-system audit.

Check:

```text
All major routes
        ↓
Shared components
        ↓
Desktop
        ↓
Laptop
        ↓
Tablet
        ↓
Mobile
        ↓
Core workflows
        ↓
Accessibility
        ↓
Consistency
        ↓
Regression
```

Do not focus only on newly modified components.

Look for interaction and visual drift introduced by previous phases.

---

# 26. Final Quality Gate

The project is considered ready when:

* no P0 issues remain
* no P1 issues remain
* core workflows are usable
* responsive behaviour is stable
* visual hierarchy is clear
* shared patterns are consistent
* accessibility is acceptable
* business semantics are correctly represented
* remaining issues are P2/P3 only

Final verdict:

```text
READY
READY WITH MINOR POLISH
NOT READY
```

---

# 27. Stop Rule

STOP when the product is good enough for production.

Do not continue indefinitely with:

```text
audit
→ tweak
→ audit
→ tweak
→ redesign
→ redesign
→ redesign
```

A high-quality UI does NOT require zero imperfections.

The objective is:

```text
Intentional
Consistent
Usable
Accessible
Responsive
Maintainable
Product-specific
```

---

# 28. Default Command

When this skill is invoked for a new project, begin with:

> Run a complete Product UI Design & Quality baseline audit. Do not modify code.

Then produce:

1. Product/context understanding
2. UX assessment
3. Visual/taste assessment
4. Anti-AI assessment
5. Responsive assessment
6. Accessibility assessment
7. Systemic issues
8. Page-specific issues
9. Priority classification
10. Recommended implementation phases

Do not implement until the backlog is reviewed/approved.

---

# 29. Implementation Command

When a phase is approved:

> Implement only the approved phase from the Product UI Design & Quality backlog. Preserve all unrelated functionality.

After implementation:

> Run rendered verification for this phase. Do not modify code.

---

# 30. Final Command

After all phases:

> Run the final Product UI Design & Quality audit across the entire application. Focus on regression, consistency, UX quality, visual taste, anti-AI patterns, accessibility, and responsive behaviour. Do not modify code.

---

# Golden Rule

## Build with purpose.

## Design with taste.

## Validate with evidence.

## Fix systematically.

## Verify through rendering.

## Stop when the product is good.
