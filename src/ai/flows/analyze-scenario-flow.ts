'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScenarioInputSchema = z.object({
  river: z.enum(['low', 'normal', 'high', 'overflowing']),
  rainfall: z.enum(['none', 'light', 'moderate', 'heavy']),
  terrain: z.enum(['flat', 'hilly', 'mountainous', 'urban']),
  extra: z.string().optional(),
});

const ScenarioOutputSchema = z.object({
  risk: z.enum(['Low', 'Moderate', 'High', 'Severe']),
  assessment: z.string(),
});

export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;
export type ScenarioOutput = z.infer<typeof ScenarioOutputSchema>;

const scenarioPrompt = ai.definePrompt({
  name: 'analyzeFloodScenarioPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: ScenarioInputSchema },
  output: { schema: ScenarioOutputSchema },
  prompt: `Assess this hypothetical flood scenario.

River status: {{{river}}}
Rainfall: {{{rainfall}}}
Terrain: {{{terrain}}}
Additional details: {{{extra}}}

Return a cautious risk level and a concise assessment. Do not claim that this
is a live warning or invent measurements that were not supplied.`,
});

export async function analyzeFloodScenario(input: ScenarioInput): Promise<ScenarioOutput> {
  const { output } = await scenarioPrompt(input);
  if (!output) throw new Error('The AI did not return a scenario assessment.');
  return output;
}
