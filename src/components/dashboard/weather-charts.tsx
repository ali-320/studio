'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import { Thermometer, Droplets, MountainSnow } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { weatherData, glacierData, years } from '@/lib/weather-data';


export function WeatherCharts() {
  const [selectedYear, setSelectedYear] = useState<string>(years[years.length - 1].toString());

  const currentYearWeatherData = weatherData.find(d => d.year === parseInt(selectedYear))?.data || [];
  const currentYearGlacierData = glacierData.find(d => d.year === parseInt(selectedYear))?.data || [];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Historical Weather & Climate Data</CardTitle>
                <CardDescription>Decade-long data for your region</CardDescription>
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
        <Tabs defaultValue="weather">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weather"><Droplets className="mr-2 h-4 w-4" />Weather</TabsTrigger>
            <TabsTrigger value="glacier"><MountainSnow className="mr-2 h-4 w-4" />Glacier Index</TabsTrigger>
          </TabsList>
          <TabsContent value="weather">
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
          </TabsContent>
          <TabsContent value="glacier">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
