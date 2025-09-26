/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { metaGetAccount, type MetaAccount } from '../api/meta';
import { getMetaCampaigns, metaCampaignAction, metaAdSetAction, createMetaAdSet, createMetaCampaign } from '../api/campaigns';
import type { MetaCampaign, MetaAdSet, MetaTargeting } from '../api/campaigns';
import { toast } from './ui';
import { requestCache } from '../lib/requestCache';

export type CampaignWithAdSets = MetaCampaign & {
  adSets?: MetaAdSet[];
  platform: 'meta' | 'google';
  automation?: string;
  channel: string;
  type: string;
  // Enhanced with account context
  adAccountId?: string;
  adAccountName?: string;
  currency?: string;
};

export type AdSetFormData = {
  name: string;
  daily_budget: string;
  targeting: MetaTargeting;
};

export type CampaignFormData = {
  name: string;
  objective: string;
};

export interface MetaAccountInfo {
  id: string;
  name?: string;
  currency?: string;
  isActive?: boolean;
  campaignCount?: number;
}

interface CampaignsState {
  // Core State
  isLoading: boolean;
  campaigns: CampaignWithAdSets[];
  metaAccount: MetaAccount | null;
  error: string | null;
  lastFetchTime: number;
  isInitialized: boolean;

  // Multi-Account Management
  adAccounts: MetaAccountInfo[];
  selectedAdAccountId: string | null; // Currently selected account for filtering
  accountsLoading: Record<string, boolean>; // Per-account loading states

  // Individual Action States
  actionStates: Record<string, {
    isLoading: boolean;
    error: string | null;
    lastAction?: string;
  }>;

  // Data Management
  loadCampaigns: () => Promise<void>;
  loadCampaignsForAccount: (adAccountId: string) => Promise<void>;
  refreshCampaigns: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  
  // Multi-Account Management
  setSelectedAdAccount: (adAccountId: string | null) => void;
  getAvailableAccounts: () => MetaAccountInfo[];
  getCampaignsForAccount: (adAccountId: string) => CampaignWithAdSets[];
  getCurrentAccountInfo: () => MetaAccountInfo | null;
  
  // Campaign Actions (with optimistic updates)
  updateCampaignStatus: (campaignId: string, action: 'pause' | 'resume') => Promise<void>;
  createCampaign: (data: CampaignFormData) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  
  // Campaign Data Management
  updateCampaignInStore: (campaignId: string, updates: Partial<CampaignWithAdSets>) => void;
  removeCampaignFromStore: (campaignId: string) => void;
  addCampaignToStore: (campaign: CampaignWithAdSets) => void;
  
  // Ad Set Actions (with optimistic updates)
  createAdSet: (campaignId: string, data: AdSetFormData) => Promise<void>;
  updateAdSetStatus: (adSetId: string, action: 'pause' | 'resume') => Promise<void>;
  deleteAdSet: (adSetId: string) => Promise<void>;
  loadAdSets: (campaignId: string) => Promise<MetaAdSet[]>;
  
  // Ad Set Data Management
  getAdSetsByCampaignFromStore: (campaignId: string) => MetaAdSet[];
  updateAdSetInStore: (adSetId: string, updates: Partial<MetaAdSet>) => void;
  removeAdSetFromStore: (adSetId: string) => void;
  
  // Utility Actions
  clearError: () => void;
  clearActionError: (id: string) => void;
  reset: () => void;
  
  // Selectors
  getCampaignById: (id: string) => CampaignWithAdSets | undefined;
  getAdSetsByCampaign: (campaignId: string) => MetaAdSet[];
  getActionState: (id: string) => { isLoading: boolean; error: string | null };
}

const CACHE_DURATION = 30000; // 30 seconds cache

