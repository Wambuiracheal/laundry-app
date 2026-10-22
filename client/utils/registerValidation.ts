export type RegisterValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s-]{10,15}$/;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function validateRegister(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};

  // The account needs a first and last name (the API rejects a single name).
  if (isBlank(values.fullName) || values.fullName.trim().split(/\s+/).length < 2) {
    errors.fullName = "Please enter your first and last name.";
  }

  if (!emailRegex.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!phoneRegex.test(values.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }

  return { ...errors, ...validateNewPassword(values) };
}

export type NewPasswordValues = Pick<RegisterValues, "password" | "confirmPassword">;
export type NewPasswordErrors = Partial<Record<keyof NewPasswordValues, string>>;

/** Password rules for sign-up and resets (also set as the password policy in Supabase, see DEPLOY.md). */
export function validateNewPassword(values: NewPasswordValues): NewPasswordErrors {
  const errors: NewPasswordErrors = {};

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(values.password)) {
    errors.password = "Use at least 8 characters with upper and lower case letters, a number and a symbol.";
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function hasRegisterErrors(errors: RegisterErrors): boolean {
  return Object.keys(errors).length > 0;
}
