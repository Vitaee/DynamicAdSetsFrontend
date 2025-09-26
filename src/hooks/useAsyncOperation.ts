import { useState, useCallback } from 'react';
import { useApiErrorHandler } from './useApiError';

interface AsyncOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface AsyncOperationResult<T, TArgs extends unknown[]> extends AsyncOperationState<T> {
  execute: (...args: TArgs) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Custom hook for managing async operations with loading, error, and success states
 */
export function useAsyncOperation<T, TArgs extends unknown[] = []>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
    initialData?: T;
  } = {}
): AsyncOperationResult<T, TArgs> {
  const { onSuccess, onError, initialData = null } = options;
  const { handleError } = useApiErrorHandler();

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: TArgs): Promise<T | undefined> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, isLoading: false, error: null });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        
        // Use the centralized error handler
        handleError(error, 'useAsyncOperation');
        onError?.(error);
        return undefined;
      }
    },
    [asyncFunction, onSuccess, onError, handleError]
  );

  const reset = useCallback(() => {
    setState({ data: initialData, isLoading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}
