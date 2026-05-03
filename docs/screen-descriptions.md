# Rev Matched — Screen Descriptions

## Purpose

This document describes the major screens in the Rev Matched product and the job each one plays in the overall journey.

It is intended to help product, design, and development stay aligned on:

- what each screen is for
- where it sits in the user journey
- what emotional role it plays
- what key actions it should support
- and which screens are currently more mature versus still evolving

This is a business-facing product map, not a technical routing document.

## Screen System Overview

Rev Matched currently spans three primary experience areas plus a small set of supporting account and utility screens.

| Experience Area | Core Purpose |
|---|---|
| Find Your Match | Help users define preferences, discover vehicles, save contenders, and compare finalists |
| Life Together | Support ownership, upkeep, reminders, and service discovery |
| Moving On | Support the future seller journey and transition out of ownership |
| Account & Utility | Support session entry, profile setup, and lightweight account controls |

## Naming Note

The broader product experience is called `Find Your Match`.

The current in-app entry label and route name are `Find the One`.

For now, both names may appear in the product ecosystem:

- `Find Your Match` = the broader buyer journey concept
- `Find the One` = the current screen/section label in the live app

## Primary Journey Screens

## Home

### Purpose

The Home screen introduces Rev Matched as a relationship-driven automotive platform rather than a traditional listings site.

It acts as the gateway into the three major product experiences:

- Find the One
- Life Together
- Moving On

### Current Role

The screen functions as:

- the brand and positioning entry point
- a lightweight orientation screen
- and a directional launch point into the major product journeys

### Emotional Goal

Home should feel:

- welcoming
- aspirational
- confident
- and easy to enter

### Key Actions

- start the buyer journey via `Find My Match`
- enter `Find the One`
- enter `Life Together`
- enter `Moving On`

## Find the One

### Purpose

This screen is the current entry point into the buyer journey.

Its job is to help users define what matters before they start browsing vehicles. It is where Rev Matched begins listening before recommending.

### Current Role

The screen currently acts as:

- the preference-definition screen
- the buyer setup experience
- and the launch point into discovery

It is one of the most strategically important screens in the product because it turns car shopping from open-ended browsing into guided discovery.

### Key User Inputs

The screen currently supports definition of:

- minimum budget
- maximum budget
- vehicle type
- preferred brands
- preferred model text

It also includes guided helper flows that support users who are unsure what to choose, including car-type guidance and budget support.

### Emotional Goal

This screen should feel:

- clarifying
- supportive
- low-pressure
- and confidence-building

### Key Actions

- set or revise budget range
- select vehicle type
- choose brands
- enter model preferences
- use helper tools for guidance
- continue into Discover

## Discover

### Purpose

Discover is the core browsing and recommendation screen in the buyer journey.

Its job is to present vehicles in a way that feels curated, manageable, and responsive to the user’s preferences.

### Current Role

This is currently the most interaction-heavy browsing screen in the app.

It combines:

- match-led discovery
- swipe-style review
- card browsing
- recommendation tabs
- and deeper vehicle detail access

### Current Discovery Structure

The screen currently supports a primary discovery flow plus `Explore More` pathways.

Current surfaced exploration groupings include:

- `Keep Exploring`
- `In Your Budget`
- `Second Chances`
- `All`

These allow the user to move from tightly curated results into broader exploration without losing the feeling of progression.

### Key Actions

- Like a vehicle
- Pass a vehicle
- promote a liked vehicle toward Top Pick status
- open vehicle details
- refresh discovery
- explore beyond direct matches

### Emotional Goal

Discover should feel:

- exciting
- manageable
- dynamic
- and momentum-building

The user should feel that the system is helping them narrow their options, not dumping inventory on them.

## Liked

### Purpose

The Liked screen is the user’s short-term consideration space.

It gives users a place to revisit cars that caught their attention and begin moving from attraction toward evaluation.

### Current Role

This screen currently functions as:

- the saved-interest layer of the buyer journey
- the staging area before Top Picks
- and a place for lightweight notes and review

### Key Behaviours

Users can:

- review liked vehicles
- add notes
- open vehicle details
- move vehicles into Top Picks
- remove vehicles from Top Picks while keeping them liked

### Emotional Goal

Liked should feel:

- personal
- organized
- reflective
- and lightly decisive

This is where the user begins to move from “I like this” toward “I may seriously choose this.”

## Compare Top Picks

### Purpose

This screen is the final narrowing and comparison space in the current buyer MVP.

It exists to help users compare their strongest contenders side by side and move toward a confident choice.

### Current Role

This screen currently acts as:

- the shortlist comparison screen
- the decision-clarity layer of the buyer journey
- and the place where Top Picks are reviewed in the most focused format

### Key Behaviours

Users can:

