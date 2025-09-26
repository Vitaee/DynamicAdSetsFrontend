import Button from './Button';
import type { EnhancedApiError, ApiErrorType } from '../../hooks/useApiError';

interface ErrorStateProps {
  error: EnhancedApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ERROR_EMOJIS: Record<ApiErrorType, string> = {
  auth: '🔐',
  permission: '🚫',
  network: '📡',
  validation: '⚠️',
  server: '🔧',
  unknown: '❌'
};

const ERROR_COLORS: Record<ApiErrorType, string> = {
  auth: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  permission: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  network: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  validation: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  server: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  unknown: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
};

export default function ErrorState({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '' 
}: ErrorStateProps) {
  const emoji = ERROR_EMOJIS[error.type];
  const colorClasses = ERROR_COLORS[error.type];
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className={`mb-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl ${colorClasses}`}>
        {emoji}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {error.title}
      </h3>
      
      <p className="text-gray-700 dark:text-gray-400 mb-6 max-w-md">
        {error.message}
      </p>
      
      <div className="flex gap-3">
        {error.actionable && onRetry && (
          <Button
            onClick={error.action || onRetry}
            className="flex items-center gap-2"
          >
            <span className="text-sm">🔄</span>
            {error.actionLabel || 'Retry'}
          </Button>
        )}
        
        {onDismiss && (
          <Button variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}