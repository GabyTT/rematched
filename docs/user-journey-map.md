# Rev Matched — User Journey Map

## Purpose

This document maps the end-to-end user journey across Rev Matched.

It is meant to connect:

- product vision
- screen flow
- emotional progression
- interaction states
- and future experience expansion

This is a product journey document, not a technical flowchart.

## Journey Overview

Rev Matched is built around the idea that a person’s relationship with a vehicle unfolds over time.

The product journey is therefore not just:

- search
- compare
- buy

It is:

- define what fits
- discover possibilities
- narrow with confidence
- own with support
- and eventually move on with clarity

## The Three Major Journey Phases

| Phase | Core Experience | User Goal |
|---|---|---|
| Buyer Journey | Find Your Match / Find the One | Find the right vehicle with less overwhelm |
| Ownership Journey | Life Together | Stay organized, supported, and confident after purchase |
| Seller Journey | Moving On | Prepare, list, and transition out of a vehicle more smoothly |

## Journey Philosophy

The Rev Matched journey should feel:

- guided rather than overwhelming
- emotionally intelligent rather than transactional
- progressive rather than cluttered
- and supportive before, during, and after the buying moment

## Buyer Journey

## Stage 1 — Enter and Orient

### User mindset

The user is interested, curious, and possibly a little overwhelmed.

They may know:

- their budget
- a few brands they like
- a type of car they want

But they may not yet know how to narrow their options confidently.

### Primary screen

- `Home`

### Product job

Home introduces Rev Matched as a relationship platform and helps the user choose a direction.

### Emotional goal

- welcome
- possibility
- momentum

## Stage 2 — Define What Matters

### User mindset

The user is trying to turn vague preference into useful criteria.

They may be unsure about:

- what car type fits their life
- what budget is realistic
- which brands or models to prioritize

### Primary screen

- `Find the One`

### Product job

This stage establishes compatibility criteria before browsing begins.

The system listens first, then recommends.

### Key inputs

- minimum budget
- maximum budget
- vehicle type
- preferred brands
- preferred model text
- helper-guided clarification where needed

### Emotional goal

- clarity
- reassurance
- reduced pressure

## Stage 3 — Discover Possibilities

### User mindset

The user is ready to browse, but still needs help managing complexity.

They want to feel:

- guided
- not buried in listings

### Primary screen

- `Discover`

### Product job

Present compatible and unexplored vehicles in a way that feels curated and manageable.

This stage should balance:

- system guidance
- user autonomy
- and progressive exploration

### Current discovery pathways

- matched and unrated vehicles
- `Keep Exploring`
- `In Your Budget`
- `Second Chances`
- `All`

### Key actions

- Like
- Pass
- open details
- continue browsing
- revisit broader or narrower recommendations

### Emotional goal

- excitement
- momentum
- manageable exploration

## Stage 4 — Separate Interest From Fit

### User mindset

The user is starting to react emotionally to specific vehicles.

This is where Rev Matched’s layered model matters most.

### Core state model

| Layer | Meaning |
|---|---|
| Match | This fits your needs |
| Like | I’m emotionally interested |
| Top Pick | I’m seriously considering this |

### Product job

Help the user move from:

- compatibility
- to attraction
- to serious consideration

without collapsing those into a single noisy state.

### Emotional goal

- confidence
- reduced confusion
- cleaner decision-making

## Stage 5 — Review Liked Cars

### User mindset

The user has identified vehicles that caught their attention and wants a calmer place to review them.

### Primary screen

- `Liked`

### Product job

Create a personal review space for:

- saved interest
- lightweight reflection
- note-taking
- and early narrowing

### Key actions

- review liked vehicles
- add notes
- move vehicles into Top Picks
- remove Top Pick status while keeping Like status

### Emotional goal

- reflection
- organization
- growing confidence

## Stage 6 — Narrow to Finalists

### User mindset

The user is now making more serious tradeoffs.

