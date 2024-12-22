import { create } from 'zustand';
import { useApiKeyStore } from '../store/apiKeyStore';
import { useNotificationStore } from '../store/notificationStore';

export type ServiceProvider = 'openai' | 'groq' | 'huggingface';
export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown';

export interface ServiceHealth {
  service: ServiceProvider;
  status: ServiceStatus;
  latency: number;
  lastCheck: Date;
  error?: string;
}

interface HealthStore {
  health: Record<ServiceProvider, ServiceHealth>;
  isChecking: boolean;
  checkHealth: (service?: ServiceProvider) => Promise<void>;
  updateHealth: (service: ServiceProvider, health: Partial<ServiceHealth>) => void;
  getPreferredService: () => ServiceProvider;
}

// Health check endpoints
const HEALTH_CHECK_ENDPOINTS: Record<ServiceProvider, string> = {
  openai: 'https://api.openai.com/v1/models/whisper-1',
  groq: 'https://api.groq.com/openai/v1/models',
  huggingface: 'https://api-inference.huggingface.co/status/openai/whisper-large-v3-turbo'
};

// Initial health state
const initialHealth: Record<ServiceProvider, ServiceHealth> = {
  openai: {
    service: 'openai',
    status: 'unknown',
    latency: 0,
    lastCheck: new Date(0)
  },
  groq: {
    service: 'groq',
    status: 'unknown',
    latency: 0,
    lastCheck: new Date(0)
  },
  huggingface: {
    service: 'huggingface',
    status: 'unknown',
    latency: 0,
    lastCheck: new Date(0)
  }
};

export const useHealthStore = create<HealthStore>((set, get) => ({
  health: initialHealth,
  isChecking: false,

  checkHealth: async (service?: ServiceProvider) => {
    const { apiKey } = useApiKeyStore.getState();
    const addNotification = useNotificationStore.getState().addNotification;
    const servicesToCheck = service ? [service] : Object.keys(HEALTH_CHECK_ENDPOINTS) as ServiceProvider[];

    set({ isChecking: true });

    try {
      await Promise.all(
        servicesToCheck.map(async (provider) => {
          const startTime = Date.now();
          try {
            const response = await fetch(HEALTH_CHECK_ENDPOINTS[provider], {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
              },
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            const latency = Date.now() - startTime;
            const status: ServiceStatus = response.ok ? 
              (latency < 1000 ? 'operational' : 'degraded') : 
              'down';

            get().updateHealth(provider, {
              status,
              latency,
              lastCheck: new Date(),
              error: response.ok ? undefined : `HTTP ${response.status}`
            });

            // Notify if service is degraded or down
            if (status !== 'operational') {
              addNotification({
                type: status === 'degraded' ? 'warning' : 'error',
                message: `${provider} service is ${status}${response.ok ? ' (high latency)' : ''}`
              });
            }
          } catch (error) {
            get().updateHealth(provider, {
              status: 'down',
              latency: Date.now() - startTime,
              lastCheck: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });

            addNotification({
              type: 'error',
              message: `${provider} service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        })
      );
    } finally {
      set({ isChecking: false });
    }
  },

  updateHealth: (service, health) => {
    set((state) => ({
      health: {
        ...state.health,
        [service]: {
          ...state.health[service],
          ...health
        }
      }
    }));
  },

  getPreferredService: () => {
    const state = get();
    const operational = Object.entries(state.health)
      .filter(([_, health]) => health.status === 'operational')
      .sort((a, b) => a[1].latency - b[1].latency);

    if (operational.length > 0) {
      return operational[0][0] as ServiceProvider;
    }

    const degraded = Object.entries(state.health)
      .filter(([_, health]) => health.status === 'degraded')
      .sort((a, b) => a[1].latency - b[1].latency);

    if (degraded.length > 0) {
      return degraded[0][0] as ServiceProvider;
    }

    // Default to current provider if all are down
    return useApiKeyStore.getState().provider as ServiceProvider;
  }
}));

// Health check interval (every 5 minutes)
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

// Start periodic health checks
export function initializeHealthChecks() {
  const checkHealth = useHealthStore.getState().checkHealth;
  
  // Initial check
  checkHealth();

  // Set up periodic checks
  setInterval(() => {
    checkHealth();
  }, HEALTH_CHECK_INTERVAL);
}

// Helper to determine if a service should be avoided
export function shouldAvoidService(service: ServiceProvider): boolean {
  const health = useHealthStore.getState().health[service];
  return health.status === 'down' || 
         (health.status === 'degraded' && health.latency > 5000); // Avoid if latency > 5s
} 