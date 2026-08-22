import { readFile } from "node:fs/promises";

import type { ListingSourceAdapter, SourceListing } from "./sourceAdapter.ts";

type JsonSourceFile = {
  source: ListingSourceAdapter["source"];
  listings: SourceListing[];
};

export function createJsonSourceAdapter(filePath: string): ListingSourceAdapter {
  return {
    source: {
      name: "pending_json_source",
      type: "marketplace",
    },
    async fetchListings() {
      const contents = await readFile(filePath, "utf8");
      const parsed = JSON.parse(contents) as JsonSourceFile;

      if (!parsed.source?.name?.trim() || !parsed.source.type) {
        throw new Error("JSON source metadata must include a name and type.");
      }

      if (!Array.isArray(parsed.listings)) {
        throw new Error("JSON source file must include a listings array.");
      }

      this.source = parsed.source;
      return parsed.listings;
    },
  };
}
