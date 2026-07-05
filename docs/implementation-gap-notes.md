# Rev Matched — Implementation Gap Notes

## Purpose

This document captures the most important gaps between:

- the current product vision
- the current UX and interaction rules
- and the current implemented app experience

Its goal is to help Rev Matched move from:

- a strong product concept
- and a strong MVP foundation

into a more intentionally aligned product.

This is not a bug list and not a full engineering roadmap. It is a product-to-implementation bridge.

## How To Read This Document

Each gap is framed in terms of:

- what the product intends
- what the app currently does
- why the gap matters
- and what kind of implementation work it likely implies

The aim is to make prioritization easier across product, design, and development.

## Overall Read

Rev Matched is already strongest in:

- buyer preference definition
- guided discovery structure
- Like and Top Pick progression
- shortlist comparison
- overall product language and documentation clarity

The biggest remaining implementation gaps are not about basic direction.

They are mostly about:

- deepening the matching system
- formalizing lifecycle transitions
- maturing the ownership flow
- and building out the seller journey beyond positioning

## Priority Levels

This document uses three rough priority levels:

- `Now` = important for near-term product alignment
- `Next` = meaningful follow-up after core alignment work
- `Later` = valuable, but dependent on broader product maturity

## Buyer Journey Gaps

## 1. Match Logic Is Still Simpler Than the Product Story

**Priority:** `Now`

### Product intent

Rev Matched positions matching as:

- reassuring
- compatibility-aware
- progressively intelligent
- and capable of surfacing adjacent recommendation paths

### Current implementation reality

The current matching logic is still primarily:

- rule-based
- binary
- and strict around direct preference checks

There is not yet:

- a weighted match score
- a clear confidence layer
- explanation logic
- behavioural adaptation based on Likes or Top Picks

### Why this matters

The product story already promises something smarter and more guided than a normal marketplace. The current implementation is good for MVP, but it is still closer to filtered discovery than a richer recommendation system.

### Likely implementation themes

- add match explanation cues
- introduce weighted or ranked compatibility
- distinguish direct Matches from adjacent recommendations more clearly
- introduce smarter behavioural learning over time

## 2. Discovery Logic and Discovery Language Are Ahead of Some Underlying Behaviour

**Priority:** `Now`

### Product intent

Discovery should feel:

- curated
- dynamic
- progressive
- and emotionally manageable

### Current implementation reality

The current discovery structure is already strong, but some deeper recommendation distinctions are still relatively shallow behind the scenes.

Examples:

- `Keep Exploring`, `In Your Budget`, and `Second Chances` exist conceptually and functionally
- but not all recommendation pathways yet feel deeply differentiated by ranking logic

### Why this matters

The surface language is now clear and compelling. The next step is making sure the engine underneath those surfaces becomes increasingly distinct and intentional.

### Likely implementation themes

- stronger recommendation grouping rules
- clearer ranking within each discovery bucket
- better distinction between strict matches and exploration items

## 3. The Match -> Like -> Top Pick Journey Is Strong, but Final Decision Handling Is Still Light

**Priority:** `Next`

### Product intent

The buyer journey should help users move toward a confident decision.

### Current implementation reality

The app currently supports:

- defining preferences
- discovering vehicles
- liking vehicles
- comparing up to 3 Top Picks

But the product does not yet have a strong formal “I chose this car” transition.

### Why this matters

Right now, the buyer journey narrows effectively, but it does not fully convert into the next lifecycle stage in a product-native way.

### Likely implementation themes

- formal “chosen vehicle” or “move into ownership” action
- clearer end-state after comparison
- explicit handoff into Life Together

## Ownership Journey Gaps

## 4. Life Together Is Meaningfully Started, but Still Feels Seeded Rather Than Fully Owned

**Priority:** `Now`

### Product intent

Life Together should function as a true ownership companion.

### Current implementation reality

The current screen already has:

- garage-like vehicle context
- service needs
- provider suggestions
- care history patterns

But much of this still behaves like seeded or sample ownership scaffolding rather than a fully lived-in ownership system.

### Why this matters

The ownership phase is one of the strongest long-term differentiators in the Rev Matched vision. It should eventually feel like more than a thoughtful demo of the idea.

### Likely implementation themes

- formal garage vehicle state
- clearer ownership record editing and persistence
- stronger linkage between selected vehicle and ownership timeline
- more realistic maintenance and reminder behaviour

## 5. The Transition Into Life Together Is Not Yet Explicit Enough

**Priority:** `Now`

### Product intent

The relationship with the app should continue naturally after purchase.

### Current implementation reality

The current app conceptually seeds Life Together from matched or shortlisted vehicles, but the moment of transition is not yet fully formalized.

### Why this matters

Without a clear lifecycle handoff, the ownership journey can feel adjacent to the buyer flow rather than like its natural continuation.

### Likely implementation themes

- explicit move from candidate vehicle to owned vehicle
- ownership start date or acquisition state
- stronger garage entry flow

## Seller Journey Gaps

## 6. Moving On Is Still Primarily a Vision Screen

**Priority:** `Now`

### Product intent

Moving On should support:

