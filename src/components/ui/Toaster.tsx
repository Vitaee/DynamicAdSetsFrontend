import { useUI } from '../../stores/ui';
import { cn } from '../../lib/cn';

function ToastItem({ id, type, title, message }: { id: string; type: 'success'|'error'|'info'; title?: string; message: string }) {
  const { dismissToast } = useUI();
  const color = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-indigo-600';
  const icon = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';
  return (
    <div className={cn('pointer-events-auto w-full max-w-sm rounded-xl ring-1 ring-black/5 shadow-lg', 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100')}>
      <div className="flex gap-3 p-4">
        <div className={cn('grid h-6 w-6 place-items-center rounded-full text-white', color)}>{icon}</div>
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          <div className="text-sm text-gray-700 dark:text-gray-300">{message}</div>
        </div>
        <button onClick={() => dismissToast(id)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer">×</button>
      </div>
    </div>
  );
}

export default function Toaster() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-end gap-3 p-4 sm:p-6">
      {/* top-right */}
      <div className="ml-auto flex w-full flex-col items-end gap-3">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </div>
    </div>
  );
}
