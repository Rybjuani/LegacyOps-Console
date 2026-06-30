# Siebel Reference UX Analysis

## Purpose

This document analyses the user experience patterns of Oracle Siebel CRM
as observed in 16 public reference captures. The goal is NOT to copy
Siebel's visual design. The goal is to understand which enterprise CRM
patterns LegacyOps should preserve (density, list+form, auditability)
and which it should avoid (operator fatigue, weak hierarchy, jargon
mixed with daily operations).

**Guiding principle:**
> Enterprise density, without legacy operator fatigue.

---

## Source ZIP

- **File**: `siebel_capturas_pack_v2.zip` (provided by the user)
- **Contents**: 4 text files (HTML gallery, links TXT, sources CSV, README)
- **Binary images**: None. The ZIP contains public URLs to images hosted
  on blogger.googleusercontent.com, siebelhub.com, docs.oracle.com, and
  crmcog.com. No proprietary assets were downloaded or copied.

---

## Files inspected

| File | Role |
|---|---|
| `siebel_capturas_descarga_v2.html` | Gallery page with 16 image references and descriptions |
| `siebel_capturas_sources_v2.csv` | Structured table: id, tag, density, title, why, image_url, source_url |
| `siebel_capturas_links_v2.txt` | Plain-text list of direct image URLs |
| `README_siebel_capturas_v2.txt` | Pack description and usage notes |

16 reference captures were inspected, covering:

