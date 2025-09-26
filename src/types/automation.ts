// Automation API types

export type Channel = 'facebook' | 'google_ads';

export interface ChannelConfig {
  id: Channel;
  label: string;
  enabled?: boolean;
}

export const CHANNELS: ChannelConfig[] = [
  { id: 'facebook', label: 'Facebook & Instagram', enabled: true },
  { id: 'google_ads', label: 'Google Ads', enabled: false },
];

export interface AutomationExecution {
  id: string;
  rule_id: string;
  executed_at: string;
  status: 'success' | 'failed' | 'pending';
  result?: unknown;
  error?: string;
}

export interface AutomationExecutionsResponse {
  executions: AutomationExecution[];
  total: number;
  limit: number;
  offset: number;
}

export interface AutomationWorker {
  worker_id: string;
  status: string;
  current_jobs: number;
  jobs_processed: number;
  jobs_succeeded: number;
  jobs_failed: number;
  last_heartbeat: string;
}

export interface AutomationEngineStats {
  jobs: Record<string, unknown>;
  rateLimits: Record<string, unknown>;
  timestamp: string;
  workers?: AutomationWorker[];
}

export interface WeatherCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
  value: string | number;
}

export interface CreateRuleBody {
  name: string;
  enabled: boolean;
  description?: string;
  trigger: {
    type: 'weather';
    location: {
      place_id: string;
      description: string;
      lat: number;
      lng: number;
      city?: string;
      country?: string;
    };
    conditions: WeatherCondition[];
  };
  action: {
    type: 'meta_campaign_control';
    campaign_ids: string[];
    operation: 'pause' | 'resume' | 'adjust_budget';
    params?: Record<string, unknown>;
  };
}