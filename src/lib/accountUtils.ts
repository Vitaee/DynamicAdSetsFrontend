import type { MetaAccountInfo, CampaignWithAdSets } from '../stores/campaigns';

/**
 * Utility functions for managing multiple Meta ad accounts
 * Following DRY principles for reusable account management logic
 */

export interface AccountSummary {
  totalAccounts: number;
  activeAccounts: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalAdSets: number;
  currencies: string[];
}

export interface AccountWithStats extends MetaAccountInfo {
  campaigns: CampaignWithAdSets[];
  activeCampaigns: number;
  pausedCampaigns: number;
  totalAdSets: number;
  activeAdSets: number;
}

/**
 * Generate summary statistics for all accounts
 */
export function generateAccountSummary(
  accounts: MetaAccountInfo[],
  campaigns: CampaignWithAdSets[]
): AccountSummary {
  const accountCampaigns = campaigns.filter(c => c.adAccountId);
  const activeCampaigns = accountCampaigns.filter(c => c.status === 'ACTIVE');
  const totalAdSets = accountCampaigns.reduce((sum, c) => sum + (c.adSets?.length || 0), 0);
  const currencies = [...new Set(accounts.map(acc => acc.currency).filter(Boolean))] as string[];

  return {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(acc => acc.isActive).length,
    totalCampaigns: accountCampaigns.length,
    activeCampaigns: activeCampaigns.length,
    totalAdSets,
    currencies
  };
}

/**
 * Enrich account data with campaign statistics
 */
export function enrichAccountsWithStats(
  accounts: MetaAccountInfo[],
  campaigns: CampaignWithAdSets[]
): AccountWithStats[] {
  return accounts.map(account => {
    const accountCampaigns = campaigns.filter(c => c.adAccountId === account.id);
    const activeCampaigns = accountCampaigns.filter(c => c.status === 'ACTIVE').length;
    const pausedCampaigns = accountCampaigns.filter(c => c.status === 'PAUSED').length;
    const totalAdSets = accountCampaigns.reduce((sum, c) => sum + (c.adSets?.length || 0), 0);
    const activeAdSets = accountCampaigns.reduce((sum, c) => 
      sum + (c.adSets?.filter(as => as.status === 'ACTIVE').length || 0), 0
    );

    return {
      ...account,
      campaigns: accountCampaigns,
      activeCampaigns,
      pausedCampaigns,
      totalAdSets,
      activeAdSets
    };
  });
}

/**
 * Find account by ID with fallback
 */
export function findAccountById(
  accounts: MetaAccountInfo[],
  accountId: string | null
): MetaAccountInfo | null {
  if (!accountId) return null;
  return accounts.find(acc => acc.id === accountId) || null;
}

/**
 * Get default account selection (first active account, then first account)
 */
export function getDefaultAccountId(accounts: MetaAccountInfo[]): string | null {
  if (accounts.length === 0) return null;
  
  // Prefer first active account
  const activeAccount = accounts.find(acc => acc.isActive);
  if (activeAccount) return activeAccount.id;
  
  // Fallback to first account
  return accounts[0].id;
}

/**
 * Validate if account can perform operations
 */
export function canAccountPerformOperations(account: MetaAccountInfo | null): boolean {
  return !!(account && account.isActive);
}

/**
 * Format account display name
 */
export function formatAccountDisplayName(account: MetaAccountInfo): string {
  const name = account.name || `Account ${account.id}`;
  const suffix = account.currency ? ` (${account.currency})` : '';
  return `${name}${suffix}`;
}

/**
 * Sort accounts by preference (active first, then by campaign count, then by name)
 */
export function sortAccountsByPreference(accounts: AccountWithStats[]): AccountWithStats[] {
  return [...accounts].sort((a, b) => {
    // Active accounts first
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    
    // Then by campaign count (descending)
    if (a.campaigns.length !== b.campaigns.length) {
      return b.campaigns.length - a.campaigns.length;
    }
    
    // Finally by name
    return (a.name || a.id).localeCompare(b.name || b.id);
  });
}

/**
 * Filter campaigns by search term across account and campaign data
 */
export function filterCampaignsBySearch(
  campaigns: CampaignWithAdSets[],
  searchTerm: string
): CampaignWithAdSets[] {
  if (!searchTerm.trim()) return campaigns;
  
  const term = searchTerm.toLowerCase();
  return campaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(term) ||
    campaign.adAccountName?.toLowerCase().includes(term) ||
    campaign.id.toLowerCase().includes(term) ||
    campaign.type.toLowerCase().includes(term)
  );
}

/**
 * Group campaigns by account for easier display
 */
export function groupCampaignsByAccount(
  campaigns: CampaignWithAdSets[]
): Record<string, CampaignWithAdSets[]> {
  const grouped: Record<string, CampaignWithAdSets[]> = {};
  
  campaigns.forEach(campaign => {
    const accountId = campaign.adAccountId || 'unknown';
    if (!grouped[accountId]) {
      grouped[accountId] = [];
    }
    grouped[accountId].push(campaign);
  });
  
  return grouped;
}
