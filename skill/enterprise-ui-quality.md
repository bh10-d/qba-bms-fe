Run Enterprise UI Quality baseline audit on this project. Do not modify code.
# Skill: Enterprise UI Quality & Rendered UX Audit

## Purpose

Use this skill whenever building, reviewing, refactoring, or polishing a web application, especially:

* ERP
* BMS
* CMS
* Admin dashboard
* Back-office application
* Internal management system
* Data-heavy SaaS

The goal is not to make the UI visually fancy.

The goal is to produce a:

* Consistent
* Operationally efficient
* Responsive
* Accessible
* Data-dense where appropriate
* Predictable
* Maintainable

production-quality interface.

---

# Core Principle

Never optimize UI purely from source code.

Evaluate BOTH:

1. Implementation/code structure
2. Actual rendered UI

A component can be technically correct while producing poor UX.

---

# Workflow

## Phase 0 — Establish Baseline

Before modifying code:

1. Inspect project structure.
2. Identify:

   * routing
   * shared layouts
   * shared components
   * design tokens
   * table components
   * form components
   * modal/drawer components
   * navigation
3. Identify major user workflows.
4. Render representative pages.
5. Record the baseline.

Do not modify code during baseline audit.

---

# Phase 1 — Foundation Audit

Evaluate:

### Layout

* page container
* max-width
* spacing
* alignment
* vertical rhythm
* responsive behaviour

### Typography

* hierarchy
* readability
* numeric typography
* code/reference typography

### Visual hierarchy

* page context
* primary actions
* secondary actions
* destructive actions
* information grouping

Classify every issue as:

* P0
* P1
* P2
* P3
* DO NOT FIX

---

# Phase 2 — Data & Operational UX

For data-heavy applications inspect:

### Tables

* row density
* column widths
* text wrapping
* ellipsis
* numeric alignment
* status presentation
* action columns
* pagination
* horizontal scrolling

### Filters

* search
* status
* date
* category
* advanced filters

### KPI

Only make a KPI interactive if:

Metric → existing filter/state

has a clear semantic relationship.

Do not make every KPI clickable.

### Empty/loading/error states

Distinguish:

* Empty dataset
* No search results
* Loading
* Error
* Permission restricted

Never represent one state as another.

---

# Phase 3 — Interaction & Accessibility

Audit:

### Action hierarchy

Primary workflow action:
→ solid primary button

Secondary inspection:
→ text/ghost

Edit:
→ secondary/ghost

Destructive:
→ danger

Utility:
→ secondary unless it is the primary workflow action

Preferred order:

[View] [Edit] [Primary Workflow] [Destructive]

Only change ordering when business workflow requires otherwise.

### Accessibility

Check:

* aria-label
* keyboard navigation
* visible focus
* Tooltip
* semantic buttons
* icon-only actions
* touch target size

Tooltip must NOT replace aria-label.

---

# Phase 4 — Form & Workflow Audit

Inspect:

* create forms
* edit forms
* dynamic line items
* modals
* drawers
* confirmation dialogs
* validation
* calculations
* sticky actions

For dynamic line-item forms:

Prefer:

CSS Grid / structured table layout

over:

fragile flex rows with hardcoded widths.

Mobile layouts must not force many narrow fields into one row.

---

# Phase 5 — Rendered Verification

After each implementation phase:

DO NOT immediately make additional changes.

Render and verify.

Minimum viewport set:

* 1920px
* 1440px
* 1366px
* 1280px
* 1024px
* 768px
* 390px

Check:

* overflow
* clipping
* wrapping
* density
* interaction
* accessibility
* hierarchy
* modal/drawer behaviour
* table behaviour

Classification:

PASS
PASS WITH ADJUSTMENTS
FAIL

---

# Issue Classification

Every recommendation must identify:

### Scope

SYSTEMIC
SHARED COMPONENT
PAGE-SPECIFIC
CONTENT-SPECIFIC

### Priority

P0 — Broken / workflow blocked

P1 — Major operational/usability issue

