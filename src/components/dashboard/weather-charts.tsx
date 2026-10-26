'use client';

<<<<<<< HEAD
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { Droplets, MountainSnow } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateMonthlyData, generateGlacierData, years } from '@/lib/weather-data';

// Import correct Tabs components from UI folder
import { Tabs as CustomTabs, TabsContent as CustomTabsContent, TabsList as CustomTabsList, TabsTrigger as CustomTabsTrigger } from '@/components/ui/tabs';

interface WeatherChartsProps {
    location: { latitude: number; longitude: number };
}

export function WeatherCharts({ location }: WeatherChartsProps) {
  const [selectedYear, setSelectedYear] = useState<string>(years[years.length - 1].toString());

  const currentYearWeatherData = useMemo(() => 
    generateMonthlyData(parseInt(selectedYear), location.latitude, location.longitude),
    [selectedYear, location]
  );

  const currentYearGlacierData = useMemo(() => 
    generateGlacierData(parseInt(selectedYear), location.latitude, location.longitude),
    [selectedYear, location]
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Historical Weather & Climate Data</CardTitle>
                <CardDescription>Coordinate-based historical estimates</CardDescription>
            </div>
             <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <CustomTabs defaultValue="weather">
          <CustomTabsList className="grid w-full grid-cols-2">
            <CustomTabsTrigger value="weather"><Droplets className="mr-2 h-4 w-4" />Weather</CustomTabsTrigger>
            <CustomTabsTrigger value="glacier"><MountainSnow className="mr-2 h-4 w-4" />Glacier Index</CustomTabsTrigger>
          </CustomTabsList>
          <CustomTabsContent value="weather">
             <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={currentYearWeatherData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" unit="°C" stroke="hsl(var(--destructive))" />
                        <YAxis yAxisId="right" orientation="right" unit="mm" stroke="hsl(var(--primary))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="temp" name="Avg Temp (°C)" stroke="hsl(var(--destructive))" strokeWidth={2} activeDot={{ r: 8 }} />
                        <Bar yAxisId="right" dataKey="rainfall" name="Rainfall (mm)" fill="hsl(var(--primary))" />
                    </ComposedChart>
                </ResponsiveContainer>
             </div>
          </CustomTabsContent>
          <CustomTabsContent value="glacier">
            <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentYearGlacierData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mountain" />
                        <YAxis unit="m"/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                        <Bar dataKey="thickness" name="Glacier Thickness (m)" fill="hsl(var(--accent))" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </CustomTabsContent>
        </CustomTabs>
=======
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Droplets, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WeatherChartsProps {
  latitude: number;
  longitude: number;
}

interface HistoricalPoint {
  month: string;
  temp: number | null;
  rainfall: number | null;
}

interface ArchiveResponse {
  daily?: {
    time: string[];
    temperature_2m_mean?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
  };
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, index) => currentYear - 9 + index);

function aggregateMonthlyData(data: ArchiveResponse['daily'], year: number): HistoricalPoint[] {
  const monthly = monthNames.map((month) => ({ month, temperatures: [] as number[], rainfall: 0 }));
  if (!data) return monthly.map(({ month }) => ({ month, temp: null, rainfall: null }));

  data.time.forEach((date, index) => {
    if (!date.startsWith(`${year}-`)) return;
    const monthIndex = Number.parseInt(date.slice(5, 7), 10) - 1;
    const temperature = data.temperature_2m_mean?.[index];
    const precipitation = data.precipitation_sum?.[index];
    if (Number.isFinite(temperature)) monthly[monthIndex].temperatures.push(temperature as number);
    if (Number.isFinite(precipitation)) monthly[monthIndex].rainfall += precipitation as number;
  });

  return monthly.map(({ month, temperatures, rainfall }) => ({
    month,
    temp: temperatures.length
      ? Number((temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length).toFixed(1))
      : null,
    rainfall: temperatures.length || rainfall > 0 ? Number(rainfall.toFixed(1)) : null,
  }));
}

export function WeatherCharts({ latitude, longitude }: WeatherChartsProps) {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [history, setHistory] = useState<ArchiveResponse['daily']>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const startDate = `${currentYear - 9}-01-01`;
    const endDate = new Date().toISOString().slice(0, 10);
    setLoading(true);
    setError(null);

    fetch(`https://archive-api.open-meteo.com/v1/archive?${new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      start_date: startDate,
      end_date: endDate,
      daily: 'temperature_2m_mean,precipitation_sum',
      timezone: 'auto',
    }).toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Historical weather service returned ${response.status}.`);
        return response.json() as Promise<ArchiveResponse>;
      })
      .then((data) => setHistory(data.daily))
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        console.error('Historical weather lookup failed:', fetchError);
        setError('Historical weather is temporarily unavailable.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [latitude, longitude]);

  const chartData = useMemo(
    () => aggregateMonthlyData(history, Number.parseInt(selectedYear, 10)),
    [history, selectedYear]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5" />Historical Weather Trends</CardTitle>
            <CardDescription>Observed monthly averages and rainfall for the selected location</CardDescription>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[350px] items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading historical weather...</div>
        ) : error ? (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">{error}</div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" unit="°C" />
                <YAxis yAxisId="right" orientation="right" unit="mm" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="temp" name="Mean temperature (°C)" stroke="hsl(var(--destructive))" connectNulls />
                <Bar yAxisId="right" dataKey="rainfall" name="Rainfall (mm)" fill="hsl(var(--primary))" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
>>>>>>> 99ce519 (Use real weather trends and AI flood prediction)
      </CardContent>
    </Card>
  );
}
