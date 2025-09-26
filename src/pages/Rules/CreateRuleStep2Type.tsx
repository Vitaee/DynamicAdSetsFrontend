import { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import StepBadge from '../../components/ui/StepBadge';
import Badge from '../../components/ui/Badge';
import ChoiceCard from '../../components/ui/ChoiceCard';
import { useNav } from '../../stores/nav';
import { useRuleWizard } from '../../stores/ruleWizard';
import { useNavigate } from 'react-router-dom';

export default function CreateRuleStep2Type() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useNav();
  const { draft, setLocationType } = useRuleWizard();
  const [type, setType] = useState<'single' | 'multi'>(draft.locationType || 'single');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automation Rules', href: '/rules' },
      { label: 'Create' },
    ]);
  }, [setBreadcrumbs]);

  const onContinue = () => {
    setLocationType(type);
    navigate('/rules/new/select-adsets');
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Automation Type</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                Set your automation to target a single location or scale across multiple regions.
              </p>
            </div>
            <StepBadge step={2} total={6} />
          </div>

          <Card>
            <p className="wt-label mb-3">What Type of Automation Would You Like to Create?</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Single Location */}
              <ChoiceCard selected={type === 'single'} onSelect={() => setType('single')}>
                <div className="flex items-start gap-3">
                  <Checkbox checked={type === 'single'} onChange={() => setType('single')} label={<span className="font-medium">Single Location</span>} />
                </div>
                <div className="mt-4">
                  <div className="h-56 rounded-xl bg-gray-50 ring-1 ring-indigo-300/40 grid place-items-center overflow-hidden dark:bg-gray-800 dark:ring-indigo-400/30">
                    <svg width="200" height="200" viewBox="0 0 200 200" className="opacity-70">
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#6366f1" strokeOpacity="0.35" strokeWidth="3" />
                      <circle cx="100" cy="100" r="36" fill="#6366f1" fillOpacity="0.08" />
                      <circle cx="100" cy="100" r="6" fill="#ef4444" />
                    </svg>
                  </div>
                </div>
              </ChoiceCard>

              {/* Multi Location (coming soon) */}
              <ChoiceCard disabled className="bg-gray-50 dark:bg-gray-800">
                <div className="flex items-start gap-3">
                  <Checkbox disabled label={<span className="font-medium">Multi Location</span>} />
                  <Badge className="ml-2" variant="muted">Available Soon</Badge>
                </div>
                <div className="mt-4">
                  <div className="h-56 rounded-xl bg-gray-50 ring-1 ring-gray-200 grid place-items-center overflow-hidden dark:bg-gray-800 dark:ring-gray-700">
                    <svg width="220" height="160" viewBox="0 0 220 160" className="opacity-60">
                      <circle cx="60" cy="80" r="34" fill="#9ca3af" fillOpacity="0.12"/>
                      <circle cx="160" cy="60" r="48" fill="#9ca3af" fillOpacity="0.12"/>
                      <circle cx="190" cy="120" r="26" fill="#9ca3af" fillOpacity="0.12"/>
                    </svg>
                  </div>
                </div>
              </ChoiceCard>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={() => navigate('/rules/new')}>Back</Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate('/rules')}>Cancel</Button>
                <Button onClick={onContinue}>Continue</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

