# Seller Account and Photo Approval — First-Build Plan

**Status:** seller access, seller detail review, private seller photo upload, and basic Admin photo approval are implemented locally.  
**Date:** 30 July 2026  
**Related documents:** [Ingestion and Admin Process](./ingestion-and-admin-process.md), [Admin Ingestion Workflow](./admin-ingestion-workflow.md), and [TriniCars-to-Rev-Matched Field Audit](./trinicars-revmatched-field-audit.md).

## Purpose

This plan defines the first seller-facing experience that follows the existing admin workflow:

```text
Imported → Verified → Seller Contacted → Pics Received → Live
```

It lets a contacted seller confirm and correct their car information, supply their own photos, and manage their cars after they are live. It keeps the admin responsible for approving every buyer-facing photo and for the final first-time **Go Live** decision.

It does **not** change the current ingestion logic or make imported TriniCars photos buyer-facing.

## Agreed principles

1. A seller owns the information and photos for their own cars.
2. A seller should not have to re-enter details that Rev Matched already imported. They review and correct pre-filled information.
3. TriniCars photos are source-reference material for Admin only. Sellers and buyers never see them in this experience.
4. A seller may edit vehicle details and price. Those text changes do not need content approval.
5. Every photo change needs admin approval before it changes what buyers see.
6. A first-time listing remains admin-controlled until the admin has approved photos and explicitly makes it Live.
7. An already-Live listing stays Live while a seller's new or replacement photos wait for approval.
8. The seller must confirm that their information is accurate and that they have the right to upload and publish their photos.

## First-version seller access

### Account identity and sign-in

- The seller's phone number is their account identifier.
- One seller account can have more than one linked car.
- The seller opens a link sent by the admin and enters their phone number plus a system-generated access code.
- The code expires after **30 days**.
- The sign-in phone number remains fixed for this first version. An admin changes it if necessary.
- A seller can request a reset at any time. For now, the request is handled manually: the admin generates a new code and sends it through the existing WhatsApp Business process.
- There is no account-creation flow for the first version.

### Current implementation

The first seller-access foundation is now available in the local build:

- Admin can link one or more cars to a seller phone number and issue or replace a 30-day code.
- The ready-to-copy admin message contains the seller-page link and code together, so the seller receives one complete communication.
- The seller page at `/seller` accepts the linked phone number and code, then shows only that seller's linked cars.
- Seller access is kept in a signed, http-only browser session that ends when the code expires.
- Sellers can now open each linked car, review the pre-filled vehicle and public-contact details, manage the feature list, save a Draft, and select **Submit to Admin** after confirming the details are accurate.
- Sellers can upload JPG, PNG, or WebP photos, choose a preferred main photo, and see whether each submitted photo is pending, approved, or needs attention. These uploads use a separate private seller-media store; imported TriniCars photos remain unavailable to the seller.
- When a seller submits first-time photos, the listing moves to **Pics Received** and remains hidden from buyers. Admin can approve or reject each seller photo with an optional note. The system prevents **Go Live** until at least one seller photo has been approved.
- Seller detail submissions are securely restricted to the cars linked to the signed-in seller account. Core vehicle updates are saved to the local normalized listing; seller-only details such as colour, engine specification, features, Additional Info, and public contact preferences are stored separately for the next buyer-presentation step.
- The current seller page does not show imported source photos or private source information.

### Still to build in the photo flow

- Admin plate redaction before approval.
- Seller-requested replacement and removal flows (including the no-photo retirement warning).
- Buyer-facing buyer-contact methods beyond the current public name and phone. Buyer photo galleries now use every approved seller photo, while the card continues to use the selected main photo; the buyer detail view now shows the seller-confirmed public name and phone for a Live listing.
- Ready-to-copy Admin messages for photo corrections and Live confirmation.

### What the seller can see

