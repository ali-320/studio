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
    prompt: `You are a helpful news aggregator specializing in environmental and weather-related events. Find 4 recent and authentic news articles relevant to potential flood risks for the following location: {{{input}}}.

    Your search should be comprehensive. Include news about:
    - Direct weather warnings (heavy rainfall, storms, cyclones).
    - Mountain-related news (unusual snowmelt, glacier conditions, landslides).
    - Major water body status (rising river levels, dam overflows) in the surrounding region.
    - News from nearby major cities that could impact the given location.

    Provide a diverse set of sources. For each article, provide the headline, a brief summary, the source name, and a valid, direct URL to the article. Ensure the URLs are real and lead directly to the story. If you cannot find 4 articles, return as many as you can find, but do not invent news.`,
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
