import { useState, useEffect } from 'react';
import { useNav } from '../../stores/nav';
import { useAuth } from '../../stores/auth';
import { useCampaignsStore, type AdSetFormData, type CampaignFormData } from '../../stores/campaigns';
import { useCampaignsMultiAccount } from '../../hooks/useCampaignsMultiAccount';
import AppLayout from '../../components/layout/AppLayout';
import CampaignsTable from '../../components/campaigns/CampaignsTable';
import AccountSwitcher from '../../components/campaigns/AccountSwitcher';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function MetaCampaigns() {
  const { setBreadcrumbs } = useNav();
  const { user, status } = useAuth();
  
  // Enhanced multi-account support
  const {
    campaigns,
    currentAccount,
    currency,
    allAccounts,
    hasMultipleAccounts,
    isLoading,
    metaAccount,
    error,
    getAccountSummary
  } = useCampaignsMultiAccount();

  const { 
    loadCampaigns, 
    refreshCampaigns,
    forceRefresh,
    updateCampaignStatus,
    createCampaign,
    createAdSet,
    updateAdSetStatus,
    deleteCampaign,
    getActionState,
    clearError 
  } = useCampaignsStore();
  
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [hasTriedToLoad, setHasTriedToLoad] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Campaigns', href: '/campaigns/meta' },
      { label: 'Meta Ads' }
    ]);
  }, [setBreadcrumbs]);

  // Load campaigns once when component mounts and user is available
  useEffect(() => {
    
    // Only try to load if:
    // 1. User is authenticated
    // 2. Auth status is 'authenticated' (not 'loading')
    // 3. We haven't tried to load yet
    // 4. Not currently loading
    if (user && status === 'authenticated' && !hasTriedToLoad && !isLoading) {
      setHasTriedToLoad(true);
      loadCampaigns().then(() => {
      }).catch(() => {
        setHasTriedToLoad(false); // Allow retry
      });
    }
  }, [user, status, hasTriedToLoad, isLoading, loadCampaigns]);

  const handleCreateAdSet = async (campaignId: string, adSetData: AdSetFormData) => {
    try {
      await createAdSet(campaignId, adSetData);
      // No need for manual refresh - optimistic updates handle this!
    } catch (error) {
      // Error handling is done in the store
      console.error('Ad set creation failed:', error);
    }
  };

  const handleCreateCampaign = async (campaignData: CampaignFormData) => {
    if (!currentAccount) {
      console.error('No ad account selected for campaign creation');
      return;
    }
    
    try {
      await createCampaign(campaignData);
      setShowCreateCampaign(false);
      // Campaign appears instantly due to optimistic updates with account context!
    } catch (error) {
      // Error handling is done in the store with proper rollback
      console.error('Campaign creation failed:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteCampaign(campaignId);
      // Campaign disappears instantly due to optimistic updates with rollback on error!
    } catch (error) {
      // Error handling is done in the store with proper rollback
      console.error('Campaign deletion failed:', error);
    }
  };

  const connectMetaAds = () => {
    window.location.href = '/onboarding/connect-ads';
  };

  // Show loading if auth is still loading
  if (status === 'loading') {
    return (
      <AppLayout>
        <LoadingState 
          variant="campaigns" 
          message="Authenticating..." 
        />
      </AppLayout>
    );
  }

  // If not authenticated, redirect or show login
  if (status !== 'authenticated' || !user) {
    console.log('User not authenticated:', { status, user: !!user });
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to view your campaigns.</p>
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Early return for loading state
  if (isLoading) {
    console.log('Rendering loading state:', { isLoading, user: !!user, campaignsCount: campaigns.length });
    return (
      <AppLayout>
        <LoadingState 
          variant="campaigns" 
          message="Loading Meta campaigns and account information..." 
        />
      </AppLayout>
    );
  }


  // Early return for error state
  if (error) {
    const errorObj = {
      type: 'network' as const,
      message: error,
      title: 'Failed to Load Campaigns',
      actionable: true,
      actionLabel: 'Retry'
    };
    
    return (
      <AppLayout>
        <ErrorState 
          error={errorObj}
          onRetry={refreshCampaigns}
          onDismiss={clearError}
        />
      </AppLayout>
    );
  }

  // No Meta account connected
  if (!metaAccount) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="container-narrow space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Meta Ads Campaigns</h1>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">
                  Manage your Facebook and Instagram advertising campaigns
                </p>
              </div>
              <Button onClick={connectMetaAds}>Connect Meta Ads</Button>
            </div>

            <div className="bg-surface-elevated border border-default rounded-lg p-8 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Connect Meta Ads Account</h3>
              <p className="mt-1 text-sm text-muted mb-4">
                Connect your Meta Ads account to start managing campaigns with weather-based automation.
              </p>
              <Button onClick={connectMetaAds}>
                Connect Meta Ads Account
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-2xl font-semibold">Meta Ads Campaigns</h1>
                {hasMultipleAccounts && (
                  <Badge variant="info" size="sm">
                    {allAccounts.length} Accounts Connected
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted">
                  {metaAccount?.name && `Connected as ${metaAccount.name}`}
                  {hasMultipleAccounts && currentAccount && (
                    <span> • Viewing: {currentAccount.name}</span>
                  )}
                </p>
                
                {/* Account Summary */}
                {(() => {
                  const summary = getAccountSummary();
                  return summary && (
                    <div className="text-xs text-muted">
                      {summary.currentAccountCampaigns} of {summary.totalCampaigns} campaigns
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Account Switcher */}
              {hasMultipleAccounts && (
                <AccountSwitcher />
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={forceRefresh}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCreateCampaign(true)}
                  disabled={!currentAccount}
                  size="sm"
                >
                  Create Campaign
                </Button>
                
                <Button onClick={connectMetaAds} size="sm">
                  Manage Accounts
                </Button>
              </div>
            </div>
          </div>

          {/* Account Context Info */}
          {hasMultipleAccounts && currentAccount && (
            <div className="bg-surface-elevated border border-default rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">{currentAccount.name}</h3>
                    <p className="text-sm text-muted">
                      {currentAccount.campaignCount || 0} campaigns • {currentAccount.currency}
                    </p>
                  </div>
                  {!currentAccount.isActive && (
                    <Badge variant="warning">Account Inactive</Badge>
                  )}
                </div>
                
                <div className="text-right text-sm text-muted">
                  <div>Account ID: {currentAccount.id}</div>
                </div>
              </div>
            </div>
          )}

          <CampaignsTable
            campaigns={campaigns}
            loading={isLoading}
            currency={currency}
            onCampaignAction={updateCampaignStatus}
            onCampaignDelete={handleDeleteCampaign}
            onAdSetAction={updateAdSetStatus}
            onCreateAdSet={handleCreateAdSet}
            onRefresh={forceRefresh}
            getActionState={getActionState}
          />

          <CreateCampaignModal
            open={showCreateCampaign}
            onClose={() => setShowCreateCampaign(false)}
            onSubmit={handleCreateCampaign}
          />
        </div>
      </div>
    </AppLayout>
  );
}

// Campaign Creation Modal Component
function CreateCampaignModal({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CampaignFormData) => void;
}) {
  const { currentAccount } = useCampaignsMultiAccount();
  const [formData, setFormData] = useState({
    name: '',
    objective: 'OUTCOME_TRAFFIC'  // Default to a valid objective
  });

  // Updated objectives to match Meta's current API requirements
  // Valid objectives: OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_ENGAGEMENT, OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_APP_PROMOTION
  const objectives = [
    { value: 'OUTCOME_TRAFFIC', label: 'Traffic' },
    { value: 'OUTCOME_SALES', label: 'Sales & Conversions' },
    { value: 'OUTCOME_LEADS', label: 'Lead Generation' },
    { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
    { value: 'OUTCOME_AWARENESS', label: 'Brand Awareness' },
    { value: 'OUTCOME_APP_PROMOTION', label: 'App Promotion' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
    setFormData({ name: '', objective: 'REACH' });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Create New Campaign</h2>
          {currentAccount && (
            <p className="text-sm text-muted mt-1">
              Campaign will be created in: <span className="font-medium">{currentAccount.name}</span> ({currentAccount.currency})
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Campaign Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Campaign Objective</label>
            <select
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {objectives.map((obj) => (
                <option key={obj.value} value={obj.value}>
                  {obj.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!currentAccount}>
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}