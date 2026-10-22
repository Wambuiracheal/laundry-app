export type BookingFormValues = {
  location: string;
  service: string;
  pickupDate: string;
};

export type BookingFormErrors = Partial<Record<keyof BookingFormValues, string>>;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function validateBookingForm(values: BookingFormValues): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (isBlank(values.location)) {
    errors.location = "Pickup location is required.";
  }

  if (isBlank(values.service)) {
    errors.service = "Select a service.";
  }

  if (isBlank(values.pickupDate)) {
    errors.pickupDate = "Pick a date for pickup.";
  } else {
    // Parse "YYYY-MM-DD" as a local date; new Date(string) would treat it as UTC midnight.
    const [year, month, day] = values.pickupDate.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
      errors.pickupDate = "Pickup date must be today or later.";
    }
  }

  return errors;
}

export function hasBookingErrors(errors: BookingFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
