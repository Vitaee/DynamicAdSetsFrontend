import { request } from './http';
import type { AutomationExecutionsResponse, AutomationEngineStats } from '../types/automation';

export type RuleCampaign = {
  id?: string;
  platform?: 'meta' | 'google';
  target_type: 'ad_set' | 'campaign';
  ad_set_id?: string;
  campaign_id?: string;
  account_id?: string;
};

export type AutomationRule = {
  id: string;
  name: string;
  is_active?: boolean;
  campaigns?: RuleCampaign[];
  created_at?: string;
};

export function listAutomationRules(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return request<{ rules: AutomationRule[]; total: number }>(`/automation-rules${qs ? `?${qs}` : ''}`);
}

export function toggleAutomationRule(id: string) {
  return request<{ rule: AutomationRule }>(`/automation-rules/${id}/toggle`, {
    method: 'POST',
  });
}

export function deleteAutomationRule(id: string) {
  return request<{ message: string }>(`/automation-rules/${id}`, {
    method: 'DELETE',
  });
}

// Analytics / reporting

export function getRecentExecutions(limit = 10, offset = 0) {
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) }).toString();
  return request<AutomationExecutionsResponse>(`/automation-rules/executions/recent?${qs}`);
}

export function getEngineStats() {
  return request<AutomationEngineStats>(`/automation-rules/engine/stats`);
}

export type WeatherCondition = {
  parameter: 'temperature'|'humidity'|'wind_speed'|'precipitation'|'visibility'|'cloud_cover';
  operator: 'greater_than'|'less_than'|'equals'|'between';
  value: number;
  unit: string;
};

export type ConditionGroup = {
  id?: string;
  operator: 'AND'|'OR';
  conditions: WeatherCondition[];
};

export type ConditionLogic = {
  groups: ConditionGroup[];
  globalOperator: 'AND'|'OR';
  timeFrame?: { days: number; action: 'on'|'off' };
};

export type CreateRuleBody = {
  name: string;
  description?: string;
  location: { city: string; country: string; lat: number; lon: number };
  conditions: WeatherCondition[];
  conditionLogic?: ConditionLogic;
  campaigns: Array<{
    platform: 'meta'|'google';
    campaign_id: string;
    campaign_name: string;
    ad_account_id: string;
    ad_account_name: string;
    action: 'pause'|'resume';
    ad_set_id: string;
    ad_set_name: string;
    target_type: 'ad_set';
  }>;
  check_interval_minutes: number; // 720 or 1440 per backend constraints
};

export function createAutomationRule(body: CreateRuleBody) {
  return request<{ rule: AutomationRule }>(`/automation-rules`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Enhanced AutomationRule type for detail view
export type AutomationRuleDetail = AutomationRule & {
  description?: string;
  location?: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  conditions?: Array<{
    parameter: string;
    operator: string;
    value: number;
    unit: string;
  }>;
  check_interval_minutes?: number;
  last_checked_at?: string;
  last_executed_at?: string;
  updated_at?: string;
};

// Update rule type
export type UpdateRuleBody = {
  name?: string;
  description?: string;
  is_active?: boolean;
  check_interval_minutes?: number;
};

export function getAutomationRule(id: string) {
  return request<{ rule: AutomationRuleDetail }>(`/automation-rules/${id}`);
}

export function updateAutomationRule(id: string, body: UpdateRuleBody) {
  return request<{ rule: AutomationRuleDetail }>(`/automation-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
