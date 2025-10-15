
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
      <div className="container py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <RiskAssessmentCard setRegion={setRegion} />
            <AnalysisChartsCard region={region} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <CurrentWeatherCard />
            <NewsFeedCard />
            <ScenarioPlannerCard />
          </div>
        </div>
      </div>
    </main>
  );
}
