import { request } from './http';

export type WeatherData = {
  location: { name: string; country: string; lat: number; lon: number };
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    weather: { id: number; main: string; description: string; icon: string }[];
  };
  timestamp: number;
};

export function getWeatherByCity(city: string, country?: string) {
  const params = new URLSearchParams({ city });
  if (country) params.set('country', country);
  return request<WeatherData>(`/weather/city?${params.toString()}`);
}

export function getWeatherCurrent(lat: number, lon: number) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  return request<WeatherData>(`/weather/current?${params.toString()}`);
}

