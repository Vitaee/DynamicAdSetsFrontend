/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNav } from '../../stores/nav';
import AppLayout from '../../components/layout/AppLayout';
import CampaignsTable from '../../components/campaigns/CampaignsTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { getGoogleCampaigns, googleCampaignAction } from '../../api/campaigns';
import type { GoogleCampaign, MetaTargeting, MetaAdSet } from '../../api/campaigns';
import Spinner from '../../components/ui/Spinner';

interface AdSetFormData {
  name: string;
  daily_budget: string;
  targeting: MetaTargeting;
}

interface CampaignFormData {
  name: string;
  type: string;
  budget: string;
}

type GoogleCampaignWithAdSets = GoogleCampaign & {
  adSets?: MetaAdSet[];
  platform: 'meta' | 'google';
  automation?: string;
  channel: string;
  type: string;
  objective: string; // Added to satisfy MetaCampaign requirement
};

export default function GoogleCampaigns() {
  const { setBreadcrumbs } = useNav();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<GoogleCampaignWithAdSets[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Campaigns', href: '/campaigns/google' },
      { label: 'Google Ads' }
    ]);
  }, [setBreadcrumbs]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load Google campaigns (this is mocked in the API)
      // Using a default customer ID for now
      const customerId = 'default-customer-id';
      const campaignsResponse = await getGoogleCampaigns(customerId);
      
      if (campaignsResponse.campaigns.length === 0) {
        setIsConnected(false);
        setCampaigns([]);
        return;
      }

      setIsConnected(true);
      
      const campaignsWithMeta = campaignsResponse.campaigns.map(campaign => ({
        ...campaign,
        platform: 'google' as const,
        automation: undefined, // Will be populated when automation rules are connected
        channel: 'Google',
        type: getAdTypeFromType(campaign.type),
        objective: campaign.type // Use type as objective for compatibility
      }));
      
      setCampaigns(campaignsWithMeta);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load campaigns');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getAdTypeFromType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'search':
        return 'Search Ad';
      case 'display':
        return 'Display Ad';
      case 'shopping':
        return 'Shopping Ad';
      case 'video':
        return 'Video Ad';
      case 'smart':
        return 'Smart Campaign';
      default:
        return 'Google Ad';
    }
  };

  const handleCampaignAction = async (campaignId: string, action: 'pause' | 'resume') => {
    try {
      await googleCampaignAction(campaignId, action);
      // Refresh campaigns to get updated status
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update campaign');
    }
  };

  const handleCreateAdSet = async (_campaignId: string, _adSetData: AdSetFormData) => {
    try {
      // Google Ads uses Ad Groups instead of Ad Sets
      // This would require a separate API implementation
      
      // For now, just refresh campaigns
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create ad group');
    }
  };

  const handleCreateCampaign = async (_campaignData: CampaignFormData) => {
    try {
      // This would create a Google Ads campaign
      
      setShowCreateCampaign(false);
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  };

  const connectGoogleAds = () => {
    // Implement Google OAuth flow
    window.location.href = '/onboarding/connect-google-ads';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="container-narrow">
            <div className="flex items-center justify-center h-64">
              <Spinner />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isConnected) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="container-narrow space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Google Ads Campaigns</h1>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">
                  Manage your Google Ads campaigns with weather-based automation
                </p>
              </div>
              <Button onClick={connectGoogleAds}>Connect Google Ads</Button>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Connect Google Ads Account</h3>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-400 mb-4">
                Connect your Google Ads account to start managing campaigns with weather-based automation. Once connected, you can create campaigns and ad groups directly from this interface.
              </p>
              <Button onClick={connectGoogleAds}>
                Connect Google Ads Account
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
            <div>
              <h1 className="text-2xl font-semibold">Google Ads Campaigns</h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">
                Manage your Google Ads campaigns with weather-based automation
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={loadData}>
                Refresh
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateCampaign(true)}>
                Create Campaign
              </Button>
              <Button onClick={connectGoogleAds}>Reconnect Account</Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <CampaignsTable
            campaigns={campaigns}
            loading={loading}
            onCampaignAction={handleCampaignAction}
            onCreateAdSet={handleCreateAdSet}
            onRefresh={loadData}
          />

          <CreateGoogleCampaignModal
            open={showCreateCampaign}
            onClose={() => setShowCreateCampaign(false)}
            onSubmit={handleCreateCampaign}
          />
        </div>
      </div>
    </AppLayout>
  );
}

// Google Campaign Creation Modal Component
function CreateGoogleCampaignModal({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CampaignFormData) => void;
}) {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: 'SEARCH',
    budget: '10'
  });

  const campaignTypes = [
    { value: 'SEARCH', label: 'Search' },
    { value: 'DISPLAY', label: 'Display' },
    { value: 'SHOPPING', label: 'Shopping' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'SMART', label: 'Smart Campaign' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
    setFormData({ name: '', type: 'SEARCH', budget: '10' });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Google Campaign</h2>
        
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
            <label className="block text-sm font-medium mb-1">Campaign Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {campaignTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Daily Budget (USD)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="10"
              min="1"
              step="0.01"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}