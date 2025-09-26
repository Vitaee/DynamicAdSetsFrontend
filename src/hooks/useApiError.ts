import { useEffect, useCallback } from 'react';
import { useAuth } from '../stores/auth';
import { toast } from '../stores/ui';
import { ApiError } from '../api/http';

export type ApiErrorType = 'auth' | 'permission' | 'network' | 'validation' | 'server' | 'unknown';

export interface EnhancedApiError {
  type: ApiErrorType;
  message: string;
  title: string;
  actionable: boolean;
  action?: () => void;
  actionLabel?: string;
}

export function categorizeApiError(error: unknown): EnhancedApiError {
  if (error instanceof ApiError) {
    const { status, message } = error;
    
    switch (status) {
      case 401:
        return {
          type: 'auth',
          message: 'Your session has expired. Please log in again.',
          title: 'Authentication Required',
          actionable: true,
          action: () => {
            const { logout } = useAuth.getState();
            logout();
          },
          actionLabel: 'Log In Again'
        };
        
      case 403:
        return {
          type: 'permission',
          message: 'You don\'t have permission to perform this action. Check your account permissions.',
          title: 'Permission Denied',
          actionable: false
        };
        
      case 400:
        return {
          type: 'validation',
          message: message || 'The request data is invalid. Please check your input.',
          title: 'Invalid Data',
          actionable: false
        };
        
      case 404:
        return {
          type: 'network',
          message: 'The requested resource was not found.',
          title: 'Not Found',
          actionable: false
        };
        
      case 429:
        return {
          type: 'network',
          message: 'Too many requests. Please wait a moment and try again.',
          title: 'Rate Limited',
          actionable: true,
          actionLabel: 'Retry Later'
        };
        
      case 500:
      case 502:
      case 503:
        return {
          type: 'server',
          message: 'Server error occurred. Please try again later.',
          title: 'Server Error',
          actionable: true,
          actionLabel: 'Retry'
        };
        
      default:
        return {
          type: 'unknown',
          message: message || 'An unexpected error occurred.',
          title: 'Error',
          actionable: false
        };
    }
  }
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      title: 'Connection Error',
      actionable: true,
      actionLabel: 'Retry'
    };
  }
  
  // Generic error
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
  return {
    type: 'unknown',
    message,
    title: 'Error',
    actionable: false
  };
}

export function useApiErrorHandler() {
  const handleError = useCallback((error: unknown, context?: string) => {
    const enhancedError = categorizeApiError(error);
    
    // Always show toast for errors
    toast.error(enhancedError.message, enhancedError.title);
    
    // Handle specific error types
    if (enhancedError.type === 'auth') {
      // Auto-logout on auth errors
      setTimeout(() => {
        const { logout } = useAuth.getState();
        logout();
        toast.info('Please log in again to continue.', 'Session Expired');
      }, 1000);
    }
    
    // Log error details for debugging
    console.error(`API Error in ${context || 'unknown context'}:`, {
      type: enhancedError.type,
      error,
      enhancedError
    });
    
    return enhancedError;
  }, []); // Empty dependency array makes this stable
  
  return { handleError };
}

// Hook for automatic error boundary
export function useApiErrorBoundary(error: unknown, context: string) {
  const { handleError } = useApiErrorHandler();
  
  useEffect(() => {
    if (error) {
      handleError(error, context);
    }
  }, [error, context, handleError]);
}