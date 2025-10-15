'use server';

/**
 * @fileOverview A flow to analyze news articles and social media posts related to floods in a given region.
 *
 * - analyzeFloodNews - A function that analyzes flood-related news and social media.
 * - AnalyzeFloodNewsInput - The input type for the analyzeFloodNews function.
 * - AnalyzeFloodNewsOutput - The return type for the analyzeFloodNews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFloodNewsInputSchema = z.object({
  region: z
    .string()
    .describe('The region to analyze flood news for, such as city or county.'),
  newsSources: z
    .array(z.string())
    .optional()
    .describe('Optional list of specific news sources to analyze.'),
  socialMediaSources: z
    .array(z.string())
    .optional()
    .describe('Optional list of specific social media sources to analyze.'),
});
export type AnalyzeFloodNewsInput = z.infer<typeof AnalyzeFloodNewsInputSchema>;

const AnalyzeFloodNewsOutputSchema = z.object({
  summary: z
    .string()
    .describe('A summary of the flood-related news and social media posts.'),
  riskLevel: z
    .enum(['low', 'moderate', 'high'])
    .describe('The overall risk level of flooding in the specified region.'),
  keyInformation: z.array(
    z.object({
      source: z.string().describe('The source of the information.'),
      content: z.string().describe('The content of the news or post.'),
    })
  ).describe('A list of key information extracted from the analyzed sources.')
});
export type AnalyzeFloodNewsOutput = z.infer<typeof AnalyzeFloodNewsOutputSchema>;

export async function analyzeFloodNews(input: AnalyzeFloodNewsInput): Promise<AnalyzeFloodNewsOutput> {
  return analyzeFloodNewsFlow(input);
}

const analyzeFloodNewsPrompt = ai.definePrompt({
  name: 'analyzeFloodNewsPrompt',
  input: {schema: AnalyzeFloodNewsInputSchema},
  output: {schema: AnalyzeFloodNewsOutputSchema},
  prompt: `You are an AI agent that analyzes news articles and social media posts to determine the flood risk in a given region.

  Analyze the following information from news and social media for the region: {{{region}}}.

  News Sources: {{#if newsSources}}{{{newsSources}}}{{else}}All available news sources{{/if}}
  Social Media Sources: {{#if socialMediaSources}}{{{socialMediaSources}}}{{else}}All available social media sources{{/if}}

  Based on your analysis, provide a summary of the flood-related news, the overall flood risk level (low, moderate, or high), and key information extracted from the sources.

  Ensure that the summary and risk level are clear and concise, so it can be easily interpreted by the user.
`,
});

const analyzeFloodNewsFlow = ai.defineFlow(
  {
    name: 'analyzeFloodNewsFlow',
    inputSchema: AnalyzeFloodNewsInputSchema,
    outputSchema: AnalyzeFloodNewsOutputSchema,
  },
  async input => {
    const {output} = await analyzeFloodNewsPrompt(input);
    return output!;
  }
);