- compare up to 3 Top Picks
- review structured vehicle differences
- open details
- add notes
- remove a Top Pick back to Liked

### Emotional Goal

Compare Top Picks should feel:

- focused
- calm
- clear
- and decision-ready

It should reduce analysis paralysis rather than intensify it.

## Ownership Screens

## Life Together

### Purpose

Life Together is the ownership companion area of Rev Matched.

Its job is to extend the relationship with the user after the purchase moment and make the platform useful throughout ownership.

### Current Role

The current screen functions as an early ownership dashboard. It combines:

- vehicle garage context
- maintenance and care reminders
- provider discovery
- and basic ownership history

### Current Screen Structure

The screen currently includes:

- a garage made from the user’s selected or matched vehicles
- ownership needs such as service, tyres, battery, insurance, and licensing
- provider suggestions tied to those needs
- care history and ownership details

### Emotional Goal

Life Together should feel:

- dependable
- steady
- useful
- and reassuring

### Key Actions

- review owned or active vehicles
- check maintenance-related needs
- browse relevant service providers
- review care history
- manage ownership status

## Seller Journey Screens

## Moving On

### Purpose

Moving On represents the seller and transition stage of the Rev Matched vision.

Its long-term job is to help users prepare, list, price, and transition out of a vehicle with less friction and more confidence.

### Current Role

Today, this screen is still an early-stage positioning and entry screen rather than a full seller workflow.

It currently serves as:

- a placeholder for the seller journey
- a statement of future product direction
- and a conceptual on-ramp into listing support

### Emotional Goal

Moving On should feel:

- clear
- practical
- encouraging
- and low-stress

### Future Expected Responsibilities

Over time, this area is expected to support:

- listing preparation
- stronger listing creation
- pricing guidance
- engagement visibility
- and transfer support

## Supporting Account and Utility Screens

## Profile

### Purpose

The Profile screen provides a lightweight home for account-level preferences and future personalization controls.

### Current Role

At present, it is a simple support screen that:

- reinforces that preferences power the buyer journey
- provides a path back into `Find the One`
- and allows the user to reset the journey state

### Emotional Goal

Profile should feel:

- simple
- tidy
- and practical

## Sign In

### Purpose

The Sign In screen is currently an MVP support screen used to simulate returning-user access.

### Current Role

It is not yet a full authentication system. Instead, it acts as:

- a lightweight session-entry point
- and a testing support screen for the current experience

### Emotional Goal

Sign In should feel:

- lightweight
- familiar
- and friction-reducing

## Sign Up

### Purpose

The Sign Up screen currently supports the `Unlock alerts` idea and gives users a lightweight path into an authenticated session.

### Current Role

Like Sign In, it is presently an MVP support screen rather than a complete onboarding or account creation flow.

### Emotional Goal

Sign Up should feel:

- inviting
- low-commitment
- and forward-moving

## Cross-Screen Journey Support

## Journey Roadmap

### Purpose

Across the buyer flow, Rev Matched includes a visible roadmap that reinforces progression through the current stages:

- Define
- Discover
- Liked
- Top Picks

### Current Role

This is not a standalone page, but it is important enough to describe as a screen-level system because it shapes how users understand the entire buyer journey.

Its job is to:

- show where the user is
- reinforce forward movement
- and make the multi-step structure feel intentional

## Modals and Overlay Interactions

### Purpose

Several important moments in the product currently happen in modals or sheets rather than full screens.

These include:

- vehicle details
- notes
- Top Pick limit handling
- unlock alerts

### Product Role

These overlays help the app preserve flow while still supporting deeper interaction.

They should be treated as supporting interaction surfaces rather than primary screens, but they are part of the real user journey and matter for product planning.

## Screen Maturity Snapshot

The current screen set is not equally mature across all three major experiences.

| Screen / Area | Current maturity |
|---|---|
| Home | Strong directional entry screen |
| Find the One | Strong and strategically important |
| Discover | Strong and interaction-rich |
| Liked | Strong and functional |
| Compare Top Picks | Strong and functional |
| Life Together | Early but meaningfully developed |
| Moving On | Early directional placeholder |
| Profile / Sign In / Sign Up | Lightweight support screens |

## Recommended Product Reading Order

If someone is trying to understand Rev Matched quickly, these screens are best understood in this sequence:

1. Home
2. Find the One
3. Discover
4. Liked
5. Compare Top Picks
6. Life Together
7. Moving On

This order mirrors the strongest current journey and the clearest expression of the product vision.

## Closing Principle

Rev Matched screens should not feel like disconnected pages in a classifieds app.

They should feel like connected moments in a guided relationship journey:

- from defining what matters
- to discovering possibilities
- to narrowing contenders
- to owning with confidence
- to moving on with clarity

Each screen should make the next step feel easier, clearer, and more human.
