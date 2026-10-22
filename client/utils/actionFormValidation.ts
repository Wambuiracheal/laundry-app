export type SupportFormValues = {
  fullName: string;
  email: string;
  orderId: string;
  message: string;
};

export type ForgotPasswordValues = {
  email: string;
};

export type CancellationValues = {
  reason: string;
  details: string;
  acknowledge: boolean;
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Order references are the first 6 hex characters of the order id, e.g. PL-3F2A9C.
const orderIdRegex = /^#?PL-[0-9A-F]{3,6}$/i;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function validateSupportForm(values: SupportFormValues): FormErrors<SupportFormValues> {
  const errors: FormErrors<SupportFormValues> = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name.";
  }

  if (!emailRegex.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!isBlank(values.orderId) && !orderIdRegex.test(values.orderId.trim())) {
    errors.orderId = "Use format PL-1234.";
  }

  if (values.message.trim().length < 12) {
    errors.message = "Message should be at least 12 characters.";
  }

  return errors;
}

export function validateForgotPassword(values: ForgotPasswordValues): FormErrors<ForgotPasswordValues> {
  const errors: FormErrors<ForgotPasswordValues> = {};

  if (!emailRegex.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

export function validateCancellationForm(values: CancellationValues): FormErrors<CancellationValues> {
  const errors: FormErrors<CancellationValues> = {};

  if (isBlank(values.reason)) {
    errors.reason = "Select a reason.";
  }

  if (values.details.trim().length > 1000) {
    errors.details = "Keep this under 1000 characters.";
  }

  if (!values.acknowledge) {
    errors.acknowledge = "You must confirm this action.";
  }

  return errors;
}

export function hasErrors<T>(errors: FormErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
