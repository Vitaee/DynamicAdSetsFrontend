import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StepBadge from '../../components/ui/StepBadge';
import { useNav } from '../../stores/nav';
import { useRuleWizard } from '../../stores/ruleWizard';
import { useNavigate } from 'react-router-dom';

type Param = 'temperature'|'humidity'|'wind_speed'|'precipitation'|'visibility'|'cloud_cover';
type Op = 'greater_than'|'less_than'|'equals'|'between';

type Condition = { parameter: Param; operator: Op; value: number; unit: string };
type Group = { id: string; operator: 'AND'|'OR'; conditions: Condition[] };

function uid() { return Math.random().toString(36).slice(2, 9); }

const paramUnits: Record<Param, string[]> = {
  temperature: ['celsius', 'fahrenheit'],
  wind_speed: ['kmh', 'mph'],
  precipitation: ['mm', 'in'],
  humidity: ['percent'],
  visibility: ['km', 'mi'],
  cloud_cover: ['percent'],
};

export default function CreateRuleStep5Conditions() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useNav();
  const { draft, setConditions, setConditionLogic, setCheckInterval } = useRuleWizard();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automation Rules', href: '/rules' },
      { label: 'Create' },
    ]);
  }, [setBreadcrumbs]);

  const [groups, setGroups] = useState<Group[]>([
    { id: uid(), operator: 'AND', conditions: [{ parameter: 'wind_speed', operator: 'greater_than', value: 10, unit: 'kmh' }] },
  ]);
  const [globalOp, setGlobalOp] = useState<'AND'|'OR'>('AND');
  const [days, setDays] = useState(1);
  const [action, setAction] = useState<'on'|'off'>('on');
  const [interval, setInterval] = useState(draft.checkIntervalMinutes || 720);
  const [showAdvanced, setShowAdvanced] = useState(true);

  const addGroup = () => setGroups((g) => [...g, { id: uid(), operator: 'AND', conditions: [{ parameter: 'temperature', operator: 'greater_than', value: 20, unit: 'celsius' }] }]);
  const addCondition = (gid: string) => setGroups((g) => g.map((gr) => gr.id === gid ? { ...gr, conditions: [...gr.conditions, { parameter: 'wind_speed', operator: 'greater_than', value: 10, unit: 'kmh' }] } : gr));
  const removeCondition = (gid: string, idx: number) => setGroups((g) => g.map((gr) => gr.id === gid ? { ...gr, conditions: gr.conditions.filter((_, i) => i !== idx) } : gr));
  const removeGroup = (gid: string) => setGroups((g) => g.filter((gr) => gr.id !== gid));

  const canContinue = useMemo(() => groups.length > 0 && groups.every((gr) => gr.conditions.length > 0), [groups]);

  const persistAndNext = () => {
    const flatConditions: Condition[] = groups.flatMap((g) => g.conditions);
    setConditions(flatConditions);
    setConditionLogic({
      groups: groups.map((g) => ({ id: g.id, operator: g.operator, conditions: g.conditions })),
      globalOperator: globalOp,
      timeFrame: { days, action },
    });
    setCheckInterval(interval);
    navigate('/rules/new/review');
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Create Your Rules</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Define the weather conditions that trigger your automation.</p>
            </div>
            <StepBadge step={5} total={6} />
          </div>

          <div className="flex items-center gap-2">
            {groups.map((g, i) => (
              <span
                key={g.id}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  i === 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700'
                }`}
              >
                New Filter {i + 1}
              </span>
            ))}
            <button
              className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800"
              onClick={addGroup}
            >
              Add New Filter +
            </button>
          </div>

          <div className="space-y-8">
            {groups.map((g, gi) => (
              <div key={g.id}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[rgb(var(--wt-fg))]/90">Trigger</h3>
                  {groups.length > 1 && (
                    <button onClick={() => removeGroup(g.id)} className="text-xs text-gray-500 hover:underline">Remove group</button>
                  )}
                </div>
                <Card className="p-4">
                  <div className="rounded-xl bg-indigo-50/50 p-4 ring-1 ring-indigo-200/60 dark:bg-indigo-900/20 dark:ring-indigo-800/60">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                      {/* Parameter */}
                      {g.conditions.map((c, i) => (
                        <div key={i} className="col-span-full grid grid-cols-1 gap-3 sm:col-span-full sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                          <select value={c.parameter} onChange={(e) => setGroups((gs) => gs.map((gg) => gg.id === g.id ? { ...gg, conditions: gg.conditions.map((cc, idx) => idx === i ? { ...cc, parameter: e.target.value as Param, unit: paramUnits[e.target.value as Param][0] } : cc) } : gg))} className="wt-input py-2">
                            <option value="temperature">Temperature</option>
                            <option value="humidity">Humidity</option>
                            <option value="wind_speed">Wind Speed</option>
                            <option value="precipitation">Precipitation</option>
                            <option value="visibility">Visibility</option>
                            <option value="cloud_cover">Cloud Cover</option>
                          </select>
                          <select value={c.operator} onChange={(e) => setGroups((gs) => gs.map((gg) => gg.id === g.id ? { ...gg, conditions: gg.conditions.map((cc, idx) => idx === i ? { ...cc, operator: e.target.value as Op } : cc) } : gg))} className="wt-input py-2">
                            <option value="greater_than">Equal/ Greater</option>
                            <option value="less_than">Less Than</option>
                            <option value="equals">Equals</option>
                          </select>
                          <input type="number" value={c.value} onChange={(e) => setGroups((gs) => gs.map((gg) => gg.id === g.id ? { ...gg, conditions: gg.conditions.map((cc, idx) => idx === i ? { ...cc, value: Number(e.target.value) } : cc) } : gg))} className="wt-input py-2" placeholder="e.g. 5" />
                          <select value={c.unit} onChange={(e) => setGroups((gs) => gs.map((gg) => gg.id === g.id ? { ...gg, conditions: gg.conditions.map((cc, idx) => idx === i ? { ...cc, unit: e.target.value } : cc) } : gg))} className="wt-input py-2">
                            {paramUnits[c.parameter].map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <div className="col-span-full flex items-center justify-between">
                            <button onClick={() => addCondition(g.id)} className="rounded-lg text-dark bg-white px-3 py-2 text-sm ring-1 ring-gray-200 transition hover:bg-gray-50 dark:bg-gray-900 dark:ring-gray-700 dark:hover:bg-gray-800">+ Add Condition</button>
                            <button onClick={() => removeCondition(g.id, i)} className="text-sm text-gray-500 hover:underline">Remove</button>
                          </div>
                        </div>
                      ))}

                    </div>

                    <div className="mt-3 text-sm">
                      <button onClick={() => setShowAdvanced((v) => !v)} className="text-indigo-600 hover:underline dark:text-indigo-400">{showAdvanced ? '▾ ' : '▸ '}Advanced Options</button>
                      {showAdvanced && (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Time Range</span>
                            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="wt-input py-2">
                              {[1,2,3,4,5].map((d) => <option key={d} value={d}>{d} day{d>1?'s':''}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Action</span>
                            <select value={action} onChange={(e) => setAction(e.target.value as 'on'|'off')} className="wt-input py-2">
                              <option value="on">On</option>
                              <option value="off">Off</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <span className="text-gray-600 dark:text-gray-400">Check every</span>
                            <select value={interval} onChange={(e) => setInterval(Number(e.target.value))} className="wt-input py-2">
                              <option value={720}>12 hours</option>
                              <option value={1440}>24 hours</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Between groups operator */}
                {gi < groups.length - 1 && (
                  <div className="my-6 flex items-center justify-center">
                    <div className="relative flex items-center">
                      <div className="absolute left-1/2 top-0 -z-10 h-12 w-px -translate-x-1/2 bg-indigo-200 dark:bg-indigo-800"></div>
                      <div className="flex gap-2">
                        <button onClick={() => setGlobalOp('AND')} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${globalOp==='AND'?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700'}`}>AND</button>
                        <button onClick={() => setGlobalOp('OR')} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${globalOp==='OR'?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700'}`}>OR</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => navigate('/rules/new/weather')}>Back</Button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/rules')}>Cancel</Button>
              <Button onClick={persistAndNext} disabled={!canContinue}>Continue</Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
