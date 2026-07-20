export type RegisterValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s-]{10,15}$/;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function validateRegister(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};

  if (isBlank(values.fullName) || values.fullName.trim().length < 2) {
    errors.fullName = "Please enter your full name.";
  }

  if (!emailRegex.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!phoneRegex.test(values.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (values.password.length < 8) {
    errors.password = "Password should be at least 8 characters.";
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (isBlank(values.role)) {
    errors.role = "Please select a role.";
  }

  return errors;
}

export function hasRegisterErrors(errors: RegisterErrors): boolean {
  return Object.keys(errors).length > 0;
}
