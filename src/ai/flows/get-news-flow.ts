
'use server';
/**
 * @fileOverview A Genkit flow that fetches recent flood-related news for a given location.
 *
 * - getNewsForLocation - A function that calls the AI flow to get news.
 * - NewsItem - The type for a single news article.
 * - GetNewsOutput - The type for the list of news articles.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const NewsItemSchema = z.object({
    title: z.string().describe('The headline of the news article.'),
    summary: z.string().describe('A brief summary of the news article.'),
    source: z.string().describe('The name of the news source (e.g., "BBC News", "Reuters").'),
    url: z.string().url().describe('The direct URL to the news article.'),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

const GetNewsOutputSchema = z.object({
    articles: z.array(NewsItemSchema),
});
export type GetNewsOutput = z.infer<typeof GetNewsOutputSchema>;


export async function getNewsForLocation(location: string): Promise<GetNewsOutput> {
    return getNewsFlow(location);
}

const getNewsPrompt = ai.definePrompt({
    name: 'getNewsPrompt',
    model: googleAI('gemini-1.5-flash'),
    input: { schema: z.string() },
    output: { schema: GetNewsOutputSchema },
    prompt: `You are a helpful and diligent weather and environmental news reporter. Your task is to find 4 recent and relevant news articles or updates for the following location: {{{input}}}.

    It is critical that you return some information, even if it's just a general forecast. The user's news board should not be empty.

    Your search should prioritize official sources like national meteorological departments (e.g., PMD, Met Office), and major weather news providers (e.g., Google Weather, BBC Weather, AccuWeather).

    Include a mix of the following information if available:
    - Current and upcoming weather forecasts (e.g., sunny spells, temperature changes, expected rainfall).
    - Any active weather warnings (heavy rain, storms, heatwaves).
    - News about major water bodies in the region (rivers, dams).
    - Mountain-related news if applicable (snowfall, snowmelt).
    
    Do not invent news. Find real, verifiable articles or official updates and provide a direct, working URL for each. For each item, provide a headline, a brief summary, the source name, and the URL.`,
});

const getNewsFlow = ai.defineFlow(
    {
        name: 'getNewsFlow',
        inputSchema: z.string(),
        outputSchema: GetNewsOutputSchema,
    },
    async (location) => {
        try {
            const { output } = await getNewsPrompt(location);
            // Ensure we return a valid structure even if the AI output is empty
            return output || { articles: [] };
        } catch (error) {
            console.error("Error in getNewsFlow:", error);
            // Return an empty list on failure to prevent client-side crashes
            return { articles: [] };
        }
    }
);
