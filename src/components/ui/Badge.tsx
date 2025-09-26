import { cn } from "../../lib/cn";

type BadgeVariant = 'success' | 'warning' | 'danger' | 'error' | 'info' | 'neutral' | 'muted';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export default function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className 
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1.5 text-sm'
  };

  return (
    <span 
      className={cn(
        'wt-badge',
        `wt-badge-${variant}`,
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}