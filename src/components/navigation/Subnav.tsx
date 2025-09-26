import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

type Item = { key: string; label: string; to: string };

export default function Subnav({ items, cta }: { items: Item[]; cta?: React.ReactNode }) {
  //const { pathname } = useLocation();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {items.map((it) => {
          //const active = pathname === it.to;
          return (
            <Link
              key={it.key}
              to={it.to}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-white border border-blue-200 dark:border-gray-600'
              )}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
      {cta}
    </div>
  );
}

