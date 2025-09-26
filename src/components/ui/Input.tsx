import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, label, id, hint, error, ...props },
  ref
) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="wt-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        className={cn(
          "wt-input",
          error &&
            "border-red-300 dark:border-red-700 focus:ring-red-500/70 dark:focus:ring-red-400/60",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-gray-600 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
});

export default Input;
