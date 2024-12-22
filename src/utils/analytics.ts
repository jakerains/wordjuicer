// Declare gtag as a global function
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      action: string,
      params?: Record<string, any>
    ) => void;
  }
}

// Google Analytics Measurement ID
const GA_TRACKING_ID = 'G-FQRG6EGMH9';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_TRACKING_ID);
  }
};

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Common events
export const trackTranscriptionStart = (language: string, service: 'openai' | 'groq' | 'huggingface') => {
  event({
    action: 'start_transcription',
    category: 'Transcription',
    label: language,
    value: undefined,
  });

  // Track service selection separately
  event({
    action: 'service_selection',
    category: 'Service',
    label: service,
  });
};

export const trackTranscriptionComplete = (duration: number, language: string, service: 'openai' | 'groq' | 'huggingface', fileSize: number) => {
  event({
    action: 'complete_transcription',
    category: 'Transcription',
    label: language,
    value: Math.round(duration), // Duration in seconds
  });

  // Track service completion time
  event({
    action: 'service_completion_time',
    category: 'Service Performance',
    label: service,
    value: Math.round(duration),
  });

  // Track file size metrics
  event({
    action: 'file_size',
    category: 'Usage',
    label: service,
    value: Math.round(fileSize / 1024 / 1024), // Size in MB
  });

  // Track processing speed (MB per second)
  const processingSpeed = (fileSize / 1024 / 1024) / duration;
  event({
    action: 'processing_speed',
    category: 'Performance',
    label: service,
    value: Math.round(processingSpeed * 100) / 100,
  });
};

// Track user engagement metrics
export const trackFeatureUsage = (feature: string) => {
  event({
    action: 'feature_usage',
    category: 'Engagement',
    label: feature,
  });
};

// Track settings changes
export const trackSettingsChange = (setting: string, value: string) => {
  event({
    action: 'settings_change',
    category: 'Settings',
    label: `${setting}: ${value}`,
  });
};

// Track API errors with more detail
export const trackAPIError = (service: 'openai' | 'groq' | 'huggingface', errorType: string, statusCode?: number) => {
  event({
    action: 'api_error',
    category: 'API Errors',
    label: `${service} - ${errorType}${statusCode ? ` (${statusCode})` : ''}`,
  });
};

// Track user retention
export const trackReturnVisit = (daysSinceLastVisit: number) => {
  event({
    action: 'return_visit',
    category: 'Retention',
    value: daysSinceLastVisit,
  });
};

// Track export success/failure
export const trackExport = (format: string, success: boolean = true, fileSize?: number) => {
  event({
    action: 'export',
    category: 'Export',
    label: `${format}${success ? '' : ' (failed)'}`,
    value: fileSize ? Math.round(fileSize / 1024) : undefined, // Size in KB if available
  });
};

// Track installation events
export const trackInstallEvent = (type: 'prompt_shown' | 'installed' | 'dismissed') => {
  event({
    action: 'pwa_install',
    category: 'Installation',
    label: type,
  });
};

// Track error
export const trackError = (errorMessage: string) => {
  event({
    action: 'error',
    category: 'Error',
    label: errorMessage,
  });
}; 