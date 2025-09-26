import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StepBadge from '../../components/ui/StepBadge';
import { useNav } from '../../stores/nav';
import { useRuleWizard } from '../../stores/ruleWizard';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import { createAutomationRule, type CreateRuleBody } from '../../api/automation';
import { metaGetAccount } from '../../api/meta';
import { toast } from '../../stores/ui';

function FieldRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
      <div className="sm:col-span-3 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="sm:col-span-7">
        <Input value={value} readOnly className="bg-gray-50 dark:bg-gray-800" />
      </div>
      <div className="sm:col-span-2">
        {onEdit && (
          <Button variant="ghost" onClick={onEdit} className="w-full sm:w-auto">Edit</Button>
        )}
      </div>
    </div>
  );
}

export default function CreateRuleStep6Review() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useNav();
  const { draft } = useRuleWizard();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automation Rules', href: '/rules' },
      { label: 'Create' },
    ]);
  }, [setBreadcrumbs]);

  const [submitting, setSubmitting] = useState(false);
  const name = draft.name || 'Untitled Automation';
  const channel = draft.channel === 'facebook' ? 'Facebook' : draft.channel === 'google_ads' ? 'Google Ads' : '—';
  const type = draft.locationType === 'multi' ? 'Multi Location Automation' : 'Single Location Automation';
  const applyingTo = `${draft.selectedAdSets.length} Ad Set${draft.selectedAdSets.length === 1 ? '' : 's'}`;
  const weatherPoints = draft.location ? '1 Geo' : '—';

  const canSubmit = useMemo(() => !!draft.location && (draft.conditions?.length || 0) > 0 && draft.selectedAdSets.length > 0 && !!draft.channel && !!draft.name, [draft]);

  async function buildPayload(): Promise<CreateRuleBody> {
    // Resolve ad account names for campaigns
    let accountNameById = new Map<string, string>();
    try {
      const res = await metaGetAccount();
      res.account?.adAccounts?.forEach((a) => accountNameById.set(a.id || a.ad_account_id || '', a.name || a.ad_account_id || ''));
    } catch {}

    const campaigns: CreateRuleBody['campaigns'] = draft.selectedAdSets.map((s) => ({
      platform: 'meta',
      campaign_id: s.campaignId,
      campaign_name: s.campaignName || s.campaignId,
      ad_account_id: s.accountId || '',
      ad_account_name: accountNameById.get(s.accountId || '') || (s.accountId || ''),
      action: 'resume',
      ad_set_id: s.adSetId,
      ad_set_name: s.adSetName,
      target_type: 'ad_set',
    }));

    return {
      name: draft.name,
      description: undefined,
      location: draft.location!,
      conditions: draft.conditions || [],
      conditionLogic: draft.conditionLogic,
      campaigns,
      check_interval_minutes: draft.checkIntervalMinutes || 720,
    };
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = await buildPayload();
      await createAutomationRule(payload);
      toast.success('Automation rule created');
      navigate('/rules');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create rule');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Review and Set Line</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Double‑check your selections and create your automation.</p>
            </div>
            <StepBadge step={6} total={6} />
          </div>

          <Card className="space-y-5">
            <FieldRow label="Automation Name" value={name} onEdit={() => navigate('/rules/new')} />
            <FieldRow label="Channel" value={channel} onEdit={() => navigate('/rules/new')} />
            <FieldRow label="Automation Type" value={type} onEdit={() => navigate('/rules/new/type')} />
            <FieldRow label="Applying to" value={applyingTo} onEdit={() => navigate('/rules/new/select-adsets')} />
            <FieldRow label="Weather Data Points" value={weatherPoints} onEdit={() => navigate('/rules/new/weather')} />

            <div>
              <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--wt-fg))]/90">Automation Rules</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {draft.conditionLogic?.groups?.map((g, i) => (
                  <Card key={g.id || i} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">New Filter {i + 1}</div>
                      <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">Enabled</span>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {g.conditions.map((c, idx) => (
                        <div key={idx}>
                          {c.parameter.replace('_', ' ')} {c.operator.replace('_', ' ')} {c.value} {c.unit}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Action: Applies to {applyingTo}
                    </div>
                    <div className="mt-3">
                      <Button className="w-full">Activate Ad Set</Button>
                    </div>
                  </Card>
                ))}
                {(!draft.conditionLogic?.groups || draft.conditionLogic.groups.length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No rules defined</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => navigate('/rules/new/conditions')}>Back</Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate('/rules')}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>{submitting ? 'Creating…' : 'Create Rule'}</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

