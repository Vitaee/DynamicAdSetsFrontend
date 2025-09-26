/**
 * Reusable CRUD utilities following DRY principles
 * Provides consistent patterns for all data operations
 */

export interface CRUDOperation<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CRUDOperationWithLoading<T = any> extends CRUDOperation<T> {
  isLoading: boolean;
}

/**
 * Wrapper for async operations with consistent error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext: string
): Promise<CRUDOperation<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${errorContext}`;
    console.error(`${errorContext} failed:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Optimistic update pattern for immediate UI feedback
 */
export function createOptimisticUpdate<T>(
  currentData: T[],
  operation: 'create' | 'update' | 'delete',
  item: T,
  getId: (item: T) => string,
  updates?: Partial<T>
): T[] {
  const itemId = getId(item);
  
  switch (operation) {
    case 'create':
      return [...currentData, item];
    
    case 'update':
      return currentData.map(existing => 
        getId(existing) === itemId 
          ? { ...existing, ...updates } 
          : existing
      );
    
    case 'delete':
      return currentData.filter(existing => getId(existing) !== itemId);
    
    default:
      return currentData;
  }
}

/**
 * Generic state updater for consistent action state management
 */
export function createActionStateUpdater(
  actionStates: Record<string, { isLoading: boolean; error: string | null; lastAction?: string }>,
  id: string,
  update: Partial<{ isLoading: boolean; error: string | null; lastAction: string }>
): Record<string, { isLoading: boolean; error: string | null; lastAction?: string }> {
  return {
    ...actionStates,
    [id]: {
      ...actionStates[id],
      ...update
    }
  };
}

/**
 * Helper for validating required fields before operations
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[],
  operationName: string
): { isValid: boolean; error?: string } {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      return {
        isValid: false,
        error: `${String(field)} is required for ${operationName}`
      };
    }
  }
  return { isValid: true };
}

/**
 * Generic cache invalidation pattern
 */
export function invalidateRelatedCache(
  requestCache: any,
  patterns: (string | RegExp)[]
): void {
  patterns.forEach(pattern => {
    if (typeof pattern === 'string') {
      requestCache.invalidate(pattern);
    } else {
      requestCache.invalidatePattern(pattern);
    }
  });
}

/**
 * Generate temporary IDs for optimistic updates
 */
export function generateTempId(prefix: string = 'temp'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep merge utility for complex state updates
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
        targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }
  
  return result;
}

/**
 * Debounced operation executor for preventing rapid-fire actions
 */
export function createDebouncedExecutor(delay: number = 300) {
  let timeoutId: number | null = null;
  
  return function<T extends any[]>(fn: (...args: T) => void, ...args: T): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Batch operations helper for multiple updates
 */
export function createBatchOperations<T>(
  operations: Array<() => Promise<T>>
): Promise<CRUDOperation<T[]>> {
  return withErrorHandling(
    async () => {
      const results = await Promise.all(operations.map(op => op()));
      return results;
    },
    'batch operations'
  );
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Type-safe event emitter for cross-component communication
 */
export class TypedEventEmitter<T extends Record<string, any>> {
  private listeners: Map<keyof T, Set<(data: any) => void>> = new Map();
  
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }
  
  emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }
  
  off<K extends keyof T>(event: K, listener?: (data: T[K]) => void): void {
    if (listener) {
      this.listeners.get(event)?.delete(listener);
    } else {
      this.listeners.delete(event);
    }
  }
}
