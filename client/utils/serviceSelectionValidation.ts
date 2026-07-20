export type ServiceSelection = Record<string, number>;

export type ServiceSelectionResult = {
  valid: boolean;
  totalItems: number;
  error?: string;
};

export function validateServiceSelection(selection: ServiceSelection): ServiceSelectionResult {
  const totalItems = Object.values(selection).reduce((sum, qty) => sum + Math.max(0, qty), 0);

  if (totalItems === 0) {
    return {
      valid: false,
      totalItems,
      error: "Add at least one service item to continue.",
    };
  }

  if (totalItems > 50) {
    return {
      valid: false,
      totalItems,
      error: "Maximum of 50 items allowed per order.",
    };
  }

  return { valid: true, totalItems };
}
