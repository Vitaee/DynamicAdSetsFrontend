import { Link } from 'react-router-dom';

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="text-sm text-gray-800 dark:text-gray-400" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {item.href ? (
              <Link to={item.href} className="hover:underline text-gray-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">{item.label}</Link>
            ) : (
              <span className="text-gray-700 dark:text-gray-400 font-medium">{item.label}</span>
            )}
            {idx < items.length - 1 && <span className="text-gray-500 dark:text-gray-400">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

