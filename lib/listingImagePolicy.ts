export const AI_CAR_PLACEHOLDER_PATH = "/ai-car-placeholder.png";
export const AI_CAR_PLACEHOLDER_DISCLOSURE =
  "AI-generated placeholder — not the actual vehicle";

export type ListingImageDecision =
  | {
      kind: "authorized_source_image";
      disclosure: null;
    }
  | {
      kind: "ai_placeholder";
      disclosure: typeof AI_CAR_PLACEHOLDER_DISCLOSURE;
      imagePath: typeof AI_CAR_PLACEHOLDER_PATH;
    };

export function decideListingImage(input: {
  hasSourceImage: boolean;
  sourceImagesAllowedForPreview: boolean;
}): ListingImageDecision {
  if (input.hasSourceImage && input.sourceImagesAllowedForPreview) {
    return {
      kind: "authorized_source_image",
      disclosure: null,
    };
  }

  return {
    kind: "ai_placeholder",
    disclosure: AI_CAR_PLACEHOLDER_DISCLOSURE,
    imagePath: AI_CAR_PLACEHOLDER_PATH,
  };
}
