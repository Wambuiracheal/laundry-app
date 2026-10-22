import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasErrors,
  validateCancellationForm,
  validateForgotPassword,
  validateSupportForm,
} from "@/utils/actionFormValidation";
import { hasBookingErrors, validateBookingForm } from "@/utils/bookingValidation";
import { hasLoginErrors, validateLogin } from "@/utils/loginValidation";
import { pickupDateTime, validateNewOrder, validatePickupSlot, type NewOrderValues } from "@/utils/newOrderValidation";
import { hasRegisterErrors, validateRegister } from "@/utils/registerValidation";

// Fixed "now": Wednesday 2026-10-21, 12:00 local time.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 21, 12, 0, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("validateLogin", () => {
  it("accepts a valid email and password", () => {
    const errors = validateLogin({ email: " jane@example.com ", password: "secret1" });
    expect(errors).toEqual({});
    expect(hasLoginErrors(errors)).toBe(false);
  });

  it("requires both fields", () => {
    expect(validateLogin({ email: "  ", password: "" })).toEqual({
      email: "Email is required.",
      password: "Password is required.",
    });
  });

  it("rejects a malformed email and a short password", () => {
    const errors = validateLogin({ email: "jane@", password: "12345" });
    expect(errors.email).toBe("Enter a valid email address.");
    expect(errors.password).toBe("Password must be at least 6 characters.");
    expect(hasLoginErrors(errors)).toBe(true);
  });
});

describe("validateRegister", () => {
  const valid = {
    fullName: "Jane Wanjiru",
    email: "jane@example.com",
    phone: "+254712345678",
    password: "Longenough1!",
    confirmPassword: "Longenough1!",
  };

  it("accepts valid values", () => {
    expect(hasRegisterErrors(validateRegister(valid))).toBe(false);
  });

  it("flags each invalid field", () => {
    expect(
      validateRegister({ fullName: "Jane", email: "nope", phone: "123", password: "short", confirmPassword: "other" }),
    ).toEqual({
      fullName: "Please enter your first and last name.",
      email: "Please enter a valid email address.",
      phone: "Please enter a valid phone number.",
      password: "Use at least 8 characters with upper and lower case letters, a number and a symbol.",
      confirmPassword: "Passwords do not match.",
    });
  });

  it("requires the confirmation to match", () => {
    expect(validateRegister({ ...valid, password: "longenough", confirmPassword: "longenough" }).password).toBeDefined();
    expect(validateRegister({ ...valid, confirmPassword: "Longenough1?" })).toEqual({
      confirmPassword: "Passwords do not match.",
    });
  });
});

describe("validateBookingForm", () => {
  const valid = { location: "Kilimani", service: "Wash & Fold", pickupDate: "2026-10-21" };

  it("accepts today as a pickup date (parsed as local, not UTC)", () => {
    expect(hasBookingErrors(validateBookingForm(valid))).toBe(false);
  });

  it("rejects a past pickup date", () => {
    expect(validateBookingForm({ ...valid, pickupDate: "2026-10-20" }).pickupDate).toBe(
      "Pickup date must be today or later.",
    );
  });

  it("reports required fields", () => {
    const errors = validateBookingForm({ location: " ", service: "", pickupDate: "" });
    expect(Object.keys(errors).sort()).toEqual(["location", "pickupDate", "service"]);
  });
});

describe("validateNewOrder", () => {
  const valid: NewOrderValues = {
    serviceIds: ["svc-1"],
    pickupAddress: "Kilimani, Nairobi",
    pickupDate: "2026-10-21",
    timeWindow: "14:00",
    houseDetails: "",
    deliveryInstructions: "",
    notes: "",
  };

  it("accepts a future window today", () => {
    expect(validateNewOrder(valid)).toEqual({});
  });

  it("rejects a window that has already started", () => {
    expect(validateNewOrder({ ...valid, timeWindow: "10:00" }).timeWindow).toBe(
      "That window has already passed. Choose a later one.",
    );
  });

  it("requires a service, address, date and window", () => {
    const errors = validateNewOrder({ ...valid, serviceIds: [], pickupAddress: " ", pickupDate: "", timeWindow: "" });
    expect(Object.keys(errors).sort()).toEqual(["pickupAddress", "pickupDate", "serviceIds", "timeWindow"]);
  });

  it("enforces length limits", () => {
    const errors = validateNewOrder({
      ...valid,
      pickupAddress: "a".repeat(192),
      houseDetails: "b".repeat(192),
      deliveryInstructions: "c".repeat(501),
      notes: "d".repeat(1001),
    });
    expect(Object.keys(errors).sort()).toEqual(["deliveryInstructions", "houseDetails", "notes", "pickupAddress"]);
  });

  it("validates a reschedule slot on its own", () => {
    expect(validatePickupSlot({ pickupDate: "2026-10-22", timeWindow: "08:00" })).toEqual({});
    expect(validatePickupSlot({ pickupDate: "2026-10-21", timeWindow: "08:00" }).timeWindow).toMatch(/already passed/);
    expect(Object.keys(validatePickupSlot({ pickupDate: "", timeWindow: "" })).sort()).toEqual(["pickupDate", "timeWindow"]);
  });

  it("combines date and window into a local time", () => {
    expect(pickupDateTime({ pickupDate: "2026-10-22", timeWindow: "08:00" })).toEqual(new Date(2026, 9, 22, 8, 0));
  });
});

describe("action forms", () => {
  it("validates the support form, with an optional order id", () => {
    const valid = { fullName: "Jane", email: "jane@example.com", orderId: "", message: "My shirt is missing." };
    expect(hasErrors(validateSupportForm(valid))).toBe(false);
    expect(validateSupportForm({ ...valid, orderId: "#PL-1234" })).toEqual({});
    // Real references are hex, e.g. #PL-3F2A9C.
    expect(validateSupportForm({ ...valid, orderId: "PL-3f2a9c" })).toEqual({});
    expect(validateSupportForm({ ...valid, orderId: "1234" }).orderId).toBe("Use format PL-1234.");
    expect(validateSupportForm({ ...valid, message: "help" }).message).toBeDefined();
  });

  it("validates the forgot-password email", () => {
    expect(validateForgotPassword({ email: "jane@example.com" })).toEqual({});
    expect(validateForgotPassword({ email: "jane" }).email).toBe("Enter a valid email address.");
  });

  it("validates the cancellation form", () => {
    expect(validateCancellationForm({ reason: "changed-mind", details: "No longer needed", acknowledge: true })).toEqual({});
    // Details are optional.
    expect(validateCancellationForm({ reason: "Other", details: "", acknowledge: true })).toEqual({});
    expect(Object.keys(validateCancellationForm({ reason: "", details: "x".repeat(1001), acknowledge: false })).sort()).toEqual([
      "acknowledge",
      "details",
      "reason",
    ]);
  });
});
