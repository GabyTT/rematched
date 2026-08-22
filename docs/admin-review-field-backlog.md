# Admin Review — Extra Fields to Capture Later

## Purpose

This note is a holding area for useful source fields that may improve admin review later, without slowing down the current ingestion workflow right now.

The idea is:

- keep the current flow working
- capture improvement ideas as they come up
- and only expand extraction when the next field clearly helps trust, review speed, or listing quality

## Current Position

Right now the admin review flow is already useful because it shows:

- source
- source URL
- source image preview for testing/admin review
- title
- price
- year
- brand
- model
- admin-only source contact name
- admin-only source contact text
- review state
- recommendation state
- confidence
- system doubt note

That is enough to test the ingestion-review loop.

## Extra Fields to Consider Later

These are not urgent for the current phase, but they may be valuable in the next refinement pass.

### Seller details

- clearer seller/company name
- secondary phone numbers
- WhatsApp-specific indicator
- seller type hints such as owner, dealer, or broker
- location or branch tied to the seller

### Vehicle details

- mileage
- transmission
- fuel type
- body type
- drivetrain
- engine size
- trim or variant
- color
- registration status

### Listing details

- posted date
- refreshed date
- availability wording from source
- listing status wording from source
- stronger duplicate clues
- stronger stale-listing clues

### Admin review helpers

- direct extraction warnings from the parser
- stronger mismatch notes between title and structured fields
- clearer reason for low confidence
- indication of which fields were inferred versus directly captured
- note when seller name is missing but phone is present

## How to Decide What to Add Next

A field should move from this backlog into implementation when it does at least one of these:

- helps admin approve or reject faster
- reduces confusion during source checking
- improves buyer trust later
- helps detect duplicates or stale listings
- improves seller attribution or contact clarity

## Suggested Priority Order

If we expand this later, the best next fields are probably:

1. seller type
2. mileage
3. transmission
4. location detail
5. posted or refreshed date
6. clearer parser warning reasons

## Reminder

Do not expand extraction just because a field exists.

Only add it when it improves:

- admin confidence
- listing quality
- or operational speed
