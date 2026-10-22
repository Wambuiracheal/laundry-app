/**
 * What a visitor picked in the landing-page booking modal, carried through login/signup to the
 * new-order form (which needs an account and a map-pinned address to actually place the order).
 */
export type BookingDraft = { service: string; location: string; pickupDate: string };

const STORAGE_KEY = "pl_booking_draft";

export function saveBookingDraft(draft: BookingDraft) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable (private mode): the visitor just fills the form in again.
  }
}

/** Returns the saved draft once, then forgets it. */
export function takeBookingDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<BookingDraft>;
    return {
      service: typeof draft.service === "string" ? draft.service : "",
      location: typeof draft.location === "string" ? draft.location : "",
      pickupDate: typeof draft.pickupDate === "string" ? draft.pickupDate : "",
    };
  } catch {
    return null;
  }
}
