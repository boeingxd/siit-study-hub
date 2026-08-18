---
name: SIIT Study Hub
description: The engineering lab notebook every DE student already keeps — ruled paper, graphite ink, one highlighter accent.
colors:
  paper: "#fbfbf9"
  ink: "#24272b"
  ink-muted: "#5b6169"
  rule: "#d8dee8"
  rule-strong: "#b9c2d0"
  accent: "#6b7519"
  accent-mark: "#bfd730"
  accent-mark-ink: "#1a1d0f"
  margin: "#c0392b"
  danger: "#b3261e"
  danger-bg: "#fbeceb"
typography:
  display:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.03em"
rounded:
  sm: "3px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "24px"
  6: "32px"
  7: "48px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "8px 4px"
  tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  tab-selected:
    backgroundColor: "{colors.accent-mark}"
    textColor: "{colors.accent-mark-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
---

# Design System: SIIT Study Hub

## Overview

**Creative North Star: "The Engineering Lab Notebook"**

SIIT Study Hub reads as the lab notebook a Digital Engineering student already keeps, not a rounded EdTech dashboard. It refuses Google Classroom's soft cards-on-gray in favor of ruled structure, graphite ink, and a single highlighter accent used the way a student actually highlights: to mark a phrase, not to fill a button. The course code is the anchor of every screen and is set in the same monospace face a DE student's own IDE and lab reports already use — not a "technical" costume borrowed for effect, but the native display voice of this world.

The system is deliberately restrained: one saturated color (the highlighter), one fixed structural line (the red margin rule, present even on "Loading…"), and otherwise flat paper, hairline rules, and dark ink. Depth is conveyed by paper-and-ink metaphors — a highlighter mark, a physical index-tab reveal — never by card shadows or colored left borders standing in for hierarchy.

**Key Characteristics:**
- Paper-white ground, graphite ink, hairline rule-blue dividers — no gray cards
- One highlighter accent, used as an underline/mark, never as a filled surface
- A fixed red margin rule down the left edge, present on every screen
- Course codes and headings in JetBrains Mono; body copy in system sans
- Tabs behave as physical index dividers, not a flat connected bar

## Colors

The palette is almost monochrome — paper and ink — with exactly one saturated color reserved for interaction, plus one fixed red used only for the structural margin line.

### Primary
- **Highlighter Mark** (`#bfd730`, `--accent-mark`): the bright yellow-green fill that sits behind fixed-dark-ink text — the primary-button label, the active-tab background, `::selection`. Never used as a text or line color on its own (that pairing fails contrast); it only ever backs `--ink` or `--accent-mark-ink` (`#1a1d0f`) text.
- **Accent Ink** (`#6b7519`, `--accent`): the darker, text-safe form of the same hue. Used for links, the active-tab line equivalent, focus rings, and icon accents where the color sits directly against paper. Holds 4.84:1 against `--paper`, clearing the 4.5:1 floor for small text — darkened from an earlier value during finish review specifically to pass that floor.

### Neutral
- **Paper** (`#fbfbf9`, `--paper`): the base ground for every screen.
- **Graphite Ink** (`#24272b`, `--ink`): primary text, headings, course codes.
- **Muted Ink** (`#5b6169`, `--ink-muted`): secondary text, labels, meta rows, placeholders.
- **Rule** (`#d8dee8`, `--rule`): hairline dividers between rows and sections.
- **Rule Strong** (`#b9c2d0`, `--rule-strong`): input underlines, tab borders, dashed empty-state rules — where a divider needs to read as a stroke, not a background hint.

### Named Rules
**The Margin Rule.** A 1.5px fixed red (`#c0392b`, `--margin`) vertical line sits at `--margin-inset` (28px) from the left edge on every screen, including loading states. It is the one persistent structural device and the only fixed-position color line in the system — no other UI element gets a colored border standing in for hierarchy.

**The Mark, Never a Button Rule.** The highlighter accent (`--accent-mark`) only ever appears as a rough-edged mark sitting behind fixed-dark-ink text — covering roughly the text's own height, not a button's full padded box — or as `::selection` and the active-tab fill. It is never a solid filled button background at full-box scale; that treatment shipped once during the build and was corrected in finish review because it contradicted the "mark/underline only, never a filled button" commitment.

## Typography

