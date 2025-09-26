import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import StepBadge from '../../components/ui/StepBadge';
import ChoiceCard from '../../components/ui/ChoiceCard';
import { CHANNELS, type Channel } from '../../types/automation';
import fbLogo from '../../assets/facebooklogo.png';
import gadsLogo from '../../assets/googleadlogo.png';
import { useRuleWizard } from '../../stores/ruleWizard';
import { useNav } from '../../stores/nav';
import { useNavigate } from 'react-router-dom';

export default function CreateRuleStep1() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useNav();
  const { draft, setName, setChannel } = useRuleWizard();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automation Rules', href: '/rules' },
      { label: 'Create' },
    ]);
  }, [setBreadcrumbs]);

  const [name, setLocalName] = useState(draft.name);
  const [channel, setLocalChannel] = useState<Channel | null>(draft.channel);

  const canContinue = useMemo(() => name.trim().length > 0 && !!channel, [name, channel]);

  function handleContinue() {
    if (!canContinue) return;
    setName(name.trim());
    setChannel(channel!);
    navigate('/rules/new/type', { replace: false });
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Name and Channel</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                Start by naming your automation and picking the channel it will run on — one step closer to weather-based targeting.
              </p>
            </div>
            <StepBadge step={1} total={6} />
          </div>

          <Card className="space-y-6">
            <div>
              <Input
                id="automation-name"
                label="Enter Automation Name"
                placeholder="Insert Name"
                value={name}
                onChange={(e) => setLocalName(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <p className="wt-label">Select Channel</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {CHANNELS.map((c) => {
                  const isDisabled = c.id === 'google_ads';
                  return (
                    <ChoiceCard
                      key={c.id}
                      selected={channel === c.id && !isDisabled}
                      onSelect={() => !isDisabled && setLocalChannel(c.id)}
                      className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          aria-label={`Select ${c.label}`}
                          checked={channel === c.id && !isDisabled}
                          onChange={() => !isDisabled && setLocalChannel(c.id)}
                          disabled={isDisabled}
                        />
                        <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 relative">
                          {/* Brand logo with gentle transparency to mirror design */}
                          <img
                            src={c.id === 'facebook' ? fbLogo : gadsLogo}
                            alt={c.label}
                            className={`max-h-20 ${isDisabled ? 'opacity-30' : 'opacity-70'}`}
                          />
                          {isDisabled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                              <span className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium">
                                Coming Soon
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </ChoiceCard>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => navigate('/rules')}>Cancel</Button>
              <Button onClick={handleContinue} disabled={!canContinue}>Continue</Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
