# RevMatched Gamified User Loop

## Purpose

RevMatched uses light gamification and behavioral design to guide users from browsing to confident decision-making without making the app feel gimmicky.

RevMatched is not just a listing app. It is a guided decision progression system:

Define -> Discover -> Like -> Top Picks

The product goal is to reduce overwhelm, create momentum, and help users feel that the system is doing useful work for them.

This document uses Octalysis / 8 Core Drives as a light product-thinking lens. The goal is not to add points, badges, or leaderboards. The goal is to understand human motivation and shape a calmer, more useful decision journey.

## 1. Core Product Loop

The core loop:

1. User defines preferences.
2. System presents a manageable lineup of matches.
3. User takes simple actions: Like / Pass / Top Pick.
4. Progress bar shows movement through the lineup.
5. Completion state rewards the user: "You've met today's lineup."
6. Guest users are invited to save progress only after experiencing value.
7. Signed-in users can preserve progress and eventually receive match alerts.

Key principle:

Reward first, then invite.

The user should feel progress before the product asks for commitment. Signup should feel like a useful continuation of the experience, not a toll booth.

## 2. Four User Types Matrix

RevMatched users can be understood through two axes:

| | Low readiness to act | High readiness to act |
|---|---|---|
| Low clarity of what they want | Dreamers | Overwhelmed Buyers |
| High clarity of what they want | Explorers | Decisive Buyers |

### Dreamers

Low clarity / low readiness

- Just browsing
- Motivated by curiosity and future imagination
- Needs low-pressure exploration

Product posture:

Dreamers should be allowed to wander without pressure. The product should make browsing feel safe, lightweight, and a little aspirational.

### Explorers

High clarity / low readiness

- Knows what they like but not ready to buy
- Motivated by ownership, alerts, and not missing good options
- Best fit for "keep watching for me"

Product posture:

Explorers need a reason to return. Their picks, preferences, and future alerts should feel like useful memory, not forced account creation.

### Overwhelmed Buyers

Low clarity / high readiness

- Needs a car but lacks confidence
- Motivated by relief, guidance, and decision support
- Best served by Define helpers and simplified choices

Product posture:

Overwhelmed Buyers need fewer choices, clearer tradeoffs, and visible progress. The system should reduce mental load and give them a sense of forward motion.

### Decisive Buyers

High clarity / high readiness

- Knows what they want and wants speed
- Motivated by certainty, comparison, and urgency
- Best served by Top Picks and comparison flow

Product posture:

Decisive Buyers should be able to move quickly from match discovery to serious contenders. Top Picks should feel like a short, intentional shortlist.

## 3. Octalysis Core Drive Mapping

### Dreamers

Relevant drives:

- Unpredictability / curiosity
- Empowerment / exploration
- Epic meaning / future lifestyle imagination

Why it matters:

Dreamers are not ready to decide yet. They need room to explore possibilities and imagine how different cars might fit into their future life.

### Explorers

Relevant drives:

- Ownership: my picks, my shortlist
- Accomplishment: progress through matches
- Unpredictability: new matches tomorrow
- Avoidance: don't lose progress / don't miss a good match

Why it matters:

Explorers are receptive to alerts and saved progress because they already have a taste. The product should help them feel that their preferences are being remembered and watched over.

### Overwhelmed Buyers

Relevant drives:

- Avoidance: fear of bad decision
- Accomplishment: visible progress
- Empowerment: guided choices reduce uncertainty

Why it matters:

Overwhelmed Buyers need guidance more than novelty. Define helpers, simple actions, and completion feedback can turn anxiety into movement.

### Decisive Buyers

Relevant drives:

- Accomplishment: narrowing to the best option
- Ownership: Top Picks feel like serious contenders
- Scarcity / avoidance: good listings may disappear

Why it matters:

Decisive Buyers need the product to help them focus. The emotional reward is not browsing more; it is feeling closer to a confident decision.

## 4. Current Implemented Loop

The current build already includes the first version of this loop:

- Define preferences
- Match filtering
- Like / Pass
- Top Picks
- Liked review
- Progress bar through lineup
- Completed lineup state
- Guest engagement tracking
- Soft signup nudge after completion
- Signup modal opens only on user intent
- Responsive Define page fixed
- Supabase inventory integration with fallback

The important behavioral foundation is now present: users can make progress before being asked to sign up.

## 5. Guest Progressive Unlock Flow

Guests can:

- Define preferences
- Browse matches
- Like/pass
- Complete today's lineup

The system should not interrupt early.

Signup should be introduced only after value is felt. The product should wait until the user understands what RevMatched is doing for them.

Current guest completion copy:

Main:

"You've met today's lineup."

Nudge:

"Don't lose today's progress."

Support:

"Save your picks and we'll keep watching for matches like these."

CTA:

"Let us keep watching for you"

Principle:

Do not overpromise tomorrow's matches to guests unless they sign up.

Signed-in users may receive stronger continuity language later:

"You've met today's lineup — we'll bring you more tomorrow."

## 6. CTA Hierarchy Rule

Primary action should continue the journey.

Secondary action should invite signup.

In the completed-lineup state:

Primary:

Review Liked

Secondary:

Let us keep watching for you

Tertiary:

Keep browsing / Refine Preferences

Important visual rule:

Do not use red text on dark backgrounds.

Red should be reserved for solid primary buttons with light text, or used as subtle accents where readability is protected.

This hierarchy keeps the product action clear: the user should first review what they already liked, while signup remains available as a helpful continuation.

## 7. Future Gamified Enhancements

These ideas are not yet implemented. They should stay subtle, premium, and useful.

- Daily lineup / daily drops
- New match alerts
- "We found X new cars since yesterday"
- Saved searches
- Streak-like but subtle return loop
- Completion animation polish
- Better ownership language around "your picks"
- Buyer confidence score or readiness indicator
- Progressive onboarding based on user type
- Seller-side intelligence loop later

Avoid:

- points
- badges
- leaderboards
- gimmicky game language

The future loop should feel like a trusted assistant quietly doing useful work, not a game trying to manufacture urgency.

## 8. Product Principle Summary

RevMatched should turn car browsing into a guided decision journey.

The experience should make users feel:

- less overwhelmed
- more confident
- more in control
- gently rewarded for progress
- motivated to return because the system keeps watching for them
