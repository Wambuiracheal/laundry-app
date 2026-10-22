export type NewOrderValues = {
  serviceIds: string[];
  pickupAddress: string;
  pickupDate: string;
  timeWindow: string;
  houseDetails: string;
  deliveryInstructions: string;
  notes: string;
};

export type NewOrderErrors = Partial<Record<keyof NewOrderValues, string>>;

export const PICKUP_WINDOWS = [
  { value: "08:00", label: "08:00 AM – 10:00 AM" },
  { value: "10:00", label: "10:00 AM – 12:00 PM" },
  { value: "14:00", label: "02:00 PM – 04:00 PM" },
  { value: "16:00", label: "04:00 PM – 06:00 PM" },
];

/** Combines the chosen date and window start into a local Date. */
export function pickupDateTime(values: Pick<NewOrderValues, "pickupDate" | "timeWindow">) {
  return new Date(`${values.pickupDate}T${values.timeWindow}:00`);
}

export type PickupSlot = Pick<NewOrderValues, "pickupDate" | "timeWindow">;

/** A pickup needs a date and a window that hasn't started yet. Shared by booking and rescheduling. */
export function validatePickupSlot(values: PickupSlot): Partial<Record<keyof PickupSlot, string>> {
  const errors: Partial<Record<keyof PickupSlot, string>> = {};

  if (!values.pickupDate) {
    errors.pickupDate = "Pick a date for pickup.";
  }

  if (!values.timeWindow) {
    errors.timeWindow = "Choose a pickup window.";
  } else if (values.pickupDate && pickupDateTime(values) <= new Date()) {
    errors.timeWindow = "That window has already passed. Choose a later one.";
  }

  return errors;
}

export function validateNewOrder(values: NewOrderValues): NewOrderErrors {
  const errors: NewOrderErrors = { ...validatePickupSlot(values) };

  if (values.serviceIds.length === 0) {
    errors.serviceIds = "Choose at least one service.";
  }

  const address = values.pickupAddress.trim();
  if (!address) {
    errors.pickupAddress = "Tell us where to collect your clothes.";
  } else if (address.length > 191) {
    errors.pickupAddress = "Keep the address under 191 characters.";
  }

  if (values.houseDetails.trim().length > 191) {
    errors.houseDetails = "Keep this under 191 characters.";
  }

  if (values.deliveryInstructions.trim().length > 500) {
    errors.deliveryInstructions = "Directions must be 500 characters or fewer.";
  }

  if (values.notes.length > 1000) {
    errors.notes = "Notes must be 1000 characters or fewer.";
  }

  return errors;
}
