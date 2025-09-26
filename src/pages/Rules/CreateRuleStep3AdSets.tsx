/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Checkbox from '../../components/ui/Checkbox';
import StepBadge from '../../components/ui/StepBadge';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNav } from '../../stores/nav';
import { useRuleWizard } from '../../stores/ruleWizard';
import { useCampaignsStore, type AdSetFormData } from '../../stores/campaigns';
import { useNavigate } from 'react-router-dom';
import type { MetaCampaign, MetaAdSet } from '../../api/campaigns';
import { listAutomationRules, type AutomationRule } from '../../api/automation';

type AccountLite = { id: string; name?: string; currency?: string };
type Row = {
  platform: 'meta';
  account: AccountLite;
  campaign: MetaCampaign;
  adSet: MetaAdSet;
  existingRulesCount: number;
};

export default function CreateRuleStep3AdSets() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useNav();
  const { draft, setSelectedAdSets } = useRuleWizard();
  
  // Use selectors to avoid unnecessary re-renders and follow Zustand best practices
  const createAdSet = useCampaignsStore(s => s.createAdSet);
  const deleteAdSet = useCampaignsStore(s => s.deleteAdSet);
  const getActionState = useCampaignsStore(s => s.getActionState);
  const loadCampaigns = useCampaignsStore(s => s.loadCampaigns);
  const isStoreInitialized = useCampaignsStore(s => s.isInitialized);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(draft.selectedAdSets.map(a => a.adSetId)));
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [search, setSearch] = useState('');
  
  // Ad Set Creation/Deletion State
  const [showCreateAdSet, setShowCreateAdSet] = useState(false);
  const [selectedCampaignForAdSet, setSelectedCampaignForAdSet] = useState<{ id: string; name: string; currency?: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adSetToDelete, setAdSetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingAdSet, setIsDeletingAdSet] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automation Rules', href: '/rules' },
      { label: 'Create' },
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    async function load() {
      await reloadData();
    }
    load();
  }, []);

  // Ensure campaigns store is initialized so create/delete operations have
  // access to meta account context and campaign mapping
  useEffect(() => {
    if (!isStoreInitialized) {
      loadCampaigns().catch((err) => console.warn('Campaigns store init failed:', err));
    }
  }, [isStoreInitialized, loadCampaigns]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const f1 = filter === 'all' || r.adSet.status.toLowerCase() === (filter === 'active' ? 'active' : 'paused');
      const f2 = r.adSet.name.toLowerCase().includes(search.toLowerCase()) || r.campaign.name.toLowerCase().includes(search.toLowerCase());
      return f1 && f2;
    });
  }, [rows, filter, search]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.adSet.id));
  const toggleAll = (checked: boolean) => {
    const next = new Set(selected);
    if (checked) filtered.forEach((r) => next.add(r.adSet.id));
    else filtered.forEach((r) => next.delete(r.adSet.id));
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  // Ad Set CRUD Handlers
  const handleCreateAdSet = async (campaignId: string, adSetData: AdSetFormData) => {
    try {
      await createAdSet(campaignId, adSetData);
      setShowCreateAdSet(false);
      setSelectedCampaignForAdSet(null);
      // Reload the rows to get the new ad set
      await reloadData();
    } catch (error) {
      console.error('Ad set creation failed:', error);
    }
  };

  const handleDeleteAdSet = (adSet: MetaAdSet) => {
    setAdSetToDelete({ id: adSet.id, name: adSet.name });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAdSet = async () => {
    if (!adSetToDelete) return;
    
    setIsDeletingAdSet(true);
    try {
      await deleteAdSet(adSetToDelete.id);
      // Remove from selection if it was selected
      const nextSelected = new Set(selected);
      nextSelected.delete(adSetToDelete.id);
      setSelected(nextSelected);
      // Reload the rows to remove the deleted ad set
      await reloadData();
    } catch (error) {
      console.error('Ad set deletion failed:', error);
    } finally {
      setIsDeletingAdSet(false);
      setAdSetToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const openCreateAdSet = (campaign: MetaCampaign, account: AccountLite) => {
    setSelectedCampaignForAdSet({ 
      id: campaign.id, 
      name: campaign.name,
      currency: account.currency || 'USD'
    });
    setShowCreateAdSet(true);
  };

  // Enhanced reload data function with better error handling and campaign-first approach
  const reloadData = async () => {
    setLoading(true);
    try {
      console.log('Loading rules and refreshing campaigns from store...');
      
      // Ensure campaigns store is loaded
      if (!isStoreInitialized) {
        await loadCampaigns();
      }

      const rulesRes = await listAutomationRules({ limit: 100 });

      const rules = (rulesRes?.rules || []) as AutomationRule[];
      const ruleMap = new Map<string, number>();
      for (const r of rules) {
        for (const c of r.campaigns || []) {
          if (c.ad_set_id) ruleMap.set(c.ad_set_id, (ruleMap.get(c.ad_set_id) || 0) + 1);
        }
      }

      const accounts = useCampaignsStore.getState().adAccounts;
      console.log('Found ad accounts in store:', accounts.length);
      
      if (accounts.length === 0) {
        console.warn('No Meta ad accounts found. User may need to connect Meta Ads.');
        setRows([]);
        return;
      }

      const rowsAccum: Row[] = [];
      
      for (const acc of accounts) {
        console.log('Reading campaigns for account from store:', acc.name || acc.id);
        const campaigns = useCampaignsStore.getState().getCampaignsForAccount(acc.id);
        
        try {
          console.log(`Found ${campaigns.length} campaigns for account ${acc.name || acc.id}`);
          
          // Load ad sets for each campaign
          const adsetsPerCampaign = await Promise.all(
            campaigns.map(async (cmp) => {
              try {
                const existing = useCampaignsStore.getState().getAdSetsByCampaignFromStore(cmp.id);
                if (!existing || existing.length === 0) {
                  await useCampaignsStore.getState().loadAdSets(cmp.id);
                }
                const adSetsResult = { adSets: useCampaignsStore.getState().getAdSetsByCampaignFromStore(cmp.id) } as { adSets: MetaAdSet[] };
                console.log(`Campaign "${cmp.name}" has ${adSetsResult.adSets.length} ad sets`);
                return { cmp, adsets: adSetsResult.adSets };
              } catch (error) {
                console.error(`Failed to load ad sets for campaign ${cmp.name}:`, error);
                return { cmp, adsets: [] };
              }
            })
          );
          
          // Create rows for each ad set (if campaign has ad sets)
          for (const { cmp, adsets } of adsetsPerCampaign) {
            if (adsets.length > 0) {
              // Campaign has ad sets - create row for each ad set
              for (const ad of adsets) {
                rowsAccum.push({
                  platform: 'meta',
                  account: { id: acc.id, name: acc.name, currency: acc.currency },
                  campaign: cmp,
                  adSet: ad,
                  existingRulesCount: ruleMap.get(ad.id) || 0,
                });
              }
            } else {
              // Campaign has no ad sets - create a placeholder row to show create option
              // Use a dummy ad set to maintain the same structure
              const dummyAdSet: MetaAdSet = {
                id: `dummy-${cmp.id}`,
                campaign_id: cmp.id,
                name: `No ad sets in ${cmp.name}`,
                status: 'PAUSED',
                daily_budget: '0',
                targeting: { 
                  age_min: 18, 
                  age_max: 65, 
                  genders: [1, 2], 
                  geo_locations: { countries: ['US'] },
                  interests: [] 
                },
                optimization_goal: 'LINK_CLICKS'
              };
              
              rowsAccum.push({
                platform: 'meta',
                account: { id: acc.id, name: acc.name, currency: acc.currency },
                campaign: cmp,
                adSet: dummyAdSet,
                existingRulesCount: 0,
              });
            }
          }
        } catch (accountError) {
          console.error(`Failed to load campaigns for account ${acc.name || acc.id}:`, accountError);
        }
      }
      
      console.log(`Total rows loaded: ${rowsAccum.length}`);
      setRows(rowsAccum);
      
    } catch (e) {
      console.error('Failed to load rule creation data:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const onContinue = () => {
    // Filter out dummy ad sets and only include real selected ad sets
    const picked = rows
      .filter((r) => selected.has(r.adSet.id) && !r.adSet.id.startsWith('dummy-'))
      .map((r) => ({
        platform: 'meta' as const,
        adSetId: r.adSet.id,
        adSetName: r.adSet.name,
        campaignId: r.campaign.id,
        campaignName: r.campaign.name,
        accountId: r.account.id,
      }));
    setSelectedAdSets(picked);
    navigate('/rules/new/weather');
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Select Campaign</h1>
              <p className="mt-1 text-sm text-muted">Select the ad set that aligns with your campaign goals.</p>
            </div>
            <StepBadge step={3} total={6} />
          </div>

          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted">Filter</label>
                <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="wt-input w-36 py-1.5">
                  <option value="all">Show All</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <Input placeholder="Type to Filter" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-64"/>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl ring-1 border-default">
              <table className="w-full text-sm">
                <thead className="bg-surface-hover">
                  <tr>
                    <th className="px-4 py-3 text-left"><Checkbox checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} /></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Automation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Channel</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Existing Rules</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-20 text-center text-subtle">Loading campaigns and ad sets…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-subtle">
                        <div className="space-y-2">
                          <div>No ad sets found</div>
                          <div className="text-xs text-subtle">
                            Make sure you have exists Campaigns.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const isDummyAdSet = r.adSet.id.startsWith('dummy-');
                      
                      return (
                        <tr key={r.adSet.id} className="hover:bg-surface-hover">
                          <td className="px-4 py-3">
                            {!isDummyAdSet ? (
                              <Checkbox checked={selected.has(r.adSet.id)} onChange={(e) => toggleOne(r.adSet.id, e.target.checked)} />
                            ) : (
                              <span className="text-subtle">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {isDummyAdSet ? (
                              <span className="text-subtle italic">No ad sets yet</span>
                            ) : (
                              r.adSet.name
                            )}
                          </td>
                          <td className="px-4 py-3">Facebook</td>
                          <td className="px-4 py-3">
                            {isDummyAdSet ? (
                              <span className="text-subtle">—</span>
                            ) : (
                              r.adSet.optimization_goal || 'Facebook Ads'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isDummyAdSet ? (
                              <Badge variant="muted">No Ad Sets</Badge>
                            ) : r.adSet.status === 'ACTIVE' ? (
                              <Badge variant="success">Enabled</Badge>
                            ) : r.adSet.status === 'PAUSED' ? (
                              <Badge variant="muted">Finished</Badge>
                            ) : (
                              <Badge variant="danger">Error</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground">{r.campaign.name}</td>
                          <td className="px-4 py-3">
                            {isDummyAdSet ? (
                              <span className="text-xs text-subtle">—</span>
                            ) : r.existingRulesCount > 0 ? (
                              <Badge variant="info">{r.existingRulesCount} linked</Badge>
                            ) : (
                              <span className="text-xs text-subtle">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openCreateAdSet(r.campaign, r.account)}
                                className="text-primary hover:opacity-75 text-xs font-medium transition-colors"
                                title="Create new ad set for this campaign"
                              >
                                CREATE AD SET
                              </button>
                              {!isDummyAdSet && (
                                <>
                                  <select 
                                    className="wt-input py-1.5 w-20 text-xs" 
                                    defaultValue="SELECT" 
                                    onChange={(e) => {
                                      const action = e.target.value;
                                      if (action === 'delete') {
                                        handleDeleteAdSet(r.adSet);
                                      }
                                      e.currentTarget.value = 'SELECT';
                                    }}
                                    disabled={getActionState(r.adSet.id)?.isLoading || false}
                                  >
                                    <option value="SELECT">⋯</option>
                                    <option value="view">View</option>
                                    <option value="delete" className="text-red-600">Delete</option>
                                  </select>
                                  {getActionState(r.adSet.id)?.isLoading && (
                                    <Spinner size={16} />
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted">
                <span>{selected.size} selected</span>
                {rows.length > 0 && (
                  <span className="ml-2 text-xs">
                    • {rows.filter(r => !r.adSet.id.startsWith('dummy-')).length} ad sets across {new Set(rows.map(r => r.campaign.id)).size} campaigns
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={reloadData} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/rules/new/type')}>Back</Button>
                <Button variant="ghost" onClick={() => navigate('/rules')}>Cancel</Button>
                <Button onClick={onContinue} disabled={selected.size === 0}>Continue</Button>
              </div>
            </div>
          </Card>

          {/* Create Ad Set Modal */}
          {showCreateAdSet && selectedCampaignForAdSet && (
            <CreateAdSetModal
              campaignId={selectedCampaignForAdSet.id}
              campaignName={selectedCampaignForAdSet.name}
              currency={selectedCampaignForAdSet.currency || 'USD'}
              onClose={() => {
                setShowCreateAdSet(false);
                setSelectedCampaignForAdSet(null);
              }}
              onSubmit={handleCreateAdSet}
            />
          )}

          {/* Delete Ad Set Confirmation Modal */}
          <ConfirmationModal
            open={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setAdSetToDelete(null);
            }}
            onConfirm={confirmDeleteAdSet}
            title="Delete Ad Set"
            message={`Are you sure you want to delete ad set "${adSetToDelete?.name || 'Unknown'}"? This action cannot be undone and will remove it from any existing automation rules.`}
            confirmText="Delete Ad Set"
            cancelText="Cancel"
            destructive={true}
            loading={isDeletingAdSet}
          />
        </div>
      </div>
    </AppLayout>
  );
}

// Create Ad Set Modal Component (reused from CampaignsTable pattern)
function CreateAdSetModal({ 
  campaignId, 
  campaignName,
  currency = 'USD',
  onClose, 
  onSubmit 
}: { 
  campaignId: string;
  campaignName: string;
  currency?: string;
  onClose: () => void; 
  onSubmit: (campaignId: string, data: AdSetFormData) => Promise<void>; 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AdSetFormData>({
    name: '',
    daily_budget: '90',
    targeting: {
      age_min: 18,
      age_max: 65,
      genders: [1, 2], // All genders
      geo_locations: {
        countries: ['US']  // ← Fixed: Meta requires location targeting
      },
      interests: []
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(campaignId, formData);
      onClose();
    } catch (error) {
      console.error('Ad set creation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create Ad Set</h2>
        <p className="text-sm text-muted mb-6">
          Creating ad set for campaign: <strong>{campaignName}</strong>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ad Set Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter ad set name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Daily Budget ({currency})</label>
            <Input
              type="number"
              min="1"
              value={formData.daily_budget}
              onChange={(e) => setFormData(prev => ({ ...prev, daily_budget: e.target.value }))}
              placeholder="10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Location</label>
            <select
              value={formData.targeting.geo_locations?.countries?.[0] || 'US'}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                targeting: { 
                  ...prev.targeting, 
                  geo_locations: { countries: [e.target.value] }
                }
              }))}
              className="wt-input"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="ES">Spain</option>
              <option value="IT">Italy</option>
              <option value="NL">Netherlands</option>
              <option value="BR">Brazil</option>
              <option value="MX">Mexico</option>
              <option value="IN">India</option>
              <option value="JP">Japan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Age Range</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="13"
                max="65"
                value={(formData.targeting.age_min || 18).toString()}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  targeting: { ...prev.targeting, age_min: parseInt(e.target.value) || 18 }
                }))}
                className="w-20"
              />
              <span className="text-sm text-gray-500">to</span>
              <Input
                type="number"
                min="13"
                max="65"
                value={(formData.targeting.age_max || 65).toString()}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  targeting: { ...prev.targeting, age_max: parseInt(e.target.value) || 65 }
                }))}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? (
                <>
                  <Spinner size={16} />
                  Creating...
                </>
              ) : (
                'Create Ad Set'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
