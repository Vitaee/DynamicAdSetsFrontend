// Meta (Facebook) API type definitions

export interface MetaAdAccount {
  id?: string;
  ad_account_id?: string;
  name?: string;
  isActive?: boolean;
  is_active?: boolean;
}

export interface MetaAccount {
  id: string;
  name: string;
  adAccounts: MetaAdAccount[];
}

export interface MetaAccountResponse {
  account: MetaAccount | null;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  adSets?: MetaAdSet[];
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
}

export interface MetaCampaignsResponse {
  campaigns: MetaCampaign[];
}

export interface MetaExecutionStats {
  jobs: Record<string, unknown>;
  rateLimits: Record<string, unknown>;
  timestamp: string;
  workers?: Array<{
    id: string;
    status: string;
  }>;
}
