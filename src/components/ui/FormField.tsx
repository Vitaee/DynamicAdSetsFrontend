import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export default function FormField({ label, htmlFor, hint, error, required, className, children }: Props) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label htmlFor={htmlFor} className="wt-label">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-gray-600 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

