
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Thermometer, Droplets } from 'lucide-react';

const tempData = [
  { name: 'Mon', temp: 22 },
  { name: 'Tue', temp: 24 },
  { name: 'Wed', temp: 23 },
  { name: 'Thu', temp: 25 },
  { name: 'Fri', temp: 26 },
  { name: 'Sat', temp: 28 },
  { name: 'Sun', temp: 27 },
];

const rainfallData = [
  { name: 'Mon', rainfall: 5 },
  { name: 'Tue', rainfall: 2 },
  { name: 'Wed', rainfall: 15 },
  { name: 'Thu', rainfall: 8 },
  { name: 'Fri', rainfall: 3 },
  { name: 'Sat', rainfall: 0 },
  { name: 'Sun', rainfall: 20 },
];


export function WeatherCharts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Overview</CardTitle>
        <CardDescription>7-Day Forecast Data for Your Area</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="temperature">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="temperature"><Thermometer className="mr-2 h-4 w-4" />Temperature</TabsTrigger>
            <TabsTrigger value="rainfall"><Droplets className="mr-2 h-4 w-4" />Rainfall</TabsTrigger>
          </TabsList>
          <TabsContent value="temperature">
             <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis unit="°C" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                        <Line type="monotone" dataKey="temp" name="Temperature" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
             </div>
          </TabsContent>
          <TabsContent value="rainfall">
            <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rainfallData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis unit="mm"/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                        <Bar dataKey="rainfall" name="Rainfall (mm)" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
