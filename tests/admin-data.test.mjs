import assert from "node:assert/strict";
import test from "node:test";
import {
  adminOrderSchema,
  adminTopupSchema,
  errorMessage,
  orderNumber,
  parseAdminRows,
  recentOrderSchema,
  recentTopupSchema,
} from "../src/lib/admin-data.ts";

const topup = {
  id: "synthetic-topup",
  user_id: "synthetic-user",
  amount: 10,
  credits: 20,
  method: "test",
  reference: null,
  proof_url: null,
  status: "pending",
  admin_note: null,
  created_at: "2026-01-01T00:00:00Z",
  profiles: null,
};
const order = {
  id: "synthetic-order",
  order_number: "TEST-001",
  status: "pending",
  credits_charged: 20,
  created_at: "2026-01-01T00:00:00Z",
  imei: null,
  services: null,
  profiles: null,
};

test("nullable or absent joins remain valid instead of requiring a cast", () => {
  assert.ok(parseAdminRows(adminTopupSchema, [topup]).success);
  assert.ok(parseAdminRows(adminOrderSchema, [order]).success);
  assert.ok(parseAdminRows(recentTopupSchema, [{ ...topup, profiles: undefined }]).success);
  assert.ok(parseAdminRows(recentOrderSchema, [{ ...order, services: undefined }]).success);
});

test("incorrect numeric values fail before presentation", () => {
  for (const amount of ["10", null, {}, NaN, Infinity]) {
    assert.equal(parseAdminRows(adminTopupSchema, [{ ...topup, amount }]).success, false);
  }
});

test("unexpected join shapes fail instead of being asserted as profile data", () => {
  assert.equal(
    parseAdminRows(adminTopupSchema, [{ ...topup, profiles: [{ display_name: "Fixture" }] }])
      .success,
    false,
  );
  assert.equal(
    parseAdminRows(adminOrderSchema, [{ ...order, services: { name: 42 } }]).success,
    false,
  );
});

test("valid display fields survive and unrequested fields are discarded", () => {
  const result = parseAdminRows(adminTopupSchema, [
    { ...topup, profiles: { display_name: "Fixture", phone: null }, unrelated: "not UI data" },
  ]);
  assert.ok(result.success);
  assert.equal(result.data[0].profiles.display_name, "Fixture");
  assert.equal("unrelated" in result.data[0], false);
});

test("missing collection data initializes as an empty list", () => {
  assert.deepEqual(parseAdminRows(adminOrderSchema, null), { success: true, data: [] });
});

test("native and plain API errors retain their message with a safe fallback", () => {
  assert.equal(errorMessage(new Error("Test native error"), "fallback"), "Test native error");
  assert.equal(errorMessage({ message: "Test API error" }, "fallback"), "Test API error");
  for (const value of [null, "unexpected", { message: {} }, { message: "" }]) {
    assert.equal(errorMessage(value, "fallback"), "fallback");
  }
});

test("order confirmation accepts only a string order number on an object", () => {
  assert.equal(orderNumber({ order_number: "TEST-001" }), "TEST-001");
  for (const value of [null, "TEST-001", [], {}, { order_number: 123 }]) {
    assert.equal(orderNumber(value), "");
  }
});
