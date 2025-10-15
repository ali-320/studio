
"use client";

import { useState } from "react";
import { RiskAssessmentCard } from "./dashboard/risk-assessment-card";
import { CurrentWeatherCard } from "./dashboard/current-weather-card";
import { NewsFeedCard } from "./dashboard/news-feed-card";
import { ScenarioPlannerCard } from "./dashboard/scenario-planner-card";
import { AnalysisChartsCard } from "./dashboard/analysis-charts-card";

export function FloodWatchDashboard() {
  const [region, setRegion] = useState<string>("Punjab");

  return (
    <main className="flex-1">
      <div className="container py-4 md:py-6">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-2 space-y-4 md:space-y-6">
            <RiskAssessmentCard setRegion={setRegion} />
            <AnalysisChartsCard region={region} />
          </div>
          <div className="md:col-span-2 lg:col-span-1 space-y-4 md:space-y-6">
            <CurrentWeatherCard />
            <NewsFeedCard />
            <ScenarioPlannerCard />
          </div>
        </div>
      </div>
    </main>
  );
}
