# RevMatched Current Build Status

Last updated: July 23, 2026

For the current operational source-to-live process, see [Ingestion and Admin Process](./ingestion-and-admin-process.md). This file is a build-history snapshot and may retain older implementation context.

## Local Development and Testing Rule

Use **http://localhost:3001** for Rev Matched. Port 3000 is reserved for another local app and must not be used for this project.

Start Rev Matched with:

```bash
npm run dev
```

The project command is configured to start Next.js on port 3001.

## Milestone Summary

RevMatched is now past the first buyer-profile and inventory-foundation milestone. The app has local Supabase-backed identity, preferences, normalized inventory reads, and a Discover flow that can use real buyer-visible listings while still preserving the existing mock fallback experience.

The current build is ready to move into scraping and ingestion functionality.

## Completed

### Supabase Auth

- Supabase Auth is wired into the existing sign-up, sign-in, and sign-out flows.
- Sign-up creates a Supabase Auth user and prepares a matching `profiles` row.
- User display names are stored in `profiles.display_name` and shown in the app chrome when available.
- Sign-out clears local authenticated state and returns the user to the home flow.

### Define Preferences

- Define preferences save and load per signed-in Supabase user.
- Preference data is stored through:
  - `preference_profiles`
  - `preference_profile_brands`
- Local guest behavior still works, so users can define preferences before signing up.
- Supabase preference saving/loading does not replace the local guest experience.

### Database Foundation

- Raw ingestion foundation tables have been created:
  - `listing_sources`
  - `ingestion_runs`
  - `raw_listings`
  - `raw_listing_images`
- Normalized buyer-facing inventory tables have been created:
  - `normalized_listings`
  - `normalized_listing_images`
- RLS is in place so normal buyers cannot access raw ingestion tables.
- Buyer-facing inventory visibility is controlled through normalized listing fields such as buyer visibility, review status, recommendation state, and availability status.

### Discover Inventory

- Discover reads buyer-visible normalized listings from Supabase.
- Supabase inventory is adapted into the existing `Car[]` UI shape.
- If Supabase inventory is empty or unavailable, Discover falls back to the existing mock data in `lib/cars.ts`.
- Discover reloads inventory when Supabase auth state becomes available or changes.
- The mock fallback remains intact.

### Journey State

- Journey state works with both:
  - Supabase-backed normalized listing IDs
  - existing mock `lib/cars.ts` IDs
- Like, Pass, Liked, Top Picks, notes, and compare flows have been adjusted to use the active inventory rather than only static mock cars.
- User actions now store action timestamps:
  - `likedAt`
  - `passedAt`
  - `topPickedAt`
- These timestamps support the completed-lineup state.

### Completed Lineup State

- Discover distinguishes between:
  - no matches available
  - the user has completed today's matched lineup
- When today's lineup is complete, the progress bar remains visible and shows full completion.
- The completion state includes a subtle one-time completion animation.
- The completed-lineup copy is guest-aware:
  - guests see copy that does not guarantee future matches without signup
  - signed-in users can see tomorrow-oriented continuity copy

### Guest Progressive Signup Nudge

- Guests can browse, define, match, like/pass, and complete a lineup without being blocked.
- The signup invitation now appears inline after the user has received value.
- The signup modal no longer opens automatically after guest actions.
- The modal opens only when the guest clicks the inline CTA.
- Guest engagement is tracked locally in `localStorage` through:
  - `actionsTaken`
  - `sessionsCompleted`
  - `lastCompletedDate`
  - `detailsOpened`

### Define Responsiveness

- The Define page has been updated to avoid horizontal overflow on narrow screens.
- The budget slider hides wide value bubbles on mobile and shows compact Min/Max values below the slider.
- The Define page shell, AppChrome header, brand chip rows, and slider containers have been made viewport-safe.

## What Remains Local or Mock

- `lib/cars.ts` remains in place as the mock fallback inventory.
- Buyer Journey state is still stored locally rather than persisted to Supabase interaction tables.
- Liked cars, Top Picks, notes, compare selections, and guest progress are still local browser state.
- Discover is connected to Supabase inventory, but Match, Liked, and Top Picks are not yet backed by Supabase interaction tables.
- Admin ingestion screens and workflows remain mock/local UI concepts.
- No actual scraping or listing ingestion jobs are running yet.
- Raw ingestion tables exist, but no production ingestion pipeline writes into them.
- Normalized listing data is currently loaded through fixtures/manual records, not automated normalization.
- No remote Supabase deployment has been pushed as part of this local build milestone.

## Next Phase

The next recommended phase is scraping and ingestion functionality.

Suggested focus:

1. Build the first controlled scraper or ingestion adapter.
2. Write ingested source data into the raw ingestion tables.
3. Add a normalization step that creates or updates `normalized_listings`.
4. Add admin/internal review tooling for normalized listing quality and buyer visibility.
5. Keep buyer-facing Discover protected by the existing visibility rules.

The goal of the next phase is to move from manually seeded normalized inventory toward a repeatable ingestion pipeline that can safely feed real buyer-visible listings.

### Ingestion phase started

- A reusable source-adapter contract now lives under `lib/ingestion/`.
- The first controlled JSON adapter supports validation-only dry runs and explicit local Supabase writes.
- Raw writes create ingestion-run records, preserve the source payload, link images, and safely update listings with the same stable source ID.
- A reusable controlled normalization step now converts raw listings into normalized inventory using the existing parsing, confidence, and eligibility rules.
- Local validation on July 13, 2026 stored and normalized two sample listings. Both remained safely hidden from buyers with `review_required` because the controlled fixture has no approved pics.
- The Admin Listings screen now reads real normalized inventory from local Supabase and shows database-backed confidence, review, recommendation, and buyer-visibility states. This service-role view is deliberately restricted to local development until server-side admin authentication is added.
- The ingestion workflow now includes an image-safety gate: unauthorized or missing source images use a neutral AI-generated thumbnail with a visible “not the actual vehicle” disclosure. Source previews remain blocked until permission is confirmed.
- Buyer-facing imported inventory now carries source name and original-listing URL through the shared car model. Cards, details, and comparison views display source attribution without exposing raw ingestion records.
- The next source decision is intentionally still open: confirm permitted access and attribution/image rules before connecting a live marketplace or dealer feed.
- Usage is documented in `docs/controlled-ingestion-adapter.md`.

## Technical Follow-Up

### SwipeDeck lint issue

- Status: deferred for a later cleanup pass.
- File: `components/SwipeDeck.tsx`
- Location observed: around line 109.
- Check: run `npm run lint`.
- Current lint rule: `react-hooks/set-state-in-effect`.
- Issue: the deck-reset effect calls React state setters synchronously, beginning with `setDiscoverDeck(cars)`. ESLint flags this because synchronous state updates inside an effect can cause cascading renders.
- Before changing it, preserve the current behavior when the incoming car deck changes: reset the displayed deck, initial deck size, current index, swipe direction, and completion-shake state.
