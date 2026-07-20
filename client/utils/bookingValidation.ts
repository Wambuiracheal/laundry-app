export type BookingFormValues = {
  fullName: string;
  phone: string;
  location: string;
  service: string;
  pickupDate: string;
};

export type BookingFormErrors = Partial<Record<keyof BookingFormValues, string>>;

const phoneRegex = /^\+?[0-9\s-]{10,15}$/;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function validateBookingForm(values: BookingFormValues): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (isBlank(values.fullName)) {
    errors.fullName = "Please enter your name.";
  }

  if (isBlank(values.phone)) {
    errors.phone = "Phone number is required.";
  } else if (!phoneRegex.test(values.phone.trim())) {
    errors.phone = "Use a valid phone number (10-15 digits).";
  }

  if (isBlank(values.location)) {
    errors.location = "Pickup location is required.";
  }

  if (isBlank(values.service)) {
    errors.service = "Select a service.";
  }

  if (isBlank(values.pickupDate)) {
    errors.pickupDate = "Pick a date for pickup.";
  } else {
    const selectedDate = new Date(values.pickupDate);
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
