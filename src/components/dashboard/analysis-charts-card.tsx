
"use client";

import *
as React from "react";
import { AreaChart, BarChart as RechartsBarChart, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { historicalWeatherData, glacierData, terrainData } from "@/lib/data";
import { TrendingUp, Mountain, Globe, History } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const chartConfig = {
  rainfall: {
    label: "Rainfall (mm)",
    color: "hsl(var(--primary))",
  },
  temperature: {
    label: "Temperature (°C)",
    color: "hsl(var(--accent))",
  },
  glacierMass: {
    label: "Glacier Mass Index",
    color: "hsl(var(--primary))",
  },
};

const terrainChartConfig = {
  terrain1: { label: "Elevation < 50m", color: "#a8ddb5" },
  terrain2: { label: "Elevation 50-200m", color: "#7bccc4" },
  terrain3: { label: "Elevation 200-500m", color: "#4eb3d3" },
  terrain4: { label: "Elevation > 500m", color: "#2b8cbe" },
}

export function AnalysisChartsCard() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear);

  const chartData = historicalWeatherData[selectedYear] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Data Analysis
        </CardTitle>
        <CardDescription>Visualize historical patterns and geographical factors.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="historical">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="historical"><History className="mr-2 h-4 w-4" />Historical</TabsTrigger>
            <TabsTrigger value="glacier"><Mountain className="mr-2 h-4 w-4" />Glaciers</TabsTrigger>
            <TabsTrigger value="terrain"><Globe className="mr-2 h-4 w-4" />Terrain</TabsTrigger>
          </TabsList>
          <TabsContent value="historical" className="pt-4">
            <div className="flex justify-end mb-4">
                <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis yAxisId="left" stroke="hsl(var(--primary))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="rainfall" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Area yAxisId="right" type="monotone" dataKey="temperature" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
              </AreaChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="glacier" className="pt-4">
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <RechartsBarChart data={glacierData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="mass" name="Glacier Mass Index" fill="hsl(var(--primary))" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="terrain" className="pt-4">
            <ChartContainer config={terrainChartConfig} className="min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Tooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} />
                  <Pie data={terrainData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                     {terrainData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
