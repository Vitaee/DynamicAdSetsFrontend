import { request } from './http';

export type MetaTargeting = {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    regions?: string[];
    cities?: string[];
  };
  interests?: Array<{ id: string; name: string }>;
  behaviors?: Array<{ id: string; name: string }>;
  custom_audiences?: Array<{ id: string; name: string }>;
};

export type MetaCampaign = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time?: string;
  updated_time?: string;
};

export type MetaAdSet = {
  id: string;
  name: string;
  campaign_id: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
  targeting?: MetaTargeting;
  billing_event?: string;
  optimization_goal?: string;
  created_time?: string;
  updated_time?: string;
};

export type GoogleCampaign = {
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  type: string;
  budget?: string;
  created_time?: string;
  updated_time?: string;
};

// Meta Campaign APIs
export function getMetaCampaigns(adAccountId: string) {
  return request<{ campaigns: MetaCampaign[] }>(`/meta/campaigns/${adAccountId}`);
}

export function createMetaCampaign(data: {
  adAccountId: string;
  name: string;
  objective: string;
  status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}) {
  return request<{ id: string; campaign?: MetaCampaign }>(`/meta/campaigns`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMetaCampaign(campaignId: string, data: {
  name?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  objective?: string;
}) {
  return request<{ message: string; campaignId: string }>(`/meta/campaigns/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteMetaCampaign(campaignId: string) {
  return request<{ message: string; campaignId: string }>(`/meta/campaigns/${campaignId}`, {
    method: 'DELETE',
  });
}

export function metaCampaignAction(campaignId: string, action: 'pause' | 'resume') {
  return request<{ message: string; campaignId: string; newStatus: string }>(`/meta/campaigns/action`, {
    method: 'POST',
    body: JSON.stringify({ campaignId, action }),
  });
}

// Meta Ad Set APIs
export function getMetaAdSets(campaignId: string) {
  return request<{ adSets: MetaAdSet[] }>(`/meta/adsets/${campaignId}`);
}

export function getMetaAdSet(adSetId: string) {
  return request<{ adset: MetaAdSet }>(`/meta/adset/${adSetId}`);
}

export function createMetaAdSet(data: {
  adAccountId: string;
  campaignId: string;
  name: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  targeting: MetaTargeting;
  billing_event?: string;
  optimization_goal?: string;
}) {
  return request<{ id: string }>(`/meta/adsets`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteMetaAdSet(adSetId: string) {
  return request<{ message: string; adSetId: string }>(`/meta/adsets/${adSetId}`, {
    method: 'DELETE',
  });
}

export function metaAdSetAction(adSetId: string, action: 'pause' | 'resume') {
  return request<{ message: string; adSetId: string; newStatus: string }>(`/meta/adsets/action`, {
    method: 'POST',
    body: JSON.stringify({ adSetId, action }),
  });
}

// Google Campaign APIs (mocked)
export function getGoogleCampaigns(customerId: string) {
  return request<{ campaigns: GoogleCampaign[] }>(`/google/campaigns/${customerId}`);
}

export function googleCampaignAction(campaignId: string, action: 'pause' | 'resume') {
  return request<{ message: string; campaignId: string; newStatus: string }>(`/google/campaigns/action`, {
    method: 'POST',
    body: JSON.stringify({ campaignId, action }),
  });
}