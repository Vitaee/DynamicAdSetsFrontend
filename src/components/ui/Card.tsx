import { cn } from "../../lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement>;

export default function Card({ className, children, ...rest }: Props) {
  return (
    <div className={cn("wt-card p-6", className)} {...rest}>
      {children}
    </div>
  );
}
