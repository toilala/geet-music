export type WeatherInfo = {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  weatherEmoji: string;
};

export type WeatherUiState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: WeatherInfo }
  | { kind: 'error'; message: string; isPermissionDenied?: boolean; isPermanentlyDenied?: boolean };

export type IpLocation = { latitude: number; longitude: number; city?: string; country?: string };

export function mapWmoCodeToCondition(code: number, isDay: boolean): [string, string] {
  if (code === 0) return isDay ? ['Sunny', '☀️'] : ['Clear Sky', '🌙'];
  if (code === 1) return isDay ? ['Mostly Sunny', '🌤️'] : ['Mostly Clear', '🌙'];
  if (code === 2) return ['Partly Cloudy', '⛅'];
  if (code === 3) return ['Overcast', '☁️'];
  if ([45, 48].includes(code)) return ['Foggy & Mist', '🌫️'];
  if ([51, 53, 55].includes(code)) return ['Drizzle', '🌦️'];
  if ([56, 57].includes(code)) return ['Freezing Drizzle', '🌧️'];
  if ([61, 63, 65, 66, 67].includes(code)) return ['Rain', '🌧️'];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ['Snow', '❄️'];
  if ([80, 81, 82].includes(code)) return ['Rain Showers', '🌦️'];
  if ([95, 96, 99].includes(code)) return ['Thunderstorm', '⛈️'];
  return ['Clear', isDay ? '☀️' : '🌙'];
}

export function weatherSnapshot(info: WeatherInfo): string {
  return `WEATHER_VIBE:${Math.round(info.temperature)}°C|${info.weatherEmoji}|${info.condition}|${info.humidity}|${Math.round(info.temperature)}`;
}

export function parseWeatherSnapshot(value?: string): WeatherInfo | null {
  if (!value?.startsWith('WEATHER_VIBE:')) return null;
  const parts = value.slice('WEATHER_VIBE:'.length).split('|');
  const temperature = Number.parseFloat(parts[4] ?? parts[0]?.replace('°C', '') ?? '20');
  if (!Number.isFinite(temperature)) return null;
  return { temperature, feelsLike: temperature, condition: parts[2] ?? 'Clear', conditionCode: 0, humidity: Number(parts[3]) || 50, windSpeed: 0, isDay: true, weatherEmoji: parts[1] ?? '☀️' };
}

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherInfo> {
  const query = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m' });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
  if (!response.ok) throw new Error(`Weather service error: ${response.status}`);
  const data = (await response.json()) as { current?: Record<string, number> };
  const current = data.current;
  if (!current) throw new Error('Invalid weather data');
  const isDay = current.is_day === 1;
  const code = current.weather_code ?? 0;
  const [condition, weatherEmoji] = mapWmoCodeToCondition(code, isDay);
  return { temperature: current.temperature_2m ?? 20, feelsLike: current.apparent_temperature ?? current.temperature_2m ?? 20, condition, conditionCode: code, humidity: current.relative_humidity_2m ?? 50, windSpeed: current.wind_speed_10m ?? 0, isDay, weatherEmoji };
}

export async function fetchIpLocation(): Promise<IpLocation> {
  for (const url of ['https://ipwho.is/', 'https://ipapi.co/json/']) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = (await response.json()) as { latitude?: number; longitude?: number; city?: string; country?: string; country_name?: string; success?: boolean };
      if (Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) return { latitude: data.latitude!, longitude: data.longitude!, city: data.city, country: data.country ?? data.country_name };
    } catch {}
  }
  throw new Error('Could not determine location from IP.');
}
