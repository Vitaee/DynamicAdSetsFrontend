/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import type { MetaCampaign, MetaAdSet, MetaTargeting, GoogleCampaign } from '../../api/campaigns';
import { useCampaignsStore } from '../../stores/campaigns';
import { toast } from '../../stores/ui';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import ConfirmationModal from '../ui/ConfirmationModal';
import Badge from '../ui/Badge';

type CampaignWithAdSets = (MetaCampaign | GoogleCampaign) & {
  adSets?: MetaAdSet[];
  platform: 'meta' | 'google';
  automation?: string;
  channel: string;
  type: string;
  objective?: string; // Optional for compatibility
};

type AdSetFormData = {
  name: string;
  daily_budget: string;
  targeting: MetaTargeting;
};

type Props = {
  campaigns: CampaignWithAdSets[];
  loading: boolean;
  currency?: string;
  onCampaignAction: (campaignId: string, action: 'pause' | 'resume') => Promise<void>;
  onCampaignDelete?: (campaignId: string) => Promise<void>;
  onAdSetAction?: (adSetId: string, action: 'pause' | 'resume') => Promise<void>;
  onCreateAdSet: (campaignId: string, adSetData: AdSetFormData) => Promise<void>;
  onRefresh: () => Promise<void>;
  getActionState?: (id: string) => { isLoading: boolean; error: string | null };
};

