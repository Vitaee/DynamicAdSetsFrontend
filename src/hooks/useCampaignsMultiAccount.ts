import { useMemo } from 'react';
import { useCampaignsStore } from '../stores/campaigns';

/**
 * Custom hook for managing campaigns with multi-account support
 * Provides filtered data and utilities following DRY principles
 */
export function useCampaignsMultiAccount() {
  const {
    campaigns: allCampaigns,
    selectedAdAccountId,
    adAccounts,
    isLoading,
    metaAccount,
    error,
    getCurrentAccountInfo,
    getCampaignsForAccount,
    setSelectedAdAccount,
    loadCampaignsForAccount,
    accountsLoading
  } = useCampaignsStore();

  // Filtered campaigns for current account
  const filteredCampaigns = useMemo(() => {
    if (!selectedAdAccountId) return allCampaigns;
    return getCampaignsForAccount(selectedAdAccountId);
  }, [allCampaigns, selectedAdAccountId, getCampaignsForAccount]);

  // Current account information
  const currentAccount = getCurrentAccountInfo();

  // Account statistics
  const accountStats = useMemo(() => {
    return adAccounts.map(account => ({
      ...account,
      campaigns: getCampaignsForAccount(account.id),
      activeCampaigns: getCampaignsForAccount(account.id).filter(c => c.status === 'ACTIVE').length,
      totalAdSets: getCampaignsForAccount(account.id).reduce((sum, c) => sum + (c.adSets?.length || 0), 0)
    }));
  }, [adAccounts, getCampaignsForAccount]);

  // Loading states
  const isAccountLoading = currentAccount ? accountsLoading[currentAccount.id] || false : false;
  const hasMultipleAccounts = adAccounts.length > 1;

  // Helper functions
  const switchToAccount = async (accountId: string) => {
    setSelectedAdAccount(accountId);
    try {
      await loadCampaignsForAccount(accountId);
    } catch (error) {
      console.error('Failed to switch account:', error);
      throw error;
    }
  };

  const getAccountSummary = () => {
    if (!hasMultipleAccounts) return null;
    
    return {
      totalAccounts: adAccounts.length,
      activeAccounts: adAccounts.filter(acc => acc.isActive).length,
      totalCampaigns: allCampaigns.length,
      currentAccountCampaigns: filteredCampaigns.length
    };
  };

  // Currency for current account
  const currency = currentAccount?.currency || metaAccount?.adAccounts?.[0]?.currency || 'USD';

  return {
    // Filtered data
    campaigns: filteredCampaigns,
    currentAccount,
    currency,
    
    // Multi-account data
    allAccounts: adAccounts,
    accountStats,
    hasMultipleAccounts,
    
    // Loading states
    isLoading: isLoading || isAccountLoading,
    isAccountLoading,
    
    // Actions
    switchToAccount,
    setSelectedAdAccount,
    
    // Utilities
    getAccountSummary,
    
    // Pass through other needed data
    metaAccount,
    error,
    selectedAdAccountId
  };
}
