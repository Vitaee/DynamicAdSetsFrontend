import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNav } from '../../stores/nav';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { toast } from '../../stores/ui';
import { 
  getAutomationRule, 
  updateAutomationRule, 
  toggleAutomationRule,
  deleteAutomationRule,
  type AutomationRuleDetail,
  type UpdateRuleBody 
} from '../../api/automation';

export default function RuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useNav();
  
  const [rule, setRule] = useState<AutomationRuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Removed unused state - can be added later if needed for ad set name resolution
  // const [resolvedAdSets, setResolvedAdSets] = useState<Record<string, { name: string; campaign_name?: string }>>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    check_interval_minutes: 60
  });

  useEffect(() => {
    if (!id) {
      navigate('/rules');
      return;
    }

    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automation Rules', href: '/rules' },
      { label: 'Rule Details' }
    ]);

    loadRule();
  }, [id, setBreadcrumbs, navigate]);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        is_active: rule.is_active ?? true,
        check_interval_minutes: rule.check_interval_minutes || 60
      });
    }
  }, [rule]);

  const loadRule = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getAutomationRule(id);
      setRule(response.rule);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load rule';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !rule) return;

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Rule name is required');
      return;
    }

    if (formData.check_interval_minutes < 5 || formData.check_interval_minutes > 1440) {
      toast.error('Check interval must be between 5 and 1440 minutes');
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData: UpdateRuleBody = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_active: formData.is_active,
        check_interval_minutes: formData.check_interval_minutes
      };

      const response = await updateAutomationRule(id, updateData);
      setRule(response.rule);
      setIsEditing(false);
      toast.success('Rule updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update rule';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id || !rule) return;

    try {
      const response = await toggleAutomationRule(id);
      setRule(response.rule);
      toast.success(`Rule ${response.rule.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle rule';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await deleteAutomationRule(id);
      toast.success('Rule deleted successfully');
      navigate('/rules');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete rule';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (isActive?: boolean) => {
    return isActive ? 'success' : 'neutral';
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState 
          variant="default" 
          message="Loading rule details..." 
        />
      </AppLayout>
    );
  }

  if (error || !rule) {
    return (
      <AppLayout>
        <ErrorState 
          error={{
            type: 'network',
            message: error || 'Rule not found',
            title: 'Failed to Load Rule',
            actionable: true,
            actionLabel: 'Try Again'
          }}
          onRetry={loadRule}
          onDismiss={() => navigate('/rules')}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{rule.name}</h1>
              <p className="mt-1 text-sm text-muted">
                Automation rule details and configuration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(rule.is_active)}>
                {rule.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                variant={rule.is_active ? 'outline' : 'primary'}
                size="sm"
                onClick={handleToggleActive}
              >
                {rule.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              {!isEditing && (
                <Button variant="ghost" onClick={() => setIsEditing(true)}>
                  Edit Rule
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left column: Main content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Settings */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Basic Settings</h2>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: rule.name || '',
                            description: rule.description || '',
                            is_active: rule.is_active ?? true,
                            check_interval_minutes: rule.check_interval_minutes || 60
                          });
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rule Name</label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter rule name"
                        disabled={isSaving}
                      />
                    ) : (
                      <p className="text-sm">{rule.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    {isEditing ? (
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter rule description"
                        disabled={isSaving}
                      />
                    ) : (
                      <p className="text-sm text-muted">{rule.description || 'No description provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Check Interval</label>
                    {isEditing ? (
                      <div>
                        <Input
                          type="number"
                          min={5}
                          max={1440}
                          value={formData.check_interval_minutes}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 60;
                            setFormData(prev => ({ ...prev, check_interval_minutes: Math.max(5, Math.min(1440, val)) }));
                          }}
                          disabled={isSaving}
                        />
                        <p className="text-xs text-muted mt-1">How often to check weather conditions (5-1440 minutes)</p>
                      </div>
                    ) : (
                      <p className="text-sm">{rule.check_interval_minutes || 60} minutes</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-default"
                        disabled={isSaving}
                      />
                      <label htmlFor="is_active" className="text-sm font-medium">Rule is active</label>
                    </div>
                  )}
                </div>
              </Card>

              {/* Controlled Ad Sets */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">Controlled Ad Sets</h2>
                <div className="space-y-3">
                  {rule.campaigns && rule.campaigns.length > 0 ? (
                    rule.campaigns.map((campaign, index) => (
                      <div key={index} className="border border-default rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm">
                              {campaign.ad_set_id ? 'Ad Set' : 'Campaign'}: {campaign.ad_set_id || campaign.campaign_id}
                            </div>
                            <div className="text-xs text-muted">
                              Platform: {campaign.platform} • Account: {campaign.account_id}
                            </div>
                          </div>
                          <Badge variant={campaign.target_type === 'ad_set' ? 'info' : 'neutral'}>
                            {campaign.target_type || 'campaign'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted">No ad sets or campaigns linked to this rule.</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right column: Sidebar info */}
            <div className="space-y-6">
              {/* Location Info */}
              {rule.location && (
                <Card>
                  <h3 className="text-lg font-semibold mb-3">Location</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">📍</span>
                      <span className="text-sm">{rule.location.city}, {rule.location.country}</span>
                    </div>
                    <div className="text-xs text-muted">
                      Lat: {rule.location.lat}, Lon: {rule.location.lon}
                    </div>
                  </div>
                </Card>
              )}

              {/* Weather Conditions */}
              {rule.conditions && rule.conditions.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold mb-3">Weather Conditions</h3>
                  <div className="space-y-2">
                    {rule.conditions.map((condition, index) => (
                      <div key={index} className="text-sm">
                        <Badge variant="neutral" className="mr-2">
                          {condition.parameter}
                        </Badge>
                        {condition.operator.replace('_', ' ')} {condition.value} {condition.unit}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Activity Timeline */}
              <Card>
                <h3 className="text-lg font-semibold mb-3">Activity</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted">Created:</span>
                    <span>{formatDate(rule.created_at)}</span>
                  </div>
                  {rule.updated_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted">Updated:</span>
                      <span>{formatDate(rule.updated_at)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted">Last Checked:</span>
                    <span>{formatDate(rule.last_checked_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted">Last Executed:</span>
                    <span>{formatDate(rule.last_executed_at)}</span>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link to="/rules/new" className="block">
                    <Button variant="outline" className="w-full">
                      Create Similar Rule
                    </Button>
                  </Link>
                  <Link to="/rules" className="block">
                    <Button variant="ghost" className="w-full">
                      Back to Rules List
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            open={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
            title="Delete Automation Rule"
            message={`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`}
            confirmText="Delete Rule"
            destructive={true}
            loading={isDeleting}
          />
        </div>
      </div>
    </AppLayout>
  );
}