They do not want more noise. They want clearer comparison.

### Primary screen

- `Compare Top Picks`

### Product job

Support side-by-side comparison of the user’s strongest contenders.

The product deliberately limits Top Picks to reduce overload and encourage focus.

### Key rules

- only liked vehicles can become Top Picks
- maximum of 3 active Top Picks
- a 4th Top Pick triggers a replacement confirmation flow

### Key actions

- compare finalists
- review details
- add notes
- remove a Top Pick back to Liked

### Emotional goal

- focus
- clarity
- readiness to decide

## Ownership Journey

## Stage 7 — Continue the Relationship

### User mindset

The user has chosen or now owns a vehicle and still needs practical support.

The relationship with the product should not end after the transaction.

### Primary screen

- `Life Together`

### Product job

Turn Rev Matched from a discovery product into an ownership companion.

### Current support areas

- garage context
- service and care reminders
- provider discovery
- insurance and licensing awareness
- basic care history

### Emotional goal

- stability
- support
- confidence

## Seller Journey

## Stage 8 — Prepare to Move On

### User mindset

The user is ready to sell, trade, or transition out of a vehicle, but may feel uncertain about how to do that well.

### Primary screen

- `Moving On`

### Product job

Help the user feel guided through selling rather than dropped into a stressful listing flow.

### Current state

This area is still early. It currently acts more as:

- a future-facing seller entry point
- a statement of product direction

than a full seller workflow.

### Future expected support

- listing preparation
- pricing guidance
- stronger listing quality
- buyer engagement visibility
- transaction and transfer guidance

### Emotional goal

- low stress
- practical clarity
- readiness for transition

## Supporting Journey Layers

## Account and Session Layer

Supporting screens such as:

- `Sign In`
- `Sign Up`
- `Profile`

help support continuity, personalization, and future account-based behaviour, even though they are currently lightweight in the MVP.

## Roadmap Layer

The buyer journey is reinforced by the in-product roadmap:

- Define
- Discover
- Liked
- Top Picks

This helps users feel:

- where they are
- what they have done
- and what comes next

## Modal and Overlay Layer

Important journey moments also happen in overlays rather than full screens.

Examples include:

- vehicle details
- notes
- Top Pick replacement confirmation
- unlock alerts

These are not separate journey stages, but they are meaningful journey supports.

## State Transitions That Matter Most

From a product perspective, the most important behavioural transitions are:

| From | To | Why it matters |
|---|---|---|
| No preferences | Defined preferences | Discovery becomes meaningfully personalized |
| Discovering | Liked | Emotional interest is captured |
| Liked | Top Pick | The user is narrowing seriously |
| Top Pick | Decision-ready | Comparison becomes focused and actionable |
| Buyer | Owner | The platform shifts from discovery to support |
| Owner | Seller | The platform shifts from support to transition |

## Current MVP Strengths

The current product is strongest in:

- buyer preference definition
- guided discovery
- Like and Top Pick progression
- shortlist comparison

It is meaningfully developing in:

- ownership support

It is still early in:

- seller workflow depth

## Open Journey Questions

As the product evolves, these are the most important journey questions to keep revisiting:

1. Where should the “purchase complete” moment live in the journey?
2. How does a selected vehicle formally move into Life Together?
3. What should the first true seller flow inside Moving On look like?
4. How should alerts, reminders, and account creation deepen without adding friction?
5. What parts of the journey should feel explicitly editorial versus algorithmic?

## Recommended Companion Docs

This document works best alongside:

- [Product Vision](./product-vision.md)
- [Terminology](./terminology.md)
- [UX Principles](./ux-principles.md)
- [Interaction Rules](./interaction-rules.md)
- [Screen Descriptions](./screen-descriptions.md)

## Closing Principle

The Rev Matched journey should feel like a relationship unfolding over time, not a pile of disconnected screens.

Each stage should help the user feel:

- better understood
- less overwhelmed
- more supported
- and more confident about what comes next
