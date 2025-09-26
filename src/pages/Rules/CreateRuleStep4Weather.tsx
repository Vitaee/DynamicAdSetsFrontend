import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import StepBadge from '../../components/ui/StepBadge';
import { useNav } from '../../stores/nav';
import { useRuleWizard } from '../../stores/ruleWizard';
import { useNavigate } from 'react-router-dom';
import PlaceInput from '../../components/places/PlaceInput';
import WeatherMiniCard from '../../components/weather/WeatherMiniCard';
import { getWeatherByCity, getWeatherCurrent, type WeatherData } from '../../api/weather';

type RowState = {
  adSetId: string;
  selected: boolean;
  locationText: string;
  weather?: WeatherData;
};

export default function CreateRuleStep4Weather() {
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

  const initialRows = useMemo<RowState[]>(() => (
    draft.selectedAdSets.map((a) => ({ adSetId: a.adSetId, selected: true, locationText: '' }))
  ), [draft.selectedAdSets]);

  const [rows, setRows] = useState<RowState[]>(initialRows);

  const updateRow = (adSetId: string, patch: Partial<RowState>) =>
    setRows((prev) => prev.map((r) => (r.adSetId === adSetId ? { ...r, ...patch } : r)));

  const onPickPlace = async (adSetId: string, place: { description: string; lat: number; lng: number; city?: string; country?: string }) => {
    updateRow(adSetId, { locationText: place.description });
    try {
      const data = await getWeatherCurrent(place.lat, place.lng);
      updateRow(adSetId, { weather: data });
    } catch {
      // fallback by city name
      try {
        const data2 = await getWeatherByCity(place.city || place.description, place.country);
        updateRow(adSetId, { weather: data2 });
      } catch {
        updateRow(adSetId, { weather: undefined });
      }
    }
  };

  const selectedWeathers = rows
    .map((r) => r.weather)
    .filter(Boolean)
    .slice(0, 3) as WeatherData[];

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Weather Data Settings</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Fine-tune when your ads go live based on weather conditions.</p>
            </div>
            <StepBadge step={4} total={6} />
          </div>

          <Card>
            <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="px-4 py-3 text-left"><Checkbox checked={rows.every(r => r.selected)} onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, selected: e.target.checked })))} /></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Weather Point</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Ad Set</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {draft.selectedAdSets.map((sel) => {
                    const row = rows.find((r) => r.adSetId === sel.adSetId)!;
                    return (
                      <tr key={sel.adSetId} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                        <td className="px-4 py-3"><Checkbox checked={row.selected} onChange={(e) => updateRow(sel.adSetId, { selected: e.target.checked })} /></td>
                        <td className="px-4 py-3 min-w-[280px]">
                          <PlaceInput value={row.locationText} onSelect={(p) => onPickPlace(sel.adSetId, p)} />
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{sel.adSetName}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{sel.campaignName || sel.campaignId}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{sel.accountId || '—'}</td>
                        <td className="px-4 py-3">
                          <select className="wt-input py-1.5 w-28" defaultValue="SELECT" onChange={(e) => { e.currentTarget.value = 'SELECT'; }}>
                            <option value="SELECT">Select</option>
                            <option value="remove">Remove</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedWeathers.length > 0 && (
              <div className="mt-6">
                <p className="wt-label mb-3">Selected Locations</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedWeathers.map((w) => (
                    <WeatherMiniCard
                      key={`${w.location.lat},${w.location.lon}`}
                      title={`${w.location.name}, ${w.location.country}`}
                      tempC={w.current.temp}
                      description={w.current.weather?.[0]?.description}
                      icon={w.current.weather?.[0]?.icon}
                      wind={w.current.wind_speed}
                      humidity={w.current.humidity}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={() => navigate('/rules/new/select-adsets')}>Back</Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate('/rules')}>Cancel</Button>
                <Button
                  onClick={() => {
                    const first = rows.find((r) => r.weather)?.weather;
                    if (!first) return;
                    const loc = first.location;
                    // Persist single location for now
                    const { setLocation } = useRuleWizard.getState();
                    setLocation({ city: loc.name, country: loc.country, lat: loc.lat, lon: loc.lon });
                    navigate('/rules/new/conditions');
                  }}
                  disabled={!rows.some((r) => r.weather)}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
