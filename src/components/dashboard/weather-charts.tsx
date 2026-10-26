'use client';

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
      </CardContent>
    </Card>
  );
}
