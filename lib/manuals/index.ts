/**
 * Manual catalogue + structured installation guides.
 *
 * The legacy manuals are one-page illustrated sheets (parts list + exploded
 * steps), not prose. This module gives the support bot a machine-readable map
 * of what exists, and — where a guide has been transcribed and reviewed — a
 * structured walkthrough it can narrate in the customer's language.
 *
 * The PDFs in `public/manuals/` stay the authoritative illustrated source: the
 * bot always links them, and never improvises a step that is not in a guide
 * marked `reviewed: true`.
 */

import qj8782 from "@/content/manuals/qj8782.json";

export type ManualFile = {
  /** File stem used in `public/manuals/<id>.pdf`. */
  id: string;
  /** Model name as printed on the sheet. */
  model: string;
  /** Product this manual belongs to, when it maps to a line-card item. */
  productId?: string;
  /** True when the sheet has a text layer worth extracting (most do not). */
  hasTextLayer: boolean;
};

export type ManualPart = { code: string; name: string; qty: string };

export type ManualStep = {
  step: number;
  title: string;
  detail: string;
  parts: string[];
};

export type StructuredGuide = {
  manualId: string;
  model: string;
  displayName: string;
  productId?: string;
  sourcePdf: string;
  /** Only `reviewed: true` guides may be narrated to customers as instructions. */
  reviewed: boolean;
  reviewNote?: string;
  tools: string[];
  parts: ManualPart[];
  steps: ManualStep[];
  safety: string[];
};

/** Every sheet carried over from the legacy `/manuals/` folder. */
export const manualFiles: readonly ManualFile[] = [
  { id: "8782", model: "QJ8782", productId: "meki-8782", hasTextLayer: false },
  { id: "YN105", model: "YN105", productId: "meki-yn105", hasTextLayer: false },
  { id: "1022", model: "KT-1022", hasTextLayer: true },
  { id: "1115", model: "1115", hasTextLayer: true },
  { id: "B12", model: "B12", hasTextLayer: false },
  { id: "M07", model: "M07", hasTextLayer: false },
  { id: "P15", model: "P15", hasTextLayer: true },
  { id: "T01", model: "T01", hasTextLayer: true },
  { id: "T02", model: "T02", hasTextLayer: true },
  { id: "T03", model: "T03", hasTextLayer: true },
  { id: "T04", model: "T04", hasTextLayer: false },
  { id: "Y13", model: "Y13", hasTextLayer: true },
];

export const structuredGuides: Record<string, StructuredGuide> = {
  "8782": qj8782 as StructuredGuide,
};

export function manualPdfPath(id: string): string {
  return `/manuals/${id}.pdf`;
}

export function getManualFile(id: string): ManualFile | undefined {
  return manualFiles.find((manual) => manual.id === id);
}

export function getManualForProduct(productId: string): ManualFile | undefined {
  return manualFiles.find((manual) => manual.productId === productId);
}

/**
 * Guide safe to narrate to a customer. Unreviewed drafts are intentionally
 * withheld; the bot falls back to the illustrated PDF for those models.
 */
export function getReviewedGuide(
  manualId: string,
): StructuredGuide | undefined {
  const guide = structuredGuides[manualId];
  return guide?.reviewed ? guide : undefined;
}

/** One line per manual, injected into the system prompt for grounding. */
export function manualsPromptBlock(): string {
  return manualFiles
    .map((manual) => {
      const guide = structuredGuides[manual.id];
      const state = guide?.reviewed
        ? "structured guide available"
        : guide
          ? "guide transcribed, awaiting factory review"
          : "illustrated PDF only";
      return `- ${manual.model} (PDF: ${manualPdfPath(manual.id)}) — ${state}`;
    })
    .join("\n");
}

/** Products that have no manual at all — the bot must hand these to a human. */
export function productsWithoutManual(productIds: readonly string[]): string[] {
  return productIds.filter((productId) => !getManualForProduct(productId));
}
