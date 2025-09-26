import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: ReactNode };

export default function Checkbox({ className, label, id, ...props }: Props) {
  return (
    <label className="inline-flex items-start gap-3 select-none cursor-pointer">
      <input id={id} type="checkbox" className={cn("wt-checkbox mt-0.5 cursor-pointer", className)} {...props} />
      {label && (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
}
