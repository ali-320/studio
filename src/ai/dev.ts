import { config } from 'dotenv';
config({ path: '.env' });

// Ensure you have a GOOGLE_API_KEY environment variable with an API key for a project with the Gemini 1.5 API enabled.
import './flows/triage-incident.js';
import './flows/send-alert.js';