- Only cars linked to their phone number.
- A clear **Explore All** link that takes them to the Rev Matched home page.
- No way to search for, open, or alter another seller's car.
- No imported TriniCars photos or private source-contact information.

### Deferred

Sellers will eventually be able to add a completely new car themselves. That is deliberately deferred from this first build; initially, the Admin links imported cars to sellers.

## Seller-facing car statuses

The seller sees plain-language statuses, not the internal admin workflow labels:

| Seller wording | Meaning |
| --- | --- |
| **Draft** | The seller has started changes but has not submitted them. |
| **Action needed** | The admin has requested a correction or clearer/safer photo. This must stand out visually on the relevant car. |
| **Photo approval pending** | The seller submitted photos or a photo change; the buyer-facing photo set has not changed yet. |
| **Live** | The car is publicly available on Rev Matched. Show a clear confirmation and a link to its public listing. |

The internal workflow remains unchanged. On the first submission with seller photos, the listing moves to **Pics Received** for final admin review. An already-Live listing remains Live while its photo change is pending.

## Seller car form

### Pre-filled information to review and correct

The seller sees the imported information already completed where known, and can correct it:

- make, model, and year
- colour
- engine specification
- mileage
- transmission
- asking price
- selected vehicle features, grouped under a **Features** heading
- Additional Info
- seller name and public contact methods

The full known feature list is available under the Features heading, so a seller can confirm, add, or remove selections rather than being limited to whatever the source captured.

### Public buyer details

After the seller confirms them, buyers see:

- colour, engine specification, selected features, and Additional Info
- the seller's chosen contact methods, so they can contact the seller directly

Contact preferences are set at account level by default and may be overridden for an individual car. At least one public seller contact method is required before a car can be made Live, and that approved contact information must be shown to buyers on the Live listing. Source-site contact information is never a substitute and remains Admin-only.

For an already-Live car, seller detail and price corrections update the buyer listing when the seller selects **Submit to Admin**. The existing imported/source verification process still applies before a seller is invited; this rule means that the seller's own later text corrections do not wait for a separate content-approval queue.

### Saving and submitting

- Sellers can save a draft and return later.
- The final action is a clear **Submit to Admin** button.
- Submission requires a confirmation checkbox stating that the details are accurate and the seller has the right to provide and publish the photos.
- Admin correction requests appear prominently within the affected car, not as an easily missed generic message.

## Seller photos

### Photo source and buyer visibility

- Buyers see **seller-provided and admin-approved** photos only. The card uses one selected main photo; the buyer detail view shows the full approved seller-photo gallery.
- Imported TriniCars images are never shown to buyers or sellers.
- The seller decides how many views to provide for now; Rev Matched does not impose a fixed full photo set.
- At least one approved seller photo is required for a car to be made Live.

### Photo controls

- The seller can upload new photos.
- The seller can request a replacement for an existing photo.
- The seller can request removal of an existing photo.
- The seller can choose their preferred main photo.
- The admin may choose another approved seller photo as the main photo if it is clearer or safer.

### Approval rule

Every seller photo addition, replacement, or removal is pending until Admin approves it. Until approval, buyers continue to see the current approved photo set.

Admin approval covers at least:

- whether the image is suitable for a public, PG buyer experience
- number-plate blocking/redaction before it is public
- whether the preferred main photo is appropriate
- whether the final photo set still meets the minimum of one approved seller photo

If a requested removal would leave no approved seller photo, show the seller this clear warning before submission:

> **Your listing will be retired unless you provide at least one photo.**

The system does **not** retire the listing automatically. The admin decides whether to retain it, ask for a replacement, hide it, or retire it.

## Admin responsibilities

### Existing pre-contact work

Admin continues the existing source workflow before invitation:

```text
Imported → Verified → Seller Contacted
```

This includes source comparison, basic data verification, availability checking, and recording seller outreach.

### Seller submission work

After a seller submits:

