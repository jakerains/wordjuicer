import { useNotificationStore } from '../store/notificationStore';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  shouldRetry: (error: Error) => boolean;
}

export interface RetryState {
  attempt: number;
  nextDelay: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  shouldRetry: (error: Error) => {
    const message = error.message.toLowerCase();
    return message.includes('timeout') ||
           message.includes('rate limit') ||
           message.includes('too many requests') ||
           message.includes('model loading') ||
           message.includes('busy');
  }
};

/**
 * Calculate delay for next retry attempt using exponential backoff
 * with jitter to prevent thundering herd problem
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = Math.min(
    maxDelay,
    baseDelay * Math.pow(2, attempt - 1)
  );
  // Add random jitter of ±25%
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(baseDelay, exponentialDelay + jitter);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const addNotification = useNotificationStore.getState().addNotification;
  let attempt = 1;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      const err = error as Error;
      
      if (attempt >= finalConfig.maxRetries || !finalConfig.shouldRetry(err)) {
        throw err;
      }

      const delay = calculateDelay(attempt, finalConfig.baseDelay, finalConfig.maxDelay);
      
      // Notify user about retry
      addNotification({
        type: 'info',
        message: `Retrying operation (${attempt}/${finalConfig.maxRetries}) in ${Math.round(delay / 1000)}s...`
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
}

/**
 * Create a retry wrapper for a function
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withRetry(() => fn(...args), config);
  }) as T;
}

/**
 * Service-specific retry configurations
 */
export const SERVICE_RETRY_CONFIGS: Record<string, Partial<RetryConfig>> = {
  openai: {
    maxRetries: 3,
    baseDelay: 1000,
    shouldRetry: (error: Error) => {
      const message = error.message.toLowerCase();
      return message.includes('rate limit') || 
             message.includes('timeout') ||
             message.includes('server error');
    }
  },
  groq: {
    maxRetries: 4,
    baseDelay: 2000,
    shouldRetry: (error: Error) => {
      const message = error.message.toLowerCase();
      return message.includes('capacity') || 
             message.includes('timeout') ||
             message.includes('server error');
    }
  },
  huggingface: {
    maxRetries: 5,
    baseDelay: 3000,
    shouldRetry: (error: Error) => {
      const message = error.message.toLowerCase();
      return message.includes('model loading') || 
             message.includes('busy') ||
             message.includes('timeout');
    }
  }
}; 