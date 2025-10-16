'use server';
/**
 * @fileOverview This flow will handle the AI scoring of incident severity.
 * It is designed to be triggered when a new incident is created.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';


const TriageIncidentInputSchema = z.object({
 reportId: z.string().describe("The ID of the incident report document in Firestore."),
  incidentData: z.object({
    userId: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    severity: z.string(),
    photoUrl: z.string(),
    status: z.string(),
  }),
});


const TriageIncidentOutputSchema = z.object({
    priority: z.enum(['Low', 'Medium', 'High']),
    message: z.string(),
});


export async function triageIncident(input: z.infer<typeof TriageIncidentInputSchema>): Promise<z.infer<typeof TriageIncidentOutputSchema>> {
  return triageIncidentFlow(input);
}


export const triageIncidentFlow = ai.defineFlow(
  {
    name: 'triageIncidentFlow',
    inputSchema: TriageIncidentInputSchema,
    outputSchema: TriageIncidentOutputSchema,
  },
  async ({ reportId, incidentData }) => {
    const { firestore } = initializeFirebase();
    const { coordinates, photoUrl } = incidentData;


    // Mock AI logic (replace with actual ML API later)
    let priority: 'Low' | 'Medium' | 'High' = 'Low';


    // Simple rules – upgrade later with ML scoring
    if (photoUrl) priority = "Medium";
    if (coordinates.lat > 33.65 && coordinates.lng > 73.00) priority = "High";


    const message = `✅ Incident triaged: ${reportId} → ${priority}`;
    console.log(message);
    
    const incidentRef = doc(firestore, 'incidents', reportId);
    await updateDoc(incidentRef, {
        severity: priority,
    });


    return { priority, message };
  }
);
