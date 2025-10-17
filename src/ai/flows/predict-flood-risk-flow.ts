
'use server';
/**
 * @fileOverview A Genkit flow that predicts flood risk based on location and news data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictFloodRiskInputSchema = z.object({
    location: z.string().describe('The geographical location (e.g., city, region) to assess.'),
    news: z.string().describe('A compilation of recent news article titles and summaries relevant to the location.'),
});

const PredictionSchema = z.object({
    risk: z.enum(['Low', 'Medium', 'High']).describe('The overall flood risk category.'),
    score: z.number().min(1).max(10).describe('A numerical score from 1 (lowest risk) to 10 (highest risk).'),
    reason: z.string().describe('A concise explanation for the given risk assessment, citing the provided data.'),
});

export type Prediction = z.infer<typeof PredictionSchema>;

export async function predictFloodRisk(input: z.infer<typeof PredictFloodRiskInputSchema>): Promise<Prediction> {
    return predictFloodRiskFlow(input);
}

const predictFloodRiskPrompt = ai.definePrompt({
    name: 'predictFloodRiskPrompt',
    model: 'googleai/gemini-1.5-flash',
    input: { schema: PredictFloodRiskInputSchema },
    output: { schema: PredictionSchema },
    prompt: `You are a sophisticated flood risk analysis engine. Your task is to analyze the provided data for a specific location and determine the flood risk.

    Location: {{{location}}}

    Recent News and Data:
    {{{news}}}

    Analyze all the information above. Based on your analysis, provide a flood risk assessment.
    - Determine a risk category: "Low", "Medium", or "High".
    - Assign a numerical score from 1 to 10, where 1 is the lowest possible risk and 10 is the highest.
    - Provide a clear, concise reasoning for your assessment, referencing the news data if applicable. For example, if there is heavy rainfall reported, mention it in your reasoning.`,
});


const predictFloodRiskFlow = ai.defineFlow(
    {
        name: 'predictFloodRiskFlow',
        inputSchema: PredictFloodRiskInputSchema,
        outputSchema: PredictionSchema,
    },
    async (input) => {
        try {
            const { output } = await predictFloodRiskPrompt(input);
            if (!output) {
                throw new Error("AI did not return a valid prediction.");
            }
            return output;
        } catch (error) {
            console.error("Error in predictFloodRiskFlow:", error);
            // Fallback to a default low-risk prediction in case of AI failure
            return {
                risk: 'Low',
                score: 1,
                reason: 'Could not perform AI analysis. Defaulting to low risk.',
            };
        }
    }
);

