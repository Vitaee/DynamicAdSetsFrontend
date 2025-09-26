import Spinner from './Spinner';

type LoadingStateVariant = 'default' | 'campaigns' | 'adSets' | 'inline';

interface LoadingStateProps {
  message?: string;
  variant?: LoadingStateVariant;
  className?: string;
}

const VARIANT_CONFIG: Record<LoadingStateVariant, { message: string; size: number; padding: string }> = {
  default: { message: 'Loading...', size: 24, padding: 'p-8' },
  campaigns: { message: 'Loading campaigns...', size: 24, padding: 'p-8' },
  adSets: { message: 'Loading ad sets...', size: 20, padding: 'p-4' },
  inline: { message: 'Loading...', size: 16, padding: 'p-2' }
};

export default function LoadingState({ 
  message, 
  variant = 'default', 
  className = '' 
}: LoadingStateProps) {
  const config = VARIANT_CONFIG[variant];
  const displayMessage = message || config.message;
  
  return (
    <div className={`flex flex-col items-center justify-center text-center ${config.padding} ${className}`}>
      <div className="mb-3">
        <Spinner size={config.size} />
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-400 animate-pulse">
        {displayMessage}
      </p>
    </div>
  );
}