- first-time seller photos place the car in **Pics Received** for final review
- review each photo change; approve or request a correction with a clear note
- apply plate redaction where needed before approval
- select/confirm the main photo
- use **Go Live** to make a first-time listing visible to buyers
- for a Live car, approve photo changes without taking the existing listing offline
- decide manually whether a car should be hidden or retired if it no longer has an acceptable approved photo

The Admin interface should offer a ready-to-copy WhatsApp message when:

- inviting a seller or sending/replacing an access code
- requesting a correction
- confirming that a listing is Live

This supports the low-cost manual messaging process chosen for the first version.

## Intended experience flow

```text
Admin verifies source listing
→ Admin contacts seller
→ Admin links car(s) to seller phone number and sends link + 30-day code manually
→ Seller signs in and sees their linked car(s)
→ Seller reviews/corrects details, chooses contacts, and uploads own photos
→ Seller saves Draft or selects Submit to Admin
→ First submission with photos: Pics Received / seller sees Photo approval pending
→ Admin approves/redacts photos and selects Go Live
→ Seller sees Live + public-listing link

For a Live car:
Seller changes text → buyer-facing text updates on Submit to Admin
Seller changes photos → existing approved photos remain public until Admin approves the change
```

## Data and security direction for implementation

This feature needs an additive, seller-owned data model. It must not put seller-uploaded media in the current refresh-controlled imported-image path, because source refreshes currently delete and recreate those image rows.

The implementation should introduce separate concepts for:

1. **Seller account** — fixed normalized phone number, account-level name/contact preferences, and audit fields.
2. **Seller-to-listing link** — one seller account to many listings, with Admin-created links in the first version.
3. **Seller access code** — hashed code, expiry, issue/reset time, and basic rate limiting. Never store the code as readable plain text.
4. **Seller draft/submission** — submitted text fields, confirmation acceptance/time, and clear admin-requested corrections. This distinguishes saved seller work from the current public version.
5. **Seller media asset** — seller origin, original and approved/redacted file references, requested action (add/replace/remove), approval state, requested/approved primary image, and audit timestamps.
6. **Public presentation selection** — the buyer query must use only approved seller media and the current approved/public values.

All additions should be nullable/backward-compatible so current normalized listings, buyer matching, ingestion runs, and source records continue to work while seller data is gradually added.

## First-build acceptance checks

The first build is ready for review when a developer can demonstrate that:

1. Admin links two imported cars to the same seller phone number.
2. Seller signs in with the fixed phone number and a valid, unexpired 30-day code.
3. Seller cannot access a car that is not linked to their account.
4. Seller sees pre-filled vehicle details, can save a Draft, and can correct those details.
5. Seller can manage the feature list, Additional Info, public contacts, and price.
6. Seller cannot submit without accepting the confirmation checkbox.
7. Seller uploads photos and selects a preferred main photo.
8. The first seller submission moves the listing to Pics Received; it is not buyer-visible until the admin selects Go Live.
9. Only approved seller photos appear to buyers; no imported TriniCars photo appears in the seller or buyer experience.
10. Admin can approve/reject/request correction for a photo and can apply plate redaction before approval.
11. A Live listing keeps its existing approved photo set while a new, replacement, or removal request is pending.
12. Seller detail and price updates on a Live listing become buyer-visible when submitted; photo changes do not.
13. A no-photo removal request shows the retirement warning, but only Admin can hide or retire the listing.
14. Seller sees prominent Action needed notes, Photo approval pending, and Live confirmation/public link at the correct times.
15. Admin can copy a prepared WhatsApp message for access, corrections, and Live confirmation.

## Explicitly out of scope for this first build

- automatic WhatsApp, SMS, or email delivery of access codes or notifications
- seller-created new listings
- a fixed required number or angle set of photos
- buyer display of imported TriniCars photos
- automatic retirement when a car has no approved photo
- changing the existing ingestion process or the established internal workflow statuses