P2 — Meaningful consistency or workflow friction

P3 — Minor polish

DO NOT FIX — No meaningful user value

---

# Systemic-First Rule

If the same problem appears in multiple pages:

DO NOT patch every page independently.

First investigate:

* shared component
* design token
* layout primitive
* global style
* reusable hook
* common table/form pattern

Prefer one systemic fix over multiple page-level workarounds.

---

# Evidence-Based Rule

Every recommendation must contain:

1. Problem
2. Evidence
3. User impact
4. Recommendation
5. Priority
6. Scope
7. Regression risk

Do not recommend changes merely because another UI style looks more modern.

---

# No Speculative Redesign

Do not introduce:

* unnecessary animations
* decorative UI
* unnecessary cards
* bento layouts
* gradients
* excessive shadows
* arbitrary colour changes
* new dependencies
* new interaction patterns

unless they solve a demonstrated usability problem.

---

# Business Semantics Rule

Visual treatment must represent business meaning.

Examples:

Primary workflow:
Confirm / Post / Receive

→ prominent action

Inspection:
View / Detail

→ secondary action

Destructive:
Delete / Cancel

→ danger treatment + confirmation where appropriate

Do not blindly standardize actions when business semantics differ.

---

# Data Density Rule

Data-heavy management systems should optimize for scanning efficiency.

However:

Do NOT maximize density blindly.

Use:

* middle density for normal entity tables
* small density for genuinely dense financial/reporting tables

Preserve comfortable interaction targets.

---

# Typography Rule

Use monospace/tabular typography selectively.

Good candidates:

* currency
* SKU
* tax numbers
* reference codes
* GL account numbers

Avoid indiscriminate monospace usage for:

* dates
* normal counts
* labels
* general text

---

# Empty State Rule

Always distinguish:

"Nothing exists"

from:

"Nothing matches the current filter"

from:

"Data is loading"

from:

"Request failed"

from:

"User cannot access this data"

Provide contextual actions only when they are actually useful.

---

# Implementation Rule

Never modify the entire application in one uncontrolled change.

Use:

Audit
↓
Classify
↓
Prioritize
↓
Implement one phase
↓
Render
↓
Verify
↓
PASS
↓
Next phase

If FAIL:

Adjust only the relevant phase.

---

# Regression Rule

After every phase verify that previous phases remain intact.

Do not solve a new problem by breaking an existing improvement.

Examples:

* Increasing density must not break touch targets.
* Reducing card nesting must not remove page context.
* Adding ellipsis must not hide critical identifiers.
* Making KPI cards clickable must not make informational KPIs look clickable.
* Responsive changes must not alter business logic.

---

# Final Audit

After all approved phases are complete:

Perform ONE full-system rendered audit.

Inspect:

* all major routes
* shared components
* desktop
* laptop
* tablet
* mobile
* core workflows
* tables
* forms
* modals
* drawers
* empty/loading/error states
* accessibility
* action hierarchy
* responsive behaviour

Focus specifically on regressions and inconsistencies introduced by previous phases.

Final classification:

READY
READY WITH MINOR POLISH
NOT READY

---

# Stop Rule

Once:

* no P0 exists
* no P1 exists
* workflows are usable
* responsive behaviour is stable
* systemic patterns are consistent
* accessibility is acceptable
* remaining issues are only P2/P3 polish

STOP.

Do not continue redesigning indefinitely.

A production UI does not need zero imperfections.

It needs to be:

consistent,
usable,
predictable,
maintainable,
and appropriate for its users.

---

# Output Format

Every audit should produce:

## Executive Summary

## Critical Issues

## Classification Matrix

| Issue | Scope | Priority | Impact | Recommendation | Risk |
| ----- | ----- | -------- | ------ | -------------- | ---- |

## Implementation Plan

Ordered by priority.

## Verification Report

| Dimension | Result | Evidence |
| --------- | ------ | -------- |

## Final Verdict

PASS / PASS WITH ADJUSTMENTS / FAIL

No code modifications during verification-only audits.
