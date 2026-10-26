'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FloodRiskInputSchema = z.object({
  location: z.string(),
  temperature: z.number(),
  precipitation: z.number(),
  windSpeed: z.number(),
  weatherCondition: z.string(),
});

const FloodRiskOutputSchema = z.object({
  risk: z.enum(['Low', 'Moderate', 'High', 'Severe']),
  reason: z.string(),
});

export type FloodRiskInput = z.infer<typeof FloodRiskInputSchema>;
export type FloodRiskOutput = z.infer<typeof FloodRiskOutputSchema>;

const predictFloodRiskPrompt = ai.definePrompt({
  name: 'predictFloodRiskPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: FloodRiskInputSchema },
  output: { schema: FloodRiskOutputSchema },
  prompt: `Assess flood risk for {{{location}}} using the current weather observations below.

Temperature: {{{temperature}}} °C
Precipitation in the recent forecast period: {{{precipitation}}} mm
Wind speed: {{{windSpeed}}} km/h
Weather condition: {{{weatherCondition}}}

Return a cautious, evidence-based assessment. Use Low when there is no meaningful
rainfall signal, Moderate for notable rainfall or conditions that may contribute
to localized flooding, High for heavy rainfall or storm conditions, and Severe
only when the available observations indicate an extreme immediate threat.
Explain the assessment in one or two concise sentences. Do not claim river,
drainage, elevation, or warning information that was not provided.`,
});

export async function predictFloodRisk(input: FloodRiskInput): Promise<FloodRiskOutput> {
  return predictFloodRiskFlow(input);
}

const predictFloodRiskFlow = ai.defineFlow(
  {
    name: 'predictFloodRiskFlow',
    inputSchema: FloodRiskInputSchema,
    outputSchema: FloodRiskOutputSchema,
  },
  async (input: FloodRiskInput) => {
    const { output } = await predictFloodRiskPrompt(input);
    if (!output) {
      throw new Error('The AI did not return a flood-risk assessment.');
    }
    return output;
  }
);
