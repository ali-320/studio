'use server';
/**
 * @fileOverview This flow will handle the AI scoring of incident severity.
 * It is designed to be triggered when a new incident is created.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TriageIncidentInputSchema = z.object({
  reportId: z.string().describe("The ID of the incident report document in Firestore."),
  location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).describe("The location of the incident."),
  hasPhoto: z.boolean().describe("Whether the report includes a photo.")
});

const TriageIncidentOutputSchema = z.object({
    riskScore: z.enum(['Low', 'Medium', 'High']),
    message: z.string(),
});

/**
 * A flow that triages a new flood incident.
 * This can be called after an incident is created to determine its risk score.
 */
export async function triageIncident(input: z.infer<typeof TriageIncidentInputSchema>): Promise<z.infer<typeof TriageIncidentOutputSchema>> {
  return triageIncidentFlow(input);
}

export const triageIncidentFlow = ai.defineFlow(
  {
    name: 'triageIncidentFlow',
    inputSchema: TriageIncidentInputSchema,
    outputSchema: TriageIncidentOutputSchema,
  },
  async ({ reportId, location, hasPhoto }) => {
    
    // Mock AI logic (replace with actual ML API later)
    let riskScore: 'Low' | 'Medium' | 'High' = 'Low';

    // Simple rules – upgrade later with ML scoring
    if (hasPhoto) riskScore = "Medium";
    if (location.latitude > 33.65 && location.longitude > 73.00) riskScore = "High";

    const message = `✅ Incident triaged: ${reportId} → ${riskScore}`;
    console.log(message);
    
    // In a real implementation, we would update the alert document in Firestore here.
    // For now, we just return the calculated risk score.
    return { riskScore, message };
  }
);