- listing preparation
- pricing guidance
- seller confidence
- buyer engagement support
- and ownership transfer help

### Current implementation reality

Today, Moving On is still mostly:

- a branded placeholder
- a future-direction statement
- and a conceptual entry point

### Why this matters

This is the single biggest gap between product vision and implemented experience.

### Likely implementation themes

- seller onboarding flow
- listing draft flow
- photo guidance
- pricing support
- listing quality feedback

## 7. Seller Analytics and Listing Support Are Not Yet Product-Real

**Priority:** `Next`

### Product intent

Seller experiences should help people create better listings and understand buyer interest without sounding corporate or overly technical.

### Current implementation reality

This area is still mostly represented in docs and vision language, not in active product behaviour.

### Why this matters

The seller journey will eventually need its own strong product surface, not just conceptual parity with the buyer journey.

### Likely implementation themes

- listing performance signals
- buyer-interest cues
- pricing comparison summaries
- transaction-readiness prompts

## Data and Domain Gaps

## 8. Listing Data Reality Is More Complex Than the Current App Model

**Priority:** `Now`

### Product intent

Rev Matched should eventually handle real Trinidad market listings with cleaner structure than the source marketplaces provide.

### Current implementation reality

The current app uses a simplified listing shape that is enough for the experience, but it does not yet represent the full range of:

- source metadata
- Trinidad-specific listing concepts
- raw vs normalized values
- duplicate listing concerns
- sparse data behaviour

### Why this matters

The current experience can move quickly because the dataset is curated, but real ingestion and marketplace expansion will need a richer listing model.

### Likely implementation themes

- source marketplace fields
- source listing identifiers
- raw listing text preservation
- import status and plate-series handling
- availability and listing-quality states

## 9. Journey State Naming in Code and Business Language Still Needs Eventual Full Alignment

**Priority:** `Next`

### Product intent

Business language should cleanly distinguish:

- Match
- Like
- Pass
- Top Pick

### Current implementation reality

The product docs are now much cleaner than some underlying implementation language. Some current code still uses internal state labels that do not map perfectly to the preferred business vocabulary.

### Why this matters

This is not an urgent user-facing problem, but it will become more important as the app grows and more logic accumulates around those states.

### Likely implementation themes

- internal naming cleanup
- clearer separation of system match state vs user shortlist state
- cleaner future analytics and data modelling

## UX and Flow Gaps

## 10. Current UI Language Is More Aligned Than Before, but Some Surfaces Will Still Need Ongoing Cleanup

**Priority:** `Next`

### Product intent

The product should sound:

- human
- calm
- emotionally intelligent
- and consistent

### Current implementation reality

The docs are now in much better shape, but as the app grows, UI labels and helper text will still need occasional review to keep them aligned with:

- `Find Your Match` vs `Find the One`
- `Top Pick` vs `Top Picks`
- current discovery bucket names

### Why this matters

Naming drift is subtle. It does not always break features, but it does weaken clarity and cohesion over time.

### Likely implementation themes

- UI copy audit
- component-level label review
- lightweight content QA process

## 11. Onboarding and Account Flows Are Still MVP-Light

**Priority:** `Later`

### Product intent

Sign-in, sign-up, and profile should eventually support:

- continuity
- alerts
- personalization
- and ownership persistence

### Current implementation reality

These flows currently act more like MVP session utilities than full account systems.

### Why this matters

This is acceptable for now, but the ownership and seller journeys will eventually need stronger identity and persistence than the current lightweight gating model provides.

### Likely implementation themes

- fuller account model
- saved alerts
- profile-backed preferences
- owned vehicle persistence

## Recommended Near-Term Focus

If Rev Matched wanted the clearest next implementation focus, this would be a strong order:

1. Deepen match and discovery logic without overcomplicating the UX
2. Formalize the handoff from buyer journey into Life Together
3. Make Life Together feel more genuinely owned and persistent
4. Start building the first true seller workflow inside Moving On
5. Continue aligning naming and state concepts between docs and code

## Gaps By Theme Summary

| Theme | Current strength | Main gap |
|---|---|---|
| Buyer flow | Strong | Matching depth and end-of-journey transition |
| Discovery | Strong | More nuanced recommendation behaviour |
| Comparison | Strong | Clearer final-choice handoff |
| Ownership | Emerging | More persistence and real lifecycle structure |
| Seller flow | Early | Needs first true workflow |
| Data model | Emerging | Needs real-market listing complexity support |
| Account/session | MVP-light | Needs deeper persistence later |

## Recommended Companion Docs

This document works especially well alongside:

- [User Journey Map](./user-journey-map.md)
- [Screen Descriptions](./screen-descriptions.md)
- [Matching Logic Notes](./matching-logic-notes.md)
- [Interaction Rules](./interaction-rules.md)
- [RevMatched Data Dictionary](./rev-matched-data-dictionary.md)

## Closing Principle

Rev Matched does not need a total reinvention of its foundation.

The foundation is already good.

What it needs next is disciplined follow-through:

- deepening what is already working
- formalizing the lifecycle transitions
- and closing the gaps between vision, logic, and product reality one layer at a time
