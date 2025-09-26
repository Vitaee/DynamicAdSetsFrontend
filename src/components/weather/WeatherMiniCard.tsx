import Card from '../ui/Card';

type Props = {
  title: string;
  tempC?: number;
  description?: string;
  icon?: string;
  wind?: number;
  humidity?: number;
};

export default function WeatherMiniCard({ title, tempC, description, icon, wind, humidity }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {icon ? (
          <img alt="icon" src={`https://openweathermap.org/img/wn/${icon}@2x.png`} className="h-10 w-10" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800" />
        )}
        <div className="flex-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{description || '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{tempC !== undefined ? `${Math.round(tempC)}°C` : '—'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{wind ? `${Math.round(wind)} km/h` : ''} {humidity ? `· ${humidity}%` : ''}</div>
        </div>
      </div>
    </Card>
  );
}

