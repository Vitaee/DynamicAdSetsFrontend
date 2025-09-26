import { cn } from '../../lib/cn';
import Card from './Card';

type Props = {
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
  children: React.ReactNode;
};

export default function ChoiceCard({ selected, disabled, onSelect, className, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn('text-left w-full', disabled && 'opacity-50 cursor-not-allowed')}
    >
      <Card
        className={cn(
          'transition ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-indigo-300/70 dark:hover:ring-indigo-400/50',
          selected && 'ring-2 ring-indigo-500/70 dark:ring-indigo-400/60',
          className
        )}
      >
        {children}
      </Card>
    </button>
  );
}

