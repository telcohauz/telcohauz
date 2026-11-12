import { z } from "zod";

const profile = z.object({ display_name: z.string().nullable() });

export const recentTopupSchema = z.object({
  id: z.string(),
  amount: z.number().finite(),
  credits: z.number().finite(),
  method: z.string(),
  profiles: profile.nullable().optional(),
});

export const recentOrderSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  status: z.string(),
  credits_charged: z.number().finite(),
  services: z.object({ name: z.string() }).nullable().optional(),
});

export const adminOrderSchema = recentOrderSchema.extend({
  created_at: z.string(),
  imei: z.string().nullable(),
  profiles: profile.nullable().optional(),
  services: z.object({ name: z.string(), brand: z.string().nullable() }).nullable().optional(),
});

export const adminTopupSchema = recentTopupSchema.extend({
  user_id: z.string(),
  reference: z.string().nullable(),
  proof_url: z.string().nullable(),
  status: z.string(),
  admin_note: z.string().nullable(),
  created_at: z.string(),
  profiles: profile.extend({ phone: z.string().nullable() }).nullable().optional(),
});

// Validate remote JSON instead of casting joins to an unchecked UI shape.
export function parseAdminRows<T>(schema: z.ZodType<T>, value: unknown) {
  return z.array(schema).safeParse(value ?? []);
}

export function errorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message || fallback;
  }
  return fallback;
}

export function orderNumber(value: unknown) {
  return typeof value === "object" &&
    value !== null &&
    "order_number" in value &&
    typeof value.order_number === "string"
    ? value.order_number
    : "";
}
