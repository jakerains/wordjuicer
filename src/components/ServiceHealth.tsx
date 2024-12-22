import React from 'react';
import { useHealthStore, type ServiceProvider, type ServiceStatus } from '../utils/healthCheck';
import { Activity, CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

const STATUS_ICONS: Record<ServiceStatus, React.ReactNode> = {
  operational: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  degraded: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  down: <XCircle className="w-4 h-4 text-red-500" />,
  unknown: <HelpCircle className="w-4 h-4 text-gray-500" />
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  operational: 'bg-green-500/10 text-green-500',
  degraded: 'bg-yellow-500/10 text-yellow-500',
  down: 'bg-red-500/10 text-red-500',
  unknown: 'bg-gray-500/10 text-gray-500'
};

const SERVICE_NAMES: Record<ServiceProvider, string> = {
  openai: 'OpenAI',
  groq: 'Groq',
  huggingface: 'Hugging Face'
};

export function ServiceHealth() {
  const { health, isChecking, checkHealth } = useHealthStore();

  const handleRefresh = () => {
    checkHealth();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white/90">Service Status</h3>
        <button
          onClick={handleRefresh}
          disabled={isChecking}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          title="Refresh status"
        >
          <Activity className={`w-4 h-4 text-white/70 ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid gap-3">
        {Object.entries(health).map(([service, status]) => (
          <div
            key={service}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="flex items-center gap-3">
              {STATUS_ICONS[status.status]}
              <span className="text-sm text-white/80">{SERVICE_NAMES[service as ServiceProvider]}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[status.status]}`}>
                {status.status}
              </span>
              {status.latency > 0 && (
                <span className="text-xs text-white/50">
                  {Math.round(status.latency)}ms
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-white/50 text-right">
        Last checked: {isChecking ? 'Checking...' : (
          Object.values(health)[0].lastCheck.getTime() > 0 
            ? new Date(Math.max(...Object.values(health).map(h => h.lastCheck.getTime()))).toLocaleTimeString()
            : 'Never'
        )}
      </div>
    </div>
  );
} 