const getAdTypeFromObjective = (objective: string): string => {
  switch (objective.toUpperCase()) {
    // New Meta API objective format (OUTCOME_*)
    case 'OUTCOME_SALES':
    case 'OUTCOME_CONVERSIONS':
      return 'Conversion Ad';
    case 'OUTCOME_TRAFFIC':
      return 'Traffic Ad';
    case 'OUTCOME_ENGAGEMENT':
      return 'Engagement Ad';
    case 'OUTCOME_AWARENESS':
      return 'Brand Awareness';
    case 'OUTCOME_LEADS':
      return 'Lead Generation';
    case 'OUTCOME_APP_PROMOTION':
      return 'App Promotion';
    
    // Legacy objective format (for backward compatibility)
    case 'CONVERSIONS':
      return 'Conversion Ad';
    case 'LINK_CLICKS':
    case 'TRAFFIC':
      return 'Traffic Ad';
    case 'VIDEO_VIEWS':
      return 'Video Ad';
    case 'REACH':
      return 'Reach Ad';
    case 'BRAND_AWARENESS':
      return 'Brand Awareness';
    case 'LEAD_GENERATION':
      return 'Lead Generation';
    
    default:
      return 'Campaign Ad';
  }
};

export const useCampaignsStore = create<CampaignsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isLoading: false,
    campaigns: [],
    metaAccount: null,
    error: null,
    lastFetchTime: 0,
    isInitialized: false,
    actionStates: {},
    
    // Multi-account state
    adAccounts: [],
    selectedAdAccountId: null,
    accountsLoading: {},

    // ===== DATA MANAGEMENT =====
    loadCampaigns: async () => {
      const { isLoading, lastFetchTime, isInitialized } = get();
      
      // Prevent concurrent calls and implement caching
      if (isLoading) return;
      
      const now = Date.now();
      if (isInitialized && (now - lastFetchTime) < CACHE_DURATION) {
        return;
      }

      try {
        set({ isLoading: true, error: null });

        // Use request cache to prevent duplicate calls
        const accountResponse = await requestCache.get(
          'meta-account-campaigns',
          () => metaGetAccount(),
          { ttl: CACHE_DURATION }
        );

        if (!accountResponse.connected) {
          set({ 
            metaAccount: null, 
            campaigns: [], 
            isLoading: false,
            lastFetchTime: now,
            isInitialized: true
          });
          
          if (accountResponse.expired) {
            toast.error(
              'Your Meta connection has expired. Please reconnect to continue.',
              'Connection Expired'
            );
          }
          return;
        }

        const metaAccount = accountResponse.account;
        set({ metaAccount });

        // Process and store ad account information
        const adAccounts: MetaAccountInfo[] = [];
        const allCampaigns: CampaignWithAdSets[] = [];

        if (metaAccount?.adAccounts) {
          const campaignPromises = metaAccount.adAccounts.map(async (adAccount) => {
            try {
              const adAccountId = adAccount.ad_account_id || adAccount.id;
              if (!adAccountId) return { adAccountInfo: null, campaigns: [] };

              // Set loading state for this account
              set(state => ({
                accountsLoading: { ...state.accountsLoading, [adAccountId]: true }
              }));

              const campaignsResponse = await requestCache.get(
                `campaigns-${adAccountId}`,
                () => getMetaCampaigns(adAccountId),
                { ttl: CACHE_DURATION }
              );

              const adAccountInfo: MetaAccountInfo = {
                id: adAccountId,
                name: adAccount.name || `Account ${adAccountId}`,
                currency: adAccount.currency || 'USD',
                isActive: adAccount.isActive ?? true,
                campaignCount: campaignsResponse.campaigns.length
              };

              const campaignsWithContext = campaignsResponse.campaigns.map(campaign => ({
                ...campaign,
                platform: 'meta' as const,
                automation: undefined,
                channel: 'Facebook',
                type: getAdTypeFromObjective(campaign.objective),
                adAccountId: adAccountId,
                adAccountName: adAccount.name || `Account ${adAccountId}`,
                currency: adAccount.currency || 'USD'
              }));

              // Clear loading state for this account
              set(state => ({
                accountsLoading: { ...state.accountsLoading, [adAccountId]: false }
              }));

              return { adAccountInfo, campaigns: campaignsWithContext };
            } catch (error) {
              console.warn(`Failed to load campaigns for account ${adAccount.id}:`, error);
              const adAccountId = adAccount.ad_account_id || adAccount.id;
              if (adAccountId) {
                set(state => ({
                  accountsLoading: { ...state.accountsLoading, [adAccountId]: false }
                }));
              }
              return { adAccountInfo: null, campaigns: [] };
            }
          });

          const results = await Promise.all(campaignPromises);
          results.forEach(({ adAccountInfo, campaigns }) => {
            if (adAccountInfo) {
              adAccounts.push(adAccountInfo);
            }
            allCampaigns.push(...campaigns);
          });
        }

        // Set default selected account to first account if none selected
        const currentSelected = get().selectedAdAccountId;
        const defaultSelected = currentSelected || (adAccounts.length > 0 ? adAccounts[0].id : null);

        set({ 
          campaigns: allCampaigns,
          adAccounts,
          selectedAdAccountId: defaultSelected,
          isLoading: false, 
          error: null,
          lastFetchTime: now,
          isInitialized: true
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load campaigns';
        
        set({ 
          error: errorMessage, 
          isLoading: false,
          lastFetchTime: now,
          isInitialized: true,
          adAccounts: [],
          selectedAdAccountId: null
        });
        
        toast.error(errorMessage, 'Failed to Load Campaigns');
      }
    },

    refreshCampaigns: async () => {
      // Clear cache and reload
      requestCache.invalidatePattern(/^(meta-account-campaigns|campaigns-)/);
      // Also clear ad sets cache to avoid stale ad sets on refresh
      requestCache.invalidatePattern(/^adsets-/);
      set({ lastFetchTime: 0, isInitialized: false });
      await get().loadCampaigns();
    },

    forceRefresh: async () => {
      // Force complete refresh regardless of cache
      requestCache.invalidatePattern(/^(meta-account-campaigns|campaigns-)/);
      // Also clear ad sets caches for all campaigns
      requestCache.invalidatePattern(/^adsets-/);
      set({ 
        lastFetchTime: 0, 
        isInitialized: false, 
        actionStates: {},
        accountsLoading: {}
      });
      await get().loadCampaigns();
    },

    loadCampaignsForAccount: async (adAccountId: string) => {
      const { accountsLoading } = get();
      
      // Prevent concurrent calls for the same account
      if (accountsLoading[adAccountId]) return;

      try {
        set(state => ({
          accountsLoading: { ...state.accountsLoading, [adAccountId]: true }
        }));

        const campaignsResponse = await requestCache.get(
          `campaigns-${adAccountId}`,
          () => getMetaCampaigns(adAccountId),
          { ttl: CACHE_DURATION, force: true }
        );

        const { metaAccount, campaigns: currentCampaigns } = get();
        const adAccount = metaAccount?.adAccounts?.find(acc => 
          (acc.ad_account_id || acc.id) === adAccountId
        );

        const campaignsWithContext = campaignsResponse.campaigns.map(campaign => ({
          ...campaign,
          platform: 'meta' as const,
          automation: undefined,
          channel: 'Facebook',
          type: getAdTypeFromObjective(campaign.objective),
          adAccountId: adAccountId,
          adAccountName: adAccount?.name || `Account ${adAccountId}`,
          currency: adAccount?.currency || 'USD'
        }));

        // Update campaigns for this account
        const updatedCampaigns = [
          ...currentCampaigns.filter(c => c.adAccountId !== adAccountId),
          ...campaignsWithContext
        ];

        // Update ad account info
        const updatedAdAccounts = get().adAccounts.map(acc => 
          acc.id === adAccountId 
            ? { ...acc, campaignCount: campaignsResponse.campaigns.length }
            : acc
        );

        set(state => ({
          campaigns: updatedCampaigns,
          adAccounts: updatedAdAccounts,
          accountsLoading: { ...state.accountsLoading, [adAccountId]: false }
        }));

      } catch (error) {
        console.error(`Failed to load campaigns for account ${adAccountId}:`, error);
        set(state => ({
          accountsLoading: { ...state.accountsLoading, [adAccountId]: false }
        }));
        throw error;
      }
    },

    // ===== CAMPAIGN ACTIONS WITH OPTIMISTIC UPDATES =====
    updateCampaignStatus: async (campaignId: string, action: 'pause' | 'resume') => {
      const state = get();
      const campaign = state.campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      // Set loading state for this action
      set(state => ({
        actionStates: {
          ...state.actionStates,
          [campaignId]: { isLoading: true, error: null, lastAction: action }
        }
      }));

      // Optimistic update
      const newStatus = action === 'pause' ? 'PAUSED' : 'ACTIVE';
      set(state => ({
        campaigns: state.campaigns.map(c => 
          c.id === campaignId ? { ...c, status: newStatus as any } : c
        )
      }));

      try {
        await metaCampaignAction(campaignId, action);
        
        // Success - clear loading state
        set(state => ({
          actionStates: {
            ...state.actionStates,
            [campaignId]: { isLoading: false, error: null }
          }
        }));

        toast.success(
          `Campaign ${action === 'pause' ? 'paused' : 'resumed'} successfully`,
          action === 'pause' ? 'Campaign Paused' : 'Campaign Resumed'
        );

        // Invalidate related cache
        requestCache.invalidatePattern(/^campaigns-/);
        
      } catch (error) {
        // Rollback optimistic update
        set(state => ({
          campaigns: state.campaigns.map(c => 
            c.id === campaignId ? { ...c, status: campaign.status } : c
          ),
          actionStates: {
            ...state.actionStates,
            [campaignId]: { 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to update campaign' 
            }
          }
        }));

        const errorMessage = error instanceof Error ? error.message : 'Failed to update campaign';
        toast.error(
          `Failed to ${action} campaign: ${errorMessage}`,
          `${action === 'pause' ? 'Pause' : 'Resume'} Failed`
        );
      }
    },

    createCampaign: async (data: CampaignFormData) => {
      const { metaAccount } = get();
      if (!metaAccount?.adAccounts?.[0]) {
        throw new Error('No ad account found. Please connect your Meta Ads account.');
      }

      const adAccount = metaAccount.adAccounts[0];
      const adAccountId = adAccount.ad_account_id || adAccount.id;
      
      if (!adAccountId) {
        throw new Error('Invalid ad account ID. Please reconnect your Meta account.');
      }

      // Set loading state
      const tempId = `temp-${Date.now()}`;
      set(state => ({
        actionStates: {
          ...state.actionStates,
          [tempId]: { isLoading: true, error: null, lastAction: 'create' }
        }
      }));

      try {
        const response = await createMetaCampaign({
          adAccountId,
          name: data.name,
          objective: data.objective,
          status: 'PAUSED'
        });

        // Add new campaign to state optimistically WITH ACCOUNT CONTEXT
        const { selectedAdAccountId, adAccounts } = get();
        const targetAccountId = selectedAdAccountId || adAccountId;
        const accountInfo = adAccounts.find(acc => acc.id === targetAccountId);
        
        const newCampaign: CampaignWithAdSets = {
          id: response.id,
          name: data.name,
          status: 'PAUSED',
          objective: data.objective,
          platform: 'meta',
          channel: 'Facebook',
          type: getAdTypeFromObjective(data.objective),
          created_time: new Date().toISOString(),
          // CRITICAL: Add account context for multi-account filtering
          adAccountId: targetAccountId,
          adAccountName: accountInfo?.name || adAccount.name || `Account ${targetAccountId}`,
          currency: accountInfo?.currency || adAccount.currency || 'USD',
          adSets: [] // Initialize empty ad sets array
        };

        // Add campaign using helper function
        get().addCampaignToStore(newCampaign);

        // Update account campaign count
        set(state => ({
          adAccounts: state.adAccounts.map(acc => 
            acc.id === targetAccountId 
              ? { ...acc, campaignCount: (acc.campaignCount || 0) + 1 }
              : acc
          ),
          actionStates: {
            ...state.actionStates,
            [tempId]: { isLoading: false, error: null }
          }
        }));

        toast.success(
          `Campaign "${data.name}" created successfully in ${newCampaign.adAccountName}`,
          'Campaign Created'
        );

        // Invalidate cache for fresh data
        requestCache.invalidatePattern(/^campaigns-/);
        
      } catch (error) {
        set(state => ({
          actionStates: {
            ...state.actionStates,
            [tempId]: { 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to create campaign' 
            }
          }
        }));

        const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
        toast.error(errorMessage, 'Campaign Creation Failed');
        throw error;
      }
    },

    createAdSet: async (campaignId: string, data: AdSetFormData) => {
      const { campaigns, metaAccount, selectedAdAccountId } = get();
      const campaign = campaigns.find(c => c.id === campaignId);

      // Resolve ad account in a robust way:
      // 1) Prefer campaign's account context if available
      // 2) Fallback to selected account in store
      // 3) Fallback to the first connected account
      let resolvedAdAccountId: string | undefined;
      let resolvedAdAccount: any | undefined;

      if (campaign?.adAccountId) {
        resolvedAdAccountId = campaign.adAccountId;
        resolvedAdAccount = metaAccount?.adAccounts?.find(acc => (acc.ad_account_id || acc.id) === resolvedAdAccountId);
      }

      if (!resolvedAdAccountId && selectedAdAccountId) {
        resolvedAdAccountId = selectedAdAccountId;
        resolvedAdAccount = metaAccount?.adAccounts?.find(acc => (acc.ad_account_id || acc.id) === resolvedAdAccountId);
      }

      if (!resolvedAdAccountId && metaAccount?.adAccounts?.[0]) {
        resolvedAdAccount = metaAccount.adAccounts[0];
        resolvedAdAccountId = resolvedAdAccount.ad_account_id || resolvedAdAccount.id;
      }

      if (!resolvedAdAccountId) {
        throw new Error('Ad account not found. Please load campaigns or reconnect your Meta account.');
      }

      const adAccountId = resolvedAdAccountId;

      // Validate and prepare data
      if (!data.name.trim()) {
        throw new Error('Ad set name is required');
      }
      
      if (!data.daily_budget || parseFloat(data.daily_budget) <= 0) {
        throw new Error('Daily budget must be greater than 0');
      }

      const currency = (resolvedAdAccount?.currency) || 'USD';
      const budgetValue = parseFloat(data.daily_budget);
      
      // Set minimum budget based on currency
      let minBudget = 1;
      if (currency === 'RUB') {
        minBudget = 85;
      } else if (currency === 'EUR') {
        minBudget = 1;
      }
      
      if (budgetValue < minBudget) {
        throw new Error(`Daily budget must be at least ${minBudget} ${currency} for your ad account.`);
      }

      const budgetInCents = Math.round(budgetValue * 100);
      const tempId = `temp-adset-${Date.now()}`;

      // Set loading state
      set(state => ({
        actionStates: {
          ...state.actionStates,
          [tempId]: { isLoading: true, error: null, lastAction: 'create-adset' }
        }
      }));

      try {
        const adSetPayload = {
          adAccountId,
          campaignId,
          name: data.name.trim(),
          daily_budget: budgetInCents.toString(),
          targeting: data.targeting || {
            age_min: 18,
            age_max: 65,
            genders: [1, 2],
            geo_locations: { countries: ['US'] }
          },
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'REACH',
          status: 'PAUSED'
        };

        const response = await createMetaAdSet(adSetPayload);

        // Add new ad set to campaign optimistically
        const newAdSet: MetaAdSet = {
          id: response.id,
          name: data.name.trim(),
          campaign_id: campaignId,
          status: 'PAUSED',
          daily_budget: budgetInCents.toString(),
          targeting: data.targeting,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'REACH',
          created_time: new Date().toISOString()
        };

        // Only update store if the campaign is known in memory; otherwise skip silently
        set(state => ({
          campaigns: state.campaigns.some(c => c.id === campaignId)
            ? state.campaigns.map(c => 
                c.id === campaignId 
                  ? { ...c, adSets: [...(c.adSets || []), newAdSet] }
                  : c
              )
            : state.campaigns,
          actionStates: {
            ...state.actionStates,
            [tempId]: { isLoading: false, error: null }
          }
        }));

        toast.success(
          `Ad set "${data.name}" created successfully with ${budgetValue} ${currency} daily budget`,
          'Ad Set Created'
        );

        // Invalidate cache
        requestCache.invalidatePattern(/^campaigns-/);
        // Also invalidate ad sets cache for this campaign
        requestCache.invalidate(`adsets-${campaignId}`);
        
      } catch (error) {
        set(state => ({
          actionStates: {
            ...state.actionStates,
            [tempId]: { 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to create ad set' 
            }
          }
        }));

        const errorMessage = error instanceof Error ? error.message : 'Failed to create ad set';
        toast.error(errorMessage, 'Ad Set Creation Failed');
        throw error;
      }
    },

    updateAdSetStatus: async (adSetId: string, action: 'pause' | 'resume') => {
      const { campaigns } = get();
      let originalAdSet: MetaAdSet | undefined;
      let campaignId: string | undefined;

      // Find the ad set and campaign
      for (const campaign of campaigns) {
        if (campaign.adSets) {
          const adSet = campaign.adSets.find(as => as.id === adSetId);
          if (adSet) {
            originalAdSet = adSet;
            campaignId = campaign.id;
            break;
          }
        }
      }

      if (!originalAdSet || !campaignId) return;

      // Set loading state
      set(state => ({
        actionStates: {
          ...state.actionStates,
          [adSetId]: { isLoading: true, error: null, lastAction: action }
        }
      }));

      // Optimistic update
      const newStatus = action === 'pause' ? 'PAUSED' : 'ACTIVE';
      set(state => ({
        campaigns: state.campaigns.map(c => 
          c.id === campaignId 
            ? {
                ...c,
                adSets: c.adSets?.map(as => 
                  as.id === adSetId ? { ...as, status: newStatus as any } : as
                )
              }
            : c
        )
      }));

      try {
        await metaAdSetAction(adSetId, action);
        
        // Success - clear loading state
        set(state => ({
          actionStates: {
            ...state.actionStates,
            [adSetId]: { isLoading: false, error: null }
          }
        }));

        toast.success(
          `Ad set ${action === 'pause' ? 'paused' : 'resumed'} successfully`,
          action === 'pause' ? 'Ad Set Paused' : 'Ad Set Resumed'
        );

        // Invalidate cache
        requestCache.invalidatePattern(/^campaigns-/);
        if (campaignId) {
          // Also invalidate ad sets cache for this campaign
          requestCache.invalidate(`adsets-${campaignId}`);
        }
        
      } catch (error) {
        // Rollback optimistic update
        set(state => ({
          campaigns: state.campaigns.map(c => 
            c.id === campaignId 
              ? {
                  ...c,
                  adSets: c.adSets?.map(as => 
                    as.id === adSetId ? { ...as, status: originalAdSet.status } : as
                  )
                }
              : c
          ),
          actionStates: {
            ...state.actionStates,
            [adSetId]: { 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to update ad set' 
            }
          }
        }));

        const errorMessage = error instanceof Error ? error.message : 'Failed to update ad set';
        toast.error(
          `Failed to ${action} ad set: ${errorMessage}`,
          `${action === 'pause' ? 'Pause' : 'Resume'} Failed`
        );
      }
    },

    loadAdSets: async (campaignId: string) => {
      const { campaigns } = get();
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Return cached ad sets if available
      if (campaign.adSets && campaign.adSets.length > 0) {
        return campaign.adSets;
      }

      try {
        // Use request cache for ad sets
        const response = await requestCache.get(
          `adsets-${campaignId}`,
          () => import('../api/campaigns').then(api => api.getMetaAdSets(campaignId)),
          { ttl: CACHE_DURATION }
        );

        // Update campaign with ad sets
        set(state => ({
          campaigns: state.campaigns.map(c => 
            c.id === campaignId ? { ...c, adSets: response.adSets } : c
          )
        }));

        return response.adSets;
      } catch (error) {
        console.error('Failed to load ad sets:', error);
        throw error;
      }
    },

    deleteAdSet: async (adSetId: string) => {
      const { campaigns } = get();
      let originalAdSet: MetaAdSet | undefined;
      let campaignId: string | undefined;

      // Find the ad set and campaign
      for (const campaign of campaigns) {
        if (campaign.adSets) {
          const adSet = campaign.adSets.find(as => as.id === adSetId);
          if (adSet) {
            originalAdSet = adSet;
            campaignId = campaign.id;
            break;
          }
        }
      }

      if (!originalAdSet || !campaignId) return;

      // Set loading state
      set(state => ({
        actionStates: {
          ...state.actionStates,
          [adSetId]: { isLoading: true, error: null, lastAction: 'delete-adset' }
        }
      }));

      // Optimistic removal
      get().removeAdSetFromStore(adSetId);

      try {
        await import('../api/campaigns').then(api => api.deleteMetaAdSet(adSetId));
        
        // Success - clear loading state
        set(state => ({
          actionStates: {
            ...state.actionStates,
            [adSetId]: { isLoading: false, error: null }
          }
        }));

        toast.success(
          'Ad set deleted successfully',
          'Ad Set Deleted'
        );

        // Invalidate cache
        requestCache.invalidatePattern(/^campaigns-/);
        if (campaignId) {
          // Also invalidate ad sets cache for this campaign to ensure reload uses fresh data
          requestCache.invalidate(`adsets-${campaignId}`);
        }
        
      } catch (error) {
        // Rollback optimistic removal - add the ad set back
        set(state => ({
          campaigns: state.campaigns.map(c => 
            c.id === campaignId 
              ? {
                  ...c,
                  adSets: [...(c.adSets || []), originalAdSet]
                }
              : c
          ),
          actionStates: {
            ...state.actionStates,
            [adSetId]: { 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to delete ad set' 
            }
          }
        }));

        toast.error('Failed to delete ad set', 'Delete Failed');
      }
    },

    deleteCampaign: async (campaignId: string) => {
      const { campaigns } = get();
      const originalCampaign = campaigns.find(c => c.id === campaignId);
      
      if (!originalCampaign) {
        console.error(`Campaign ${campaignId} not found`);
        return;
      }

      // Set loading state
      set(state => ({
        actionStates: {
          ...state.actionStates,
          [campaignId]: { isLoading: true, error: null, lastAction: 'delete-campaign' }
        }
      }));

      // Optimistic removal
      get().removeCampaignFromStore(campaignId);
      
      // Update account campaign count
      if (originalCampaign.adAccountId) {
        set(state => ({
          adAccounts: state.adAccounts.map(acc => 
            acc.id === originalCampaign.adAccountId 
              ? { ...acc, campaignCount: Math.max(0, (acc.campaignCount || 1) - 1) }
              : acc
          )
        }));
      }

      try {
        await import('../api/campaigns').then(api => api.deleteMetaCampaign(campaignId));
        
        // Success - clear loading state
        set(state => ({
          actionStates: {
            ...state.actionStates,
            [campaignId]: { isLoading: false, error: null }
          }
        }));

        toast.success(
          `Campaign "${originalCampaign.name}" deleted successfully`,
          'Campaign Deleted'
        );

        // Invalidate cache
        requestCache.invalidatePattern(/^campaigns-/);
        // Also invalidate ad sets cache for this campaign
        requestCache.invalidate(`adsets-${campaignId}`);
        
      } catch (error) {
        // Rollback optimistic removal
        get().addCampaignToStore(originalCampaign);
        
        // Rollback account count
        if (originalCampaign.adAccountId) {
          set(state => ({
            adAccounts: state.adAccounts.map(acc => 
              acc.id === originalCampaign.adAccountId 
                ? { ...acc, campaignCount: (acc.campaignCount || 0) + 1 }
                : acc
            )
          }));
        }

        set(state => ({
          actionStates: {
            ...state.actionStates,
            [campaignId]: { 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to delete campaign' 
            }
          }
        }));

        toast.error(`Failed to delete campaign: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Delete Failed');
      }
    },

    // ===== UTILITY ACTIONS =====
    clearError: () => set({ error: null }),
    
    clearActionError: (id: string) => set(state => ({
      actionStates: {
        ...state.actionStates,
        [id]: { ...state.actionStates[id], error: null }
      }
    })),

    reset: () => {
      requestCache.invalidatePattern(/^(meta-account-campaigns|campaigns-)/);
      set({
        isLoading: false,
        campaigns: [],
        metaAccount: null,
        error: null,
        lastFetchTime: 0,
        isInitialized: false,
        actionStates: {},
        adAccounts: [],
        selectedAdAccountId: null,
        accountsLoading: {}
      });
    },

    // ===== MULTI-ACCOUNT MANAGEMENT =====
    setSelectedAdAccount: (adAccountId: string | null) => {
      set({ selectedAdAccountId: adAccountId });
    },

    getAvailableAccounts: () => {
      return get().adAccounts;
    },

    getCampaignsForAccount: (adAccountId: string) => {
      return get().campaigns.filter(campaign => campaign.adAccountId === adAccountId);
    },

    getCurrentAccountInfo: () => {
      const { adAccounts, selectedAdAccountId } = get();
      return adAccounts.find(acc => acc.id === selectedAdAccountId) || null;
    },

    // ===== SELECTORS =====
    getCampaignById: (id: string) => {
      return get().campaigns.find(c => c.id === id);
    },

    getAdSetsByCampaign: (campaignId: string) => {
      const campaign = get().campaigns.find(c => c.id === campaignId);
      return campaign?.adSets || [];
    },

    getAdSetsByCampaignFromStore: (campaignId: string) => {
      const campaign = get().campaigns.find(c => c.id === campaignId);
      return campaign?.adSets || [];
    },

    updateAdSetInStore: (adSetId: string, updates: Partial<MetaAdSet>) => {
      set(state => ({
        campaigns: state.campaigns.map(campaign => ({
          ...campaign,
          adSets: campaign.adSets?.map(adSet => 
            adSet.id === adSetId ? { ...adSet, ...updates } : adSet
          ) || []
        }))
      }));
    },

    removeAdSetFromStore: (adSetId: string) => {
      set(state => ({
        campaigns: state.campaigns.map(campaign => ({
          ...campaign,
          adSets: campaign.adSets?.filter(adSet => adSet.id !== adSetId) || []
        }))
      }));
    },

    // ===== CAMPAIGN DATA MANAGEMENT =====
    updateCampaignInStore: (campaignId: string, updates: Partial<CampaignWithAdSets>) => {
      set(state => ({
        campaigns: state.campaigns.map(campaign => 
          campaign.id === campaignId ? { ...campaign, ...updates } : campaign
        )
      }));
    },

    removeCampaignFromStore: (campaignId: string) => {
      set(state => ({
        campaigns: state.campaigns.filter(campaign => campaign.id !== campaignId)
      }));
    },

    addCampaignToStore: (campaign: CampaignWithAdSets) => {
      set(state => ({
        campaigns: [...state.campaigns, campaign]
      }));
    },

    getActionState: (id: string) => {
      const actionState = get().actionStates[id];
      return {
        isLoading: actionState?.isLoading || false,
        error: actionState?.error || null
      };
    }
  }))
);
