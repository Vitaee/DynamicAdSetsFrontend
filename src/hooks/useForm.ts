import { useState, useCallback, useMemo } from 'react';
import { validateForm, type ValidationSchema, type ValidationErrors } from '../lib/formUtils';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormResult<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setErrors: (errors: ValidationErrors<T>) => void;
  handleChange: (field: keyof T) => (e: { target: { value: unknown } } | unknown) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: { preventDefault?: () => void }) => Promise<void>;
  reset: () => void;
  validateField: (field: keyof T) => void;
  validateAll: () => boolean;
}

/**
 * Custom hook for managing form state, validation, and submission
 */
export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormResult<T> {
  const {
    initialValues,
    validationSchema = {},
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));

    if (validateOnChange) {
      validateFieldInternal(field, value);
    }
  }, [validateOnChange]);

  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T, touchedValue = true) => {
    setTouched(prev => ({ ...prev, [field]: touchedValue }));
  }, []);

  const validateFieldInternal = useCallback((field: keyof T, value?: T[keyof T]) => {
    if (!validationSchema || typeof validationSchema !== 'object') return;
    
    const rules = (validationSchema as Record<keyof T, unknown>)[field];
    if (!rules || !Array.isArray(rules)) return;

    const fieldValue = value !== undefined ? value : values[field];
    const fieldErrors = validateForm({ [field]: fieldValue } as T, { [field]: rules } as ValidationSchema<T>);
    
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field],
    }));
  }, [validationSchema, values]);

  const validateField = useCallback((field: keyof T) => {
    validateFieldInternal(field);
  }, [validateFieldInternal]);

  const validateAll = useCallback((): boolean => {
    const allErrors = validateForm(values, validationSchema);
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  }, [values, validationSchema]);

  const handleChange = useCallback((field: keyof T) => {
    return (eventOrValue: { target: { value: unknown } } | unknown) => {
      const value = (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue)
        ? (eventOrValue.target as { value: unknown }).value as T[keyof T]
        : eventOrValue as T[keyof T];

      setValue(field, value);
    };
  }, [setValue]);

  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setFieldTouched(field, true);
      if (validateOnBlur) {
        validateField(field);
      }
    };
  }, [setFieldTouched, validateOnBlur, validateField]);

  const handleSubmit = useCallback(async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();

    if (!validateAll()) {
      // Mark all fields as touched to show validation errors
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>);
      setTouched(allTouched);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setValues: setFormValues,
    setFieldTouched,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validateField,
    validateAll,
  };
}
