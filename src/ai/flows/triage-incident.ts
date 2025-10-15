'use server';
/**
 * @fileOverview This flow will handle the AI scoring of incident severity.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TriageIncidentInputSchema = z.object({
  description: z.string().describe('The user-provided description of the flood incident.'),
  photoUrl: z.string().optional().describe('A URL to a photo of the incident.'),
});

const TriageIncidentOutputSchema = z.object({
    severity: z.enum(['low', 'medium', 'high']),
    priority: z.number().min(1).max(10).describe('A priority score from 1 (lowest) to 10 (highest).'),
});


export const triageIncident = ai.defineFlow(
  {
    name: 'triageIncident',
    inputSchema: TriageIncidentInputSchema,
    outputSchema: TriageIncidentOutputSchema,
  },
  async (input) => {
    // Placeholder logic. In a real implementation, this would involve a call to a GenAI model.
    console.log('Triaging incident:', input);
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (input.description.toLowerCase().includes('dangerous') || input.description.toLowerCase().includes('evacuation')) {
        severity = 'high';
    } else if (input.description.toLowerCase().includes('street flooding') || input.description.toLowerCase().includes('rising')) {
        severity = 'medium';
    }

    const priority = severity === 'high' ? 9 : (severity === 'medium' ? 6 : 3);
    
    return {
      severity,
      priority,
    };
  }
);