- Contacts List with sidebar tree + dense grid + form applet (#1)
- Activity List with charts (#2)
- Opportunities Screen with grid + tabs + form (#3)
- Contact Screen with tabs + detail fields (#4)
- Manifest / Object Expression admin screen (#5)
- Accounts List/Form with dropdown menu (#6)
- HI Client vs Open UI comparison (#7)
- Floating Form Dialog over Account List (#8)
- Manifest Administration with three applets (#9)
- Opportunity List with conditional formatting (#10)
- Siebel Tools — Applet User Property List (#11)
- Sales Order List with coloured totals (#12)
- Manifest PM/PR Contact Form Applet (#13)
- Official Account List View (#14)
- Main Elements of Application Window (#15)
- Mobile Application Banner / Left Pane / Right Pane (#16)

---

## Visual patterns found

### 1. List applet + form applet (list-form view)

Siebel's signature pattern: a dense grid (list applet) on top, a detail
form (form applet) below. Selecting a row updates the form. This packs
two interaction modes into one screen. Observed in #1, #3, #4, #6, #14.

**Assessment**: Powerful for expert operators who know the data model.
Overwhelming for new operators who cannot distinguish which fields are
editable, which are read-only, and which belong to the list vs the form.

### 2. Dense grids with many columns

Siebel grids routinely show 10–20+ columns in a single list. Horizontal
scroll is expected. Column headers are short and sometimes cryptic
(e.g. "Rev", "Prob", "Stg"). Observed in #1, #6, #8, #10, #12.

**Assessment**: High information density, but at the cost of cognitive
load. Operators must memorise column meanings. No progressive disclosure.

### 3. Toolbar with many small icons

Siebel toolbars pack 10–20 small icon buttons in a single row. Some are
labelled, some are icon-only. The meaning of each icon must be learned.
Observed in #2, #6, #10, #15.

**Assessment**: Efficient for experts (one click to any action).
Discoverability is near zero for new operators. No tooltips or help text
are visible in the captures.

### 4. Tabs and subtabs

Siebel views often have 3–5 tabs, each with sub-tabs. Navigation depth
can reach 3 levels. The active tab is not always visually distinct.
Observed in #3, #4, #6, #7.

**Assessment**: Organises related data, but tab labels are often short
and ambiguous. Operators get lost in tab hierarchies.

### 5. View selector / screen selector

Siebel uses a "screen selector" (horizontal bar of module names) and a
"view selector" (dropdown or tab bar within a screen). Navigation is
expert-oriented: you must know which screen contains which view.
Observed in #1, #15.

**Assessment**: Flexible for power users. Confusing for new operators
who do not know the module taxonomy.

### 6. Search / query / PDQ

Siebel supports "PDQ" (Public Display Queries) and a query builder.
The query builder uses a form-like interface with operators. PDQs are
saved queries that appear in a dropdown. Observed in #6, #16.

**Assessment**: Powerful query capability. But the UI for building
queries is complex and not self-explanatory.

### 7. Fields compressed into small areas

Form fields are small, tightly packed, and sometimes share labels. Date
pickers, dropdowns and text inputs have similar visual weight. Observed
in #4, #6, #8.

**Assessment**: Maximises data per screen. But field purpose is not
always clear without training.

### 8. Mixed operation + configuration in same surface

Siebel admin screens (Manifest, Object Expression, Siebel Tools) appear
in the same application shell as operational screens. An operator can
accidentally navigate to a configuration view. Observed in #5, #9, #11, #13.

**Assessment**: No clear separation between "daily operations" and
"technical/admin". This is a source of operator errors.

### 9. Weak visual hierarchy

Siebel's visual hierarchy relies on small font differences, thin
borders, and tab position. There are few strong visual anchors (large
titles, colour-coded sections, clear CTAs). Observed in #7, #15.

**Assessment**: The screen reads as a wall of data. Operators cannot
quickly identify "what should I do next?"

### 10. Expert-oriented navigation

All Siebel patterns assume the operator has been trained. There is no
guided flow, no "first time" experience, no progressive disclosure.
Observed in all captures.

**Assessment**: High onboarding cost. Training time is measured in
weeks, not hours.

---

## What Siebel does well

1. **Information density**: A single screen can show 50+ data points.
   For expert operators, this reduces navigation.
2. **List-form pattern**: Selecting a row and seeing detail below is
   an efficient mental model for data-heavy workflows.
3. **Query power**: The PDQ + query builder system is more powerful
   than simple search. Power users can build complex filters.
4. **Auditability**: Every action is logged. The audit trail is
   comprehensive.
5. **Configurability**: The Manifest / Object Expression system allows
   deep UI customisation without code (for admins).
6. **Conditional formatting**: Colour-coded cells (revenue, probability,
   status) help experts scan for anomalies.
7. **Mobile support**: The disconnected mobile client mirrors the
   desktop experience in a constrained layout.

---

## Where operator fatigue appears

1. **Cognitive overload**: 10–20 columns + 3–5 tabs + toolbar with
   15 icons + form below = too much information in one viewport.
2. **No guided flow**: Operators must know the sequence of actions.
   There is no "next step" indicator.
3. **Expert navigation required**: Screen selector + view selector
   assumes training. New operators get lost.
4. **Mixed audiences**: Daily operations and admin configuration share
   the same shell. Operators can accidentally enter admin screens.
5. **Small buttons and fields**: Click targets are small. Mis-clicks
   are common under time pressure.
6. **Weak hierarchy**: No visual anchor says "this is what you should
   look at right now". Everything has equal visual weight.
7. **Onboarding cost**: Weeks of training before an operator is
   productive. High attrition risk.
8. **Jargon in operational screens**: Field names like "PDQ",
   "applet", "business component" leak into the operator UI.

---

## Patterns LegacyOps should preserve

| Siebel pattern | LegacyOps equivalent | Status |
|---|---|---|
| List + form detail | Cases table + Customer 360 | ✅ Implemented (separated into two views for clarity) |
| Information density | Dense tables with sortable columns | ✅ Implemented in Cases, Customer 360, Migration |
| Query power | Customer Search with filters | ✅ Implemented (simpler than PDQ but covers 80% of needs) |
| Auditability | Audit log with typed events | ✅ Implemented |
| Conditional formatting | Priority/status pills (urgent=red, high=amber) | ✅ Implemented |
| Configurability | Workflow definitions with conditional steps + role requirements | ✅ Implemented |

---

## Patterns LegacyOps should avoid

| Siebel pattern | LegacyOps approach | Status |
|---|---|---|
| Toolbar with 15+ small icons | Clear CTAs with text labels | ✅ Implemented |
| 3–5 levels of tabs | Single-level navigation with 3 audience groups | ✅ Implemented |
| Mixed operations + admin in same shell | Separate "Daily Operations" / "Supervision" / "Technical / Legacy" groups | ✅ Implemented |
| Expert-oriented navigation | Guided 7-step Interaction Console | ✅ Implemented |
| Weak visual hierarchy | SectionHeader, banners, pills with colour coding | ✅ Implemented |
| No guided flow | Interaction Console with success messages per step | ✅ Implemented |
| Small click targets | Standard-sized buttons and selects | ✅ Implemented |
| Jargon in operational screens | Operator-friendly labels; jargon moved to Technical pages | ✅ Implemented |

---

## Translation rules for LegacyOps

| Siebel concept | LegacyOps translation | Rationale |
|---|---|---|
| Screen selector + view selector | Sidebar with 3 audience groups | Reduces navigation depth; separates audiences |
| List applet + form applet (same screen) | List page + separate 360 detail page | Reduces cognitive load; progressive disclosure |
| PDQ (saved queries) | Customer Search with segment/risk filters | Covers 80% of operator needs; simpler UX |
| Toolbar icons | Text-labelled buttons + CTAs | Discoverability for new operators |
| Tabs and subtabs | Single-page sections with SectionHeader | Reduces navigation depth |
| Manifest / Object Expression | Siebel Bridge Lab (Technical / Legacy group) | Separates admin from daily operations |
| Business Component / Integration Object | Conceptual DTOs behind SiebelBridge | Anti-corruption layer; no raw Siebel types in domain |
| Audit trail (system-level) | Audit log with typed events + permission.denied | Operator-facing audit; SIEM export pending (issue #3) |
| Conditional formatting | Priority/status pills with colour | Visual scanning without grid clutter |
| Expert onboarding | Guided Interaction Console + help text per step | Reduces training from weeks to hours |

---

## Final design principle

> LegacyOps does not copy Siebel. It translates Siebel's enterprise CRM
> capability into a modern experience that preserves information density
> where it matters (tables, cases, migration data) while reducing operator
> fatigue through guided flows, audience separation, clear hierarchy and
> progressive disclosure.
>
> The result is not a thinner Siebel. It is a denser modern CRM with a
> migration strategy attached.
