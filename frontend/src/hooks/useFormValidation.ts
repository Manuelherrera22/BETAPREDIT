/**
 * Form Validation Hook
 * Provides validation utilities for forms
 */

import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  min?: number;
  max?: number;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: ValidationRules
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const rule = rules[name];
      if (!rule) return null;

      // Required
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return 'Este campo es requerido';
      }

      if (!value && !rule.required) return null;

      // Email
      if (rule.email && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Email inválido';
        }
      }

      // Min length
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        return `Mínimo ${rule.minLength} caracteres`;
      }

      // Max length
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        return `Máximo ${rule.maxLength} caracteres`;
      }

      // Pattern
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        return 'Formato inválido';
      }

      // Min
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        return `Valor mínimo: ${rule.min}`;
      }

      // Max
      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        return `Valor máximo: ${rule.max}`;
      }

      // Custom
      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [rules]
  );

  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach((key) => {
      const error = validateField(key, values[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, rules, validateField]);

  const handleChange = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate on change if field has been touched
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [name]: error };
          } else {
            const { [name]: _, ...rest } = prev;
            return rest;
          }
        });
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        } else {
          const { [name]: _, ...rest } = prev;
          return rest;
        }
      });
    },
    [values, validateField]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues,
    isValid: Object.keys(errors).length === 0,
  };
}





