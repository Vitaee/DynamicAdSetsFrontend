type EmptyStateVariant = 'default' | 'campaigns' | 'adSets' | 'rules' | 'integrations';

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
};

const VARIANT_CONFIG: Record<EmptyStateVariant, { icon: string; color: string }> = {
  default: { icon: '📋', color: 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300' },
  campaigns: { icon: '📢', color: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' },
  adSets: { icon: '🎯', color: 'bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300' },
  rules: { icon: '⚡', color: 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-300' },
  integrations: { icon: '🔗', color: 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300' }
};

export default function EmptyState({ 
  title, 
  description, 
  action, 
  variant = 'default',
  className = ''
}: Props) {
  const config = VARIANT_CONFIG[variant];
  
  return (
    <div className={`wt-card p-8 text-center ${className}`}>
      <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl ${config.color}`}>
        {config.icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