**Display/Title Font:** JetBrains Mono (self-hosted, weights 400/500/600/700), with `ui-monospace, 'SF Mono', Menlo, Consolas, monospace` fallback
**Body Font:** system-ui stack (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`)

**Character:** Mono carries every heading, course code, and label — the same face the student's own tools already use, so it reads as native rather than "technical." Body copy stays on a restrained system sans so the mono voice doesn't fight for attention outside its structural role.

### Hierarchy
- **Display/Title** (700, 21–23px, tight line-height, -0.01em tracking): page and card headings (`h1`), course titles.
- **Body** (400, 16px, 1.55 line-height): running copy, empty-state text, lede paragraphs.
- **Label** (600, 12–13px, 0.03em tracking, mono): field labels, course codes, tab text, back-link, secondary buttons — the "handwritten margin label" register.

### Named Rules
**The Course Code Rule.** The course code is always set in mono, bold, full ink color, and given a fixed minimum width in list rows (`min-width: 4.5em`) so codes align into a column. It is the most consistently legible piece of data on any screen, per the product's own anchor principle.

## Layout

Content is narrow and left-anchored: the app shell caps at 760px, indented past the fixed margin rule (`padding-left: calc(var(--margin-inset) + var(--space-5))`), so nothing sits under or crosses the red line. The auth/onboarding card centers within a ruled-paper background (a repeating 32px horizontal hairline pattern) — reserved for that single sparse surface, not applied to dense content screens where it would compete with real row dividers. Spacing runs on an 8px-rooted scale (4/8/12/16/24/32/48px). List rows and section rhythm use hairline (`--rule`) or dashed (`--rule-strong`) horizontal dividers rather than card gaps or background-color banding.

## Elevation & Depth

The system is flat by default: no card shadows, no colored left borders standing in for hierarchy. The one exception is the tab component, which uses a shallow ambient shadow (`0 1px 2px rgba(36,39,43,.08)`, deepening to `0 3px 6px rgba(36,39,43,.18)` when selected) plus a small vertical offset, because tabs are modeled as physical index dividers that sit pushed back until selected — the shadow serves that specific paper-and-plastic metaphor, not general card elevation.

### Named Rules
**The Flat-By-Default Rule.** Course rows, empty states, error messages, and cards carry no box-shadow. Structure comes from hairline rules and the fixed margin rule, never from drop shadows.

## Shapes

Corners are mostly square. Inputs, the primary button, and course rows have `border-radius: 0`. The only rounded elements are small UI chrome that reads as a discrete object rather than a ruled line: the secondary button and the tab (`3px`, `--radius`), and scrollbar thumbs. Borders are hairlines (1–1.5px) in `--rule` or `--rule-strong`, used as full-width dividers under rows and beneath form fields rather than as box outlines around content.

## Components

### Buttons
- **Primary:** transparent background, full ink-colored bold label (15px), full-width. Depth comes entirely from the highlighter-mark device behind the label (see Colors → Named Rules), not from a filled or bordered box. On hover/focus the mark's clip-path shifts and lifts 1px; on active it settles back down; disabled dims the mark to 50% opacity. `border-radius: 0`.
- **Secondary:** outlined, `1.5px solid var(--rule-strong)`, `3px` radius, muted-ink label text, transparent background. On hover the border and text shift to `--accent`. Used for lower-emphasis actions ("Use a different email").
- **Shape:** primary is square-cornered; secondary/tab-scale chrome uses the 3px radius.

### Inputs / Fields
- **Style:** no box or fill — a transparent field with only a `1.5px` bottom rule (`--rule-strong`), consistent with the ruled-paper metaphor.
- **Focus:** the bottom rule turns `--accent` and gains a 1.5px accent underline shadow (`box-shadow: 0 1.5px 0 0 var(--accent)`) — no glow, no border-box change, `outline: none` on the field itself (the page-level `:focus-visible` outline still applies to non-input controls).
- **Labels:** mono, 12px, 600 weight, muted-ink, uppercase-adjacent tracking (0.03em) — the "margin label" register.
- **Error:** a left-accented block (`border-left: 1px solid var(--danger)`, `--danger-bg` fill, `--danger` text, 3px radius) below the form, not inline per-field.

### Navigation / Tabs
Tabs are physical index dividers, not a connected flat bar: each tab is its own bordered, radiused surface with its own shadow, sitting slightly recessed (`top: 4px`) until selected, at which point it fills with the highlighter-mark color, moves flush (`top: 0`), and deepens its shadow. This is the one place the highlighter appears as a filled surface rather than a text-mark — justified because a selected index tab is a distinct, deliberate exception to the "mark only" rule that the contract itself names ("colored index dividers, not a flat bar"). Unselected tabs are muted-ink label text on paper.

### Course Row (signature list pattern)
The recurring content unit across course list and course-page tab panels: a baseline-aligned row (bold mono code, flex-grow title, tabular-nums meta) separated by a hairline bottom rule, with no card boundary. Hover/focus washes in a left-to-right highlighter-tinted gradient (`rgba(191,215,48,0.2)` fading to transparent at 70%) rather than a background swap or shadow — the same highlighter hue used at low opacity as a hover cue, distinct from its mark and mark-fill roles elsewhere.

### Empty States
Plain-language copy under a `border-top: 1px dashed var(--rule-strong)` — the dashed rule visually distinguishes "nothing here yet" from a populated hairline-divided list, in service of the product's "honest emptiness" principle (PRODUCT.md): no fake activity, no illustration, just a stated invitation to contribute.

## Do's and Don'ts

### Do:
- **Do** use the highlighter mark (`--accent-mark`) only as a mark behind fixed dark-ink text or as the selected-tab fill — never as a full-box button background.
- **Do** set every course code, heading, and label in JetBrains Mono; keep body copy on the system sans stack.
- **Do** use hairline (`--rule`) or dashed (`--rule-strong`) horizontal rules for structure and hierarchy, not card shadows or colored borders.
- **Do** keep the fixed red margin rule present and un-obstructed on every screen, including loading and error states.
- **Do** use `--accent` (not `--accent-mark`) for any text or line color that sits directly on paper — it is the contrast-safe pairing.

### Don't:
- **Don't** render the primary action as a solid filled button or a flat, connected tab bar — both were shipped once during the build and corrected in finish review as contract violations, not styles to repeat.
- **Don't** introduce card-style box-shadows on content surfaces (rows, panels, cards); the tab's shallow shadow is a named exception tied to its physical-index-divider metaphor, not a general elevation token.
- **Don't** stand in Unicode arrows or emoji for icons; icons are authored SVG at a single consistent stroke weight (see `src/components/icons.tsx`).
- **Don't** apply the ruled-paper background texture to dense content screens — it's reserved for the single sparse auth/onboarding card.
