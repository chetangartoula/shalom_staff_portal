import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Core condition checks utility module
 * Contains modular functions for common validation and condition checks
 */

/**
 * Class name utility function for combining and conditionally applying Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validates if a value is a valid number
 */
export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Validates if a value is a valid string
 */
export const isValidString = (value: any): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validates if a value is a valid boolean
 */
export const isValidBoolean = (value: any): boolean => {
  return typeof value === 'boolean';
};

/**
 * Validates if a value is a valid date
 */
export const isValidDate = (value: any): boolean => {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
};

/**
 * Validates if an object has required properties
 */
export const hasRequiredProperties = (obj: any, requiredProps: string[]): boolean => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  return requiredProps.every(prop => obj.hasOwnProperty(prop) && obj[prop] !== undefined);
};

/**
 * Validates if an array is not empty
 */
export const isNonEmptyArray = (arr: any): boolean => {
  return Array.isArray(arr) && arr.length > 0;
};

/**
 * Validates if an array is empty or not an array
 */
export const isEmptyArray = (arr: any): boolean => {
  return !Array.isArray(arr) || arr.length === 0;
};

/**
 * Validates if a value is a valid object (not null, not array)
 */
export const isValidObject = (value: any): boolean => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Validates if a value is null or undefined
 */
export const isNullOrUndefined = (value: any): boolean => {
  return value === null || value === undefined;
};

/**
 * Validates if a value is not null or undefined
 */
export const isNotNullOrUndefined = (value: any): boolean => {
  return value !== null && value !== undefined;
};

/**
 * Validates if a string is a valid email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!isValidString(email)) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!isValidString(url)) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a string has minimum length
 */
export const hasMinLength = (str: string, minLength: number): boolean => {
  return isValidString(str) && str.length >= minLength;
};

/**
 * Validates if a number is within a range
 */
export const isInRange = (num: number, min: number, max: number): boolean => {
  return isValidNumber(num) && num >= min && num <= max;
};

/**
 * Validates if a number is positive
 */
export const isPositive = (num: number): boolean => {
  return isValidNumber(num) && num > 0;
};

/**
 * Validates if a number is non-negative (zero or positive)
 */
export const isNonNegative = (num: number): boolean => {
  return isValidNumber(num) && num >= 0;
};

/**
 * Validates if an object is empty (has no own enumerable properties)
 */
export const isEmptyObject = (obj: any): boolean => {
  if (!isValidObject(obj)) {
    return false;
  }
  return Object.keys(obj).length === 0;
};

/**
 * Validates if an object is not empty (has own enumerable properties)
 */
export const isNotEmptyObject = (obj: any): boolean => {
  return !isEmptyObject(obj);
};

/**
 * Validates if a value matches one of the specified options
 */
export const isOneOf = (value: any, options: any[]): boolean => {
  return options.includes(value);
};

/**
 * Validates if a function is callable
 */
export const isCallable = (fn: any): boolean => {
  return typeof fn === 'function';
};

/**
 * Validates if a string is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  if (!isValidString(uuid)) {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates if a value is a valid rate (positive number)
 */
export const isValidRate = (rate: any): boolean => {
  return isValidNumber(rate) && isNonNegative(rate);
};

/**
 * Validates if a value is a valid percentage (0-100)
 */
export const isValidPercentage = (percentage: any): boolean => {
  return isValidNumber(percentage) && isInRange(percentage, 0, 100);
};

/**
 * Validates if an item has valid cost calculation flags
 */
export const hasValidCostFlags = (item: any): boolean => {
  if (!isValidObject(item)) {
    return false;
  }
  
  // Check if the item has the required boolean flags
  const flags = ['per_person', 'per_day', 'one_time'];
  return flags.every(flag => {
    const value = item[flag];
    return value === undefined || isValidBoolean(value);
  });
};

/**
 * Validates if an item has valid max_capacity value
 */
export const hasValidMaxCapacity = (item: any): boolean => {
  if (!isValidObject(item)) {
    return false;
  }
  
  const maxCapacity = item.max_capacity;
  return maxCapacity === undefined || isValidNumber(maxCapacity) && isNonNegative(maxCapacity);
};

/**
 * Validates if an item is properly configured for cost calculation
 */
export const isValidCostItem = (item: any): boolean => {
  if (!isValidObject(item)) {
    return false;
  }
  
  // Check required fields for cost calculation
  const requiredFields = ['rate'];
  const hasRequired = requiredFields.every(field => item.hasOwnProperty(field) && isValidNumber(item[field]));
  
  // Check if flags are valid
  const flagsValid = hasValidCostFlags(item);
  
  // Check if max_capacity is valid if present
  const maxCapacityValid = hasValidMaxCapacity(item);
  
  return hasRequired && flagsValid && maxCapacityValid;
};

/**
 * Validates if a date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  const now = new Date();
  return new Date(date).getTime() > now.getTime();
};

/**
 * Validates if a date is in the past
 */
export const isPastDate = (date: Date): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  const now = new Date();
  return new Date(date).getTime() < now.getTime();
};

