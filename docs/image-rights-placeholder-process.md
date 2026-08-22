# Image Rights and AI Placeholder Process

## Purpose

Rev Matched must not display a source photograph merely because it is publicly visible online. The image gate is separate from listing-text ingestion.

This process is an operational safeguard, not a substitute for legal advice.

## Default Rule

Every ingested source image starts with `preview_allowed = false`.

It may become `true` only after Rev Matched records a valid permission basis, such as:

- the seller uploaded their own photograph and accepted the image licence wording
- a dealer agreement expressly permits Rev Matched to store and display the photograph
- Rev Matched owns or commissioned the photograph
- the photograph has a verified licence that permits the intended commercial use

Attribution alone does not create permission.

## Display Decision

```text
Source image exists
and preview permission is confirmed
→ display the authorized source image

Otherwise
→ display the Rev Matched AI placeholder
→ show “AI-generated placeholder — not the actual vehicle”
```

The AI placeholder must never be used to suggest the actual vehicle's colour, condition, trim, damage, accessories, or exact appearance.

## Review Checklist

Before setting `preview_allowed = true`, confirm:

1. Who owns the photograph?
2. What written permission or licence allows Rev Matched to use it?
3. Is commercial display permitted?
4. Is resizing or cropping permitted?
5. Is attribution required, and what exact wording is required?
6. Does permission expire or end when the listing is removed?
7. Are people, registration plates, addresses, or other sensitive details visible?

If any answer is uncertain, leave the image blocked and use the AI placeholder.

## Placeholder Asset

- File: `public/ai-car-placeholder.png`
- Purpose: neutral card thumbnail when an actual vehicle photograph is missing or not cleared
- Required disclosure: `AI-generated placeholder — not the actual vehicle`
- Restrictions: do not add a manufacturer badge, dealer mark, registration plate, or wording implying it is the listed vehicle

## Removal and Disputes

Rev Matched should provide a clear way for a rights holder to report an image. A disputed image should be hidden immediately, returned to `preview_allowed = false`, and replaced with the AI placeholder while the issue is reviewed.
