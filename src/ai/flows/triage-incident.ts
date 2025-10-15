'use server';
/**
 * @fileOverview This flow will handle the AI scoring of incident severity.
 * It is designed to be triggered when a new incident is created.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase Admin SDK
const { firestore } = initializeFirebase();

const TriageIncidentInputSchema = z.object({
  incidentId: z.string().describe("The ID of the incident document in Firestore."),
  incidentData: z.object({
      userId: z.string(),
      photoUrl: z.string().optional(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      severity: z.string(),
      timestamp: z.any(),
      status: z.string(),
  }).describe("The data of the newly created incident."),
});

const TriageIncidentOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

/**
 * A flow that triages a new flood incident.
 * This function can be called from the client-side after an incident is created.
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
  async ({ incidentId, incidentData }) => {
    
    // Mock AI logic (replace with actual ML API later)
    const { coordinates, photoUrl } = incidentData;
    let priority: 'low' | 'medium' | 'high' = 'low';

    // Simple rules – upgrade later with ML scoring
    if (photoUrl) priority = "medium";
    if (coordinates.lat > 33.65 && coordinates.lng > 73.00) priority = "high";

    const incidentRef = doc(firestore, "incidents", incidentId);

    try {
        await updateDoc(incidentRef, {
            severity: priority,
            status: "triaged"
        });
        
        const message = `✅ Incident triaged: ${incidentId} → ${priority}`;
        console.log(message);
        return { success: true, message };

    } catch (error) {
        const message = `❌ Failed to triage incident ${incidentId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(message);
        throw new Error(message);
    }
  }
);