/**
 * Validates if a date is today
 */
export const isToday = (date: Date): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Validates if a string is a valid phone number
 */
export const isValidPhone = (phone: string): boolean => {
  if (!isValidString(phone)) {
    return false;
  }
  // Basic phone number validation (can be extended based on requirements)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validates if a string contains only alphanumeric characters
 */
export const isAlphanumeric = (str: string): boolean => {
  if (!isValidString(str)) {
    return false;
  }
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(str);
};

/**
 * Validates if a string contains only alphabetic characters
 */
export const isAlphabetic = (str: string): boolean => {
  if (!isValidString(str)) {
    return false;
  }
  const alphabeticRegex = /^[a-zA-Z]+$/;
  return alphabeticRegex.test(str);
};

/**
 * Validates if a string contains only numeric characters
 */
export const isNumericString = (str: string): boolean => {
  if (!isValidString(str)) {
    return false;
  }
  const numericRegex = /^[0-9]+$/;
  return numericRegex.test(str);
};

/**
 * Validates if an array contains only unique values
 */
export const hasUniqueValues = (arr: any[]): boolean => {
  if (!isNonEmptyArray(arr)) {
    return true; // Empty array has unique values by definition
  }
  return new Set(arr).size === arr.length;
};

/**
 * Validates if an array contains only values of a specific type
 */
export const hasArrayType = (arr: any[], type: string): boolean => {
  if (!isNonEmptyArray(arr)) {
    return true;
  }
  return arr.every(item => typeof item === type);
};

/**
 * Validates if a value is within specified bounds (inclusive)
 */
export const isWithinBounds = (value: number, lower: number, upper: number): boolean => {
  if (!isValidNumber(value) || !isValidNumber(lower) || !isValidNumber(upper)) {
    return false;
  }
  return value >= lower && value <= upper;
};

/**
 * Validates if a value is strictly within specified bounds (exclusive)
 */
export const isStrictlyWithinBounds = (value: number, lower: number, upper: number): boolean => {
  if (!isValidNumber(value) || !isValidNumber(lower) || !isValidNumber(upper)) {
    return false;
  }
  return value > lower && value < upper;
};

/**
 * Validates if a value is a valid enum value
 */
export const isValidEnumValue = (value: any, enumValues: any[]): boolean => {
  return enumValues.includes(value);
};

/**
 * Validates if an object matches a specific shape (has required keys with correct types)
 */
export const hasObjectShape = (obj: any, shape: Record<string, (value: any) => boolean>): boolean => {
  if (!isValidObject(obj)) {
    return false;
  }
  
  return Object.entries(shape).every(([key, validator]) => {
    return obj.hasOwnProperty(key) && validator(obj[key]);
  });
};

/**
 * Validates if a string matches a specific pattern
 */
export const matchesPattern = (str: string, pattern: RegExp): boolean => {
  if (!isValidString(str)) {
    return false;
  }
  return pattern.test(str);
};

/**
 * Validates if a value is a valid ID (non-empty string or positive number)
 */
export const isValidId = (id: any): boolean => {
  if (typeof id === 'string') {
    return isValidString(id);
  }
  if (typeof id === 'number') {
    return isValidNumber(id) && isPositive(id);
  }
  return false;
};

/**
 * Validates if a string is a valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  if (!isValidString(color)) {
    return false;
  }
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
};

/**
 * Validates if a string is a valid RGB color
 */
export const isValidRgbColor = (color: string): boolean => {
  if (!isValidString(color)) {
    return false;
  }
  const rgbColorRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const match = color.match(rgbColorRegex);
  if (!match) {
    return false;
  }
  
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  
  return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
};

/**
 * Validates if a string is a valid color (hex or rgb)
 */
export const isValidColor = (color: string): boolean => {
  return isValidHexColor(color) || isValidRgbColor(color);
};

// Export all validation functions as a single object
export const Validation = {
  isValidNumber,
  isValidString,
  isValidBoolean,
  isValidDate,
  hasRequiredProperties,
  isNonEmptyArray,
  isEmptyArray,
  isValidObject,
  isNullOrUndefined,
  isNotNullOrUndefined,
  isValidEmail,
  isValidUrl,
  hasMinLength,
  isInRange,
  isPositive,
  isNonNegative,
  isEmptyObject,
  isNotEmptyObject,
  isOneOf,
  isCallable,
  isValidUUID,
  isValidRate,
  isValidPercentage,
  hasValidCostFlags,
  hasValidMaxCapacity,
  isValidCostItem,
  isFutureDate,
  isPastDate,
  isToday,
  isValidPhone,
  isAlphanumeric,
  isAlphabetic,
  isNumericString,
  hasUniqueValues,
  hasArrayType,
  isWithinBounds,
  isStrictlyWithinBounds,
  isValidEnumValue,
  hasObjectShape,
  matchesPattern,
  isValidId,
  isValidHexColor,
  isValidRgbColor,
  isValidColor
};

export default Validation;