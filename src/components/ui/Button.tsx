import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-4 py-2.5 text-sm gap-2", 
    lg: "px-6 py-3 text-base gap-3"
  };
  
  const variantClasses = {
    primary: "wt-button",
    ghost: "wt-button-ghost",
    outline: "border border-default bg-transparent text-primary hover:bg-surface-hover",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm"
  };
  
  return (
    <button 
      ref={ref} 
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )} 
      {...props} 
    />
  );
});

export default Button;
