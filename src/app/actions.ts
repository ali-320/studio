'use server';

import { predictFloodRisk, PredictFloodRiskInput, PredictFloodRiskOutput } from "@/ai/flows/predict-flood-risk";
import { analyzeFloodNews, AnalyzeFloodNewsInput, AnalyzeFloodNewsOutput } from "@/ai/flows/analyze-flood-news";

export async function getFloodPrediction(
  input: PredictFloodRiskInput
): Promise<PredictFloodRiskOutput> {
  // In a real app, you might add more complex logic, error handling, or caching here.
  return await predictFloodRisk(input);
}

export async function getNewsAnalysis(
  input: AnalyzeFloodNewsInput
): Promise<AnalyzeFloodNewsOutput> {
  return await analyzeFloodNews(input);
}

// For scenario planning, we can reuse the predictFloodRisk flow
// by augmenting the input to the prompt. Since we can't modify the flow,
// we'll just pass a more descriptive location string.
export async function getScenarioPrediction(
  location: string,
  scenario: string
): Promise<PredictFloodRiskOutput> {
  const augmentedInput: PredictFloodRiskInput = {
    location: `For the location "${location}", analyze the following hypothetical scenario: "${scenario}"`,
  };
  return await predictFloodRisk(augmentedInput);
}
