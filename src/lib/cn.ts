/**
 * Utility function for conditionally joining classNames
 * Supports strings, objects, arrays, and falsy values
 */
export function cn(...inputs: Array<string | number | boolean | object | null | undefined>): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nestedClasses = cn(...input);
      if (nestedClasses) {
        classes.push(nestedClasses);
      }
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

