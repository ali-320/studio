
'use server';
/**
 * @fileOverview A Genkit flow that fetches recent flood-related news for a given location.
 *
 * - getNewsForLocation - A function that calls the AI flow to get news.
 * - NewsItem - The type for a single news article.
 * - GetNewsOutput - The type for the list of news articles.
 */

import { ai } from '@/ai/genkit';
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
    model: 'googleai/gemini-1.5-flash',
    output: { schema: GetNewsOutputSchema },
    prompt: `You are a web search and summarization engine. Your task is to find 4 recent and relevant online articles or official updates about flood-related factors for the following location: {{{input}}}.

    It is critical that you return some information, even if it's just a general forecast. The user's news board should not be empty.

    Your process for each item should be:
    1. Search the web for relevant news or updates. Prioritize official sources like meteorological departments and major news outlets.
    2. Follow the link to the source.
    3. Read and summarize the content of the page.
    4. Provide the article's headline, your summary, the name of the source, and a direct, working URL to the article.
    5. Do not invent news.

    Focus on these flood-related factors:
    - Current and upcoming weather forecasts (e.g., expected rainfall).
    - Any active weather warnings (heavy rain, storms, heatwaves).
    - News about major water bodies in the region (rivers, dams).
    - Mountain-related news if applicable (snowfall, snowmelt).
    
    Return the data as a JSON object that conforms to the specified output schema.`,
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
            
            if (!output || output.articles.length === 0) {
                 console.log("AI returned no news. This should not happen with the new prompt, but as a fallback, returning an empty array.");
                 return { articles: [] };
            }
            
            return output;
        } catch (error) {
            console.error("Error in getNewsFlow:", error);
            // Return empty array on failure to prevent client-side crashes
            return { articles: [] };
        }
    }
);
