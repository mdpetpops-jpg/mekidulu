import { z } from "zod";

/**
 * Deliberately permissive-but-strict email pattern: enough to reject typos and
 * bots without rejecting legitimate business domains that use plus-addressing
 * or long TLDs.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const leadSchema = z.object({
  businessEmail: z
    .string({ error: "Business email is required." })
    .trim()
    .min(1, "Business email is required.")
    .max(254, "That email address is too long.")
    .regex(EMAIL_PATTERN, "Enter a valid business email address.")
    .transform((value) => value.toLowerCase()),

  companyName: z
    .string()
    .trim()
    .max(160, "Keep the company name under 160 characters.")
    .optional()
    .default(""),

  estimatedVolume: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .enum(["10-50", "50-200", "200+"], {
        error: "Choose one of the listed volume bands.",
      })
      .optional(),
  ),

  notes: z
    .string()
    .trim()
    .max(2000, "Keep your note under 2,000 characters.")
    .optional()
    .default(""),

  /** Honeypot: a real user never sees or fills this field. */
  companyUrl: z.string().max(200).optional().default(""),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** First message per field, keyed by the form control name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const [key] = issue.path;
    if (typeof key === "string" && !(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
