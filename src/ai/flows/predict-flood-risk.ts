'use server';

/**
 * @fileOverview Flood risk prediction flow. This flow takes a location as input, analyzes weather data,
 * news, and historical patterns to predict the flood risk for that location.
 *
 * - predictFloodRisk - A function that handles the flood risk prediction process.
 * - PredictFloodRiskInput - The input type for the predictFloodRisk function.
 * - PredictFloodRiskOutput - The return type for the predictFloodRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictFloodRiskInputSchema = z.object({
  location: z
    .string()
    .describe("The user's location, which should include city, and country."),
});
export type PredictFloodRiskInput = z.infer<typeof PredictFloodRiskInputSchema>;

const PredictFloodRiskOutputSchema = z.object({
  floodRiskLevel: z
    .enum(['low', 'medium', 'high'])
    .describe('The predicted flood risk level for the given location.'),
  summary: z
    .string()
    .describe(
      'A summary of the factors contributing to the flood risk prediction.'
    ),
  recommendations: z
    .string()
    .describe(
      'Recommendations for the user based on the flood risk prediction.'
    ),
});
export type PredictFloodRiskOutput = z.infer<typeof PredictFloodRiskOutputSchema>;

export async function predictFloodRisk(input: PredictFloodRiskInput): Promise<PredictFloodRiskOutput> {
  return predictFloodRiskFlow(input);
}

const predictFloodRiskPrompt = ai.definePrompt({
  name: 'predictFloodRiskPrompt',
  input: {schema: PredictFloodRiskInputSchema},
  output: {schema: PredictFloodRiskOutputSchema},
  prompt: `You are an AI assistant designed to predict flood risk for a given location.

  Analyze the following location:
  Location: {{{location}}}

  Consider current weather data, recent news related to flooding in nearby areas, and historical weather patterns to determine the flood risk level (low, medium, or high).

  Provide a summary of the factors contributing to the flood risk prediction and offer recommendations to the user based on the prediction.

  Ensure that the output is formatted according to the PredictFloodRiskOutputSchema. Use the schema descriptions to populate the fields correctly.

  Output:
  `,
});

const predictFloodRiskFlow = ai.defineFlow(
  {
    name: 'predictFloodRiskFlow',
    inputSchema: PredictFloodRiskInputSchema,
    outputSchema: PredictFloodRiskOutputSchema,
  },
  async input => {
    const {output} = await predictFloodRiskPrompt(input);
    return output!;
  }
);
