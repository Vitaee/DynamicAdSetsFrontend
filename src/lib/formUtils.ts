/**
 * Reusable form validation utilities
 */

export type ValidationRule<T> = {
  test: (value: T) => boolean;
  message: string;
};

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * Validates a single field against its rules
 */
export function validateField<T>(
  value: T,
  rules: ValidationRule<T>[] = []
): string | undefined {
  for (const rule of rules) {
    if (!rule.test(value)) {
      return rule.message;
    }
  }
  return undefined;
}

/**
 * Validates an entire form object against a schema
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  schema: ValidationSchema<T>
): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {};

  for (const [field, rules] of Object.entries(schema) as [keyof T, ValidationRule<T[keyof T]>[] | undefined][]) {
    if (rules) {
      const error = validateField(values[field], rules);
      if (error) {
        errors[field] = error;
      }
    }
  }

  return errors;
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    test: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    test: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    test: (value) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    test: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  number: (message = 'Must be a valid number'): ValidationRule<string | number> => ({
    test: (value) => !isNaN(Number(value)),
    message,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    test: (value) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    test: (value) => value <= max,
    message: message || `Must be no more than ${max}`,
  }),

  custom: <T>(
    test: (value: T) => boolean,
    message: string
  ): ValidationRule<T> => ({
    test,
    message,
  }),
};
