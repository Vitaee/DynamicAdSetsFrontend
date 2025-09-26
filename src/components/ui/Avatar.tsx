import { cn } from '../../lib/cn';

type Props = { src?: string; name?: string; className?: string };

export default function Avatar({ src, name, className }: Props) {
  const fallback = name?.trim()?.[0]?.toUpperCase() || 'U';
  return (
    <div className={cn('relative inline-flex h-9 w-9 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 ring-1 ring-gray-200 dark:ring-gray-700', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || 'avatar'} className="h-full w-full object-cover" />
      ) : (
        <span className="m-auto text-sm font-semibold">{fallback}</span>
      )}
    </div>
  );
}