export default function CampaignsTable({ 
  campaigns, 
  loading, 
  currency = 'USD', 
  onCampaignAction,
  onCampaignDelete,
  onAdSetAction,
  onCreateAdSet, 
  onRefresh,
  getActionState 
}: Props) {
  // Use store for ad sets data management
  const { 
    loadAdSets, 
    getAdSetsByCampaignFromStore, 
    deleteAdSet: deleteAdSetFromStore,
    getActionState: getStoreActionState 
  } = useCampaignsStore();
  
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [showCreateAdSet, setShowCreateAdSet] = useState(false);
  const [selectedCampaignForAdSet, setSelectedCampaignForAdSet] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adSetToDelete, setAdSetToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCampaignDeleteConfirm, setShowCampaignDeleteConfirm] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [isDeletingCampaign, setIsDeletingCampaign] = useState(false);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedCampaigns(new Set(filteredCampaigns.map(c => c.id)));
    } else {
      setSelectedCampaigns(new Set());
    }
  };

  const handleSelectCampaign = (campaignId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const newSelection = new Set(selectedCampaigns);
    if (checked) {
      newSelection.add(campaignId);
    } else {
      newSelection.delete(campaignId);
    }
    setSelectedCampaigns(newSelection);
  };

  // Ad Set Management Functions
  const toggleCampaignExpansion = async (campaignId: string) => {
    const isExpanded = expandedCampaigns.has(campaignId);
    const newExpanded = new Set(expandedCampaigns);
    
    if (isExpanded) {
      newExpanded.delete(campaignId);
    } else {
      newExpanded.add(campaignId);
      
      // Load ad sets from store if not already loaded
      const currentAdSets = getAdSetsByCampaignFromStore(campaignId);
      const loadingKey = `load-adsets-${campaignId}`;
      const loadingState = getStoreActionState(loadingKey);
      
      if (currentAdSets.length === 0 && !loadingState.isLoading) {
        try {
          const response = await loadAdSets(campaignId);
          
          // Show success toast for ad sets loading
          const adSetCount = response.length;
          if (adSetCount > 0) {
            toast.success(
              `Loaded ${adSetCount} ad set${adSetCount === 1 ? '' : 's'} successfully`,
              'Ad Sets Loaded'
            );
          }
        } catch (error) {
          toast.error(
            'Failed to load ad sets. Please try again.',
            'Loading Error'
          );
          // Still expand to show empty state
        }
      }
    }
    
    setExpandedCampaigns(newExpanded);
  };

  const handleAdSetAction = async (adSetId: string, action: 'pause' | 'resume') => {
    if (!onAdSetAction) {
      console.warn('onAdSetAction not provided');
      return;
    }
    
    try {
      await onAdSetAction(adSetId, action);
      // Success handling is done in the store with optimistic updates!
    } catch (error) {
      // Error handling is done in the store
      console.error('Ad set action failed:', error);
    }
  };

  const handleDeleteAdSet = (adSetId: string) => {
    setAdSetToDelete(adSetId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setShowCampaignDeleteConfirm(true);
  };

  const confirmDeleteAdSet = async () => {
    if (!adSetToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteAdSetFromStore(adSetToDelete);
      // Success handling is done in the store with optimistic updates and toasts!
    } catch (error) {
      // Error handling is done in the store
      console.error('Ad set deletion failed:', error);
    } finally {
      setIsDeleting(false);
      setAdSetToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete || !onCampaignDelete) return;
    
    setIsDeletingCampaign(true);
    try {
      await onCampaignDelete(campaignToDelete);
      // Success handling is done in the store with optimistic updates and toasts!
    } catch (error) {
      // Error handling is done in the store
      console.error('Campaign deletion failed:', error);
    } finally {
      setIsDeletingCampaign(false);
      setCampaignToDelete(null);
      setShowCampaignDeleteConfirm(false);
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'enabled':
        return 'success';
      case 'paused':
        return 'warning';
      case 'archived':
      case 'removed':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const openCreateAdSet = (campaignId: string) => {
    setSelectedCampaignForAdSet(campaignId);
    setShowCreateAdSet(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Campaign</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select the ad set that aligns with your campaign goals.
          </p>
        </div>
        
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Show All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          
          <div className="relative">
            <Input
              placeholder="Type to Filter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <Button onClick={onRefresh} variant="ghost">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-elevated border border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-default">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedCampaigns.size === filteredCampaigns.length && filteredCampaigns.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                  Campaign
                  <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                  Automation
                  <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                  Channel
                  <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                  Type
                  <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y border-default">
              {filteredCampaigns.map((campaign) => (
                <>
                  {/* Campaign Row */}
                  <tr key={campaign.id} className="hover:bg-surface-hover">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedCampaigns.has(campaign.id)}
                          onChange={handleSelectCampaign(campaign.id)}
                        />
                        <button
                          onClick={() => toggleCampaignExpansion(campaign.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title={expandedCampaigns.has(campaign.id) ? 'Collapse ad sets' : 'Expand ad sets'}
                        >
                          <svg 
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedCampaigns.has(campaign.id) ? 'rotate-90' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <span>{campaign.name}</span>
                        {(() => {
                          const adSets = getAdSetsByCampaignFromStore(campaign.id);
                          return adSets.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                              {adSets.length} ad sets
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted">
                      {campaign.automation || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted">
                      {campaign.channel}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted">
                      {campaign.type}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {campaign.status === 'ACTIVE' ? 'Enabled' : 
                         campaign.status === 'PAUSED' ? 'Paused' :
                         campaign.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openCreateAdSet(campaign.id)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          CREATE AD SET
                        </button>
                        <select
                          defaultValue="SELECT"
                          onChange={async (e) => {
                            const action = e.target.value;
                            if (action === 'pause' || action === 'resume') {
                              try {
                                await onCampaignAction(campaign.id, action);
                              } catch (error) {
                                console.error('Campaign action failed:', error);
                              }
                            } else if (action === 'delete' && onCampaignDelete) {
                              handleDeleteCampaign(campaign.id);
                            }
                            e.target.value = 'SELECT';
                          }}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          disabled={getActionState?.(campaign.id).isLoading}
                        >
                          <option value="SELECT">Actions</option>
                          <option value="pause">Pause</option>
                          <option value="resume">Resume</option>
                          {onCampaignDelete && (
                            <option value="delete" className="text-red-600">Delete</option>
                          )}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* Ad Sets Expanded Section */}
                  {expandedCampaigns.has(campaign.id) && (
                    <tr>
                      <td colSpan={7} className="px-0 py-0">
                        <div className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
                          {(() => {
                            const loadingKey = `load-adsets-${campaign.id}`;
                            const loadingState = getStoreActionState(loadingKey);
                            const adSets = getAdSetsByCampaignFromStore(campaign.id);
                            
                            if (loadingState.isLoading) {
                              return (
                                <div className="flex items-center justify-center py-8">
                                  <Spinner />
                                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading ad sets...</span>
                                </div>
                              );
                            }
                            
                            return (
                              <AdSetsTable 
                                adSets={adSets}
                                currency={currency}
                                onAdSetAction={handleAdSetAction}
                                onDeleteAdSet={handleDeleteAdSet}
                                onCreateAdSet={() => openCreateAdSet(campaign.id)}
                                getActionState={getActionState || getStoreActionState}
                              />
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCampaigns.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No campaigns found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {campaigns.length === 0 
              ? "Get started by creating your first campaign with weather-based automation."
              : "No campaigns match your current filter criteria. Try adjusting your search or filter settings."
            }
          </p>
          {campaigns.length === 0 && (
            <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
              <div>💡 Tip: Use the "Create Campaign" button above to create your first campaign, then create ad sets within it.</div>
              
            </div>
          )}
        </div>
      )}

      {/* Create Ad Set Modal */}
      {showCreateAdSet && (
        <CreateAdSetModal
          campaignId={selectedCampaignForAdSet!}
          currency={currency}
          onClose={() => setShowCreateAdSet(false)}
          onSubmit={onCreateAdSet}
        />
      )}

      {/* Delete Ad Set Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAdSet}
        title="Delete Ad Set"
        message="Are you sure you want to delete this ad set? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        loading={isDeleting}
      />

      {/* Delete Campaign Confirmation Modal */}
      <ConfirmationModal
        open={showCampaignDeleteConfirm}
        onClose={() => setShowCampaignDeleteConfirm(false)}
        onConfirm={confirmDeleteCampaign}
        title="Delete Campaign"
        message={(() => {
          const campaign = campaigns.find(c => c.id === campaignToDelete);
          const adSetCount = campaign?.adSets?.length || 0;
          return `Are you sure you want to delete campaign "${campaign?.name || 'Unknown'}"? ${
            adSetCount > 0 
              ? `This will also delete ${adSetCount} ad set${adSetCount === 1 ? '' : 's'}. ` 
              : ''
          }This action cannot be undone.`;
        })()}
        confirmText="Delete Campaign"
        cancelText="Cancel"
        destructive={true}
        loading={isDeletingCampaign}
      />
    </div>
  );
}

// Ad Sets Sub-table Component
function AdSetsTable({ 
  adSets, 
  currency,
  onAdSetAction, 
  onDeleteAdSet, 
  onCreateAdSet,
  getActionState 
}: {
  adSets: MetaAdSet[];
  currency: string;
  onAdSetAction: (adSetId: string, action: 'pause' | 'resume') => void;
  onDeleteAdSet: (adSetId: string) => void;
  onCreateAdSet: () => void;
  getActionState?: (id: string) => { isLoading: boolean; error: string | null };
}) {
  const getAdSetStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case 'paused':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
      case 'archived':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  const formatBudget = (budget: string | undefined, currency: string) => {
    if (!budget) return '-';
    const value = parseFloat(budget) / 100; // Convert from cents
    return `${value.toFixed(2)} ${currency}`;
  };

  if (adSets.length === 0) {
    return (
      <div className="py-8 px-6 text-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No ad sets yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create your first ad set to start delivering ads for this campaign.
          </p>
          <button
            onClick={onCreateAdSet}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Ad Set
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Ad Sets ({adSets.length})
        </h4>
        <button
          onClick={onCreateAdSet}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Ad Set
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/20">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ad Set Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Daily Budget
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {adSets.map((adSet) => (
              <tr key={adSet.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{adSet.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {formatBudget(adSet.daily_budget, currency)}
                </td>
                <td className="px-4 py-3">
                  <span className={getAdSetStatusBadge(adSet.status)}>
                    {adSet.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getActionState?.(adSet.id)?.isLoading ? (
                      <div className="flex items-center gap-1">
                        <Spinner size={12} />
                        <span className="text-xs text-muted">Processing...</span>
                      </div>
                    ) : (
                      <select
                        defaultValue="SELECT"
                        onChange={(e) => {
                          if (e.target.value === 'pause') onAdSetAction(adSet.id, 'pause');
                          if (e.target.value === 'resume') onAdSetAction(adSet.id, 'resume');
                          if (e.target.value === 'delete') onDeleteAdSet(adSet.id);
                          e.target.value = 'SELECT';
                        }}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        disabled={getActionState?.(adSet.id)?.isLoading}
                      >
                        <option value="SELECT">Actions</option>
                        <option value="pause">Pause</option>
                        <option value="resume">Resume</option>
                        <option value="delete">Delete</option>
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Create Ad Set Modal Component
function CreateAdSetModal({ 
  campaignId, 
  currency = 'USD',
  onClose, 
  onSubmit 
}: { 
  campaignId: string;
  currency?: string;
  onClose: () => void; 
  onSubmit: (campaignId: string, data: AdSetFormData) => Promise<void>; 
}) {
  // Set default budget based on currency
  const getDefaultBudget = (curr: string) => {
    switch (curr) {
      case 'RUB': return '100'; // 100 RUB (above minimum of 81.85)
      case 'EUR': return '5';   // 5 EUR
      case 'GBP': return '5';   // 5 GBP
      default: return '10';     // 10 USD
    }
  };

  const [formData, setFormData] = useState<AdSetFormData>({
    name: '',
    daily_budget: getDefaultBudget(currency),
    targeting: {
      age_min: 18,
      age_max: 65,
      genders: [1, 2], // All genders
      geo_locations: {
        countries: ['US']
      }
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(campaignId, formData);
      onClose();
    } catch (error) {
      // Error is handled in the store/parent component
      console.error('Ad set creation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Create Ad Set
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ad Set Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter ad set name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Daily Budget ({currency})
            </label>
            <Input
              type="number"
              value={formData.daily_budget}
              onChange={(e) => setFormData({...formData, daily_budget: e.target.value})}
              placeholder={getDefaultBudget(currency)}
              min={currency === 'RUB' ? '85' : '1'}
              step="0.01"
              required
            />
            {currency === 'RUB' && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum budget: 85 RUB
              </p>
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ad Set'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}