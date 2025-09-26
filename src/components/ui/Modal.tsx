import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  footerJustify?: 'end' | 'between';
};

export default function Modal({ open, onClose, title, children, footer, className, footerJustify = 'end' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700', className)}>
        {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
        <div className="mt-3 text-gray-700 dark:text-gray-300 text-sm">{children}</div>
        {footer && <div className={"mt-5 flex items-center gap-3 " + (footerJustify === 'between' ? 'justify-between' : 'justify-end')}>{footer}</div>}
      </div>
    </div>
  );
}
