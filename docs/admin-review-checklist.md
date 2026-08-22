# Admin Review Checklist

## Purpose

This is the simple, human checklist for what an admin should do after listings are ingested.

It is meant to be easy to follow during MVP testing.

## One-Line Summary

After ingestion, the admin should compare the Rev Matched record to the original source listing and decide:

- approve
- limit
- hide
- or keep in review

## Simple Admin Review Steps

### Step 1 — Open the imported listing

Go to:

`/admin/listings`

Pick one ingested listing.

### Step 2 — Open the source

Click:

- `Open source`

This should open the original listing in a new tab or window.

### Step 3 — Compare the core fields

Check whether these match the original source closely enough:

- image
- title
- price
- year
- brand
- model
- contact name
- contact phone or contact text

Do not worry yet about tiny formatting differences.

The main question is:

“Did Rev Matched understand the listing correctly?”

### Step 4 — Check the confidence note

Click the confidence percentage.

Read the system doubt note if one appears.

Ask:

- does this warning make sense?
- is the listing missing something important?
- does the listing still need human caution?

### Step 5 — Look for obvious problems

Watch for:

- wrong image
- wrong price
- missing year
- missing or unclear model
- missing seller name
- missing contact info
- obvious duplicate
- stale or questionable listing
- confusing attribution

### Step 6 — Make the review decision

Use this simple rule:

#### Approve

Approve when:

- the listing mostly matches the source
- the important fields are trustworthy
- and there is no serious risk or confusion

#### Limited

Keep it limited when:

- the listing is usable
- but some important details are still weak or incomplete

This means the listing can exist in the system, but should not be treated as a strong recommendation.

#### Hide

Hide when:

- the listing is too incomplete
- too risky
- too stale
- too confusing
- or too unreliable for buyer-facing use

#### Keep in review

Keep it in review when:

- a human still needs to decide
- there is conflicting information
- or the system warning is significant

## Fast Review Rule

If you are unsure, ask:

“Would I trust this enough to let a buyer rely on it?”

- If yes: approve
- If partly: limit
- If no: hide or keep in review

## MVP Mindset

The goal is not perfect data.

The goal is:

- trustworthy enough data
- clear admin visibility
- and safe decisions before buyer-facing exposure

## What Success Looks Like

The admin review process is working when:

- imported listings can be checked against the source quickly
- obvious mistakes are easy to spot
- weak listings do not silently go live
- and stronger listings can move forward with confidence
