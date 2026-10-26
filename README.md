# Nigehbaan

Nigehbaan is a flood-awareness prototype that helps people set a location,
view current weather conditions, read location-focused news, and explore
flood-risk scenarios.

## Problem

Flood risk information is often difficult to understand quickly and is
scattered across weather services, news sources, and local reports. Nigehbaan
brings the first pieces of that workflow into one dashboard so that a user can
choose a location and see relevant information in one place.

## Current features

- Firebase Authentication for user sign-in and registration.
- Firebase Firestore for user profiles and saved locations.
- Automatic browser geolocation when permission is available.
- Manual location lookup using OpenStreetMap Nominatim geocoding.
- Current temperature, weather condition, wind speed, and wind direction for
  the selected coordinates using Open-Meteo.
- Saved locations that can be selected or deleted from the dashboard.
- A news board with Firestore caching and an AI-assisted refresh flow.
- Flood-risk scenario exploration based on user-selected conditions.
- Location-specific historical weather trends from Open-Meteo.
- AI flood-risk assessment based on current weather observations.

## Important prototype limitations

The Live Weather card and historical weather trends use location-specific data
from Open-Meteo. The historical chart is an API-based monthly aggregation of
daily mean temperature and precipitation; it is informational and should not
be presented as an official emergency warning.

The AI flood predictor is an assessment based only on the current weather
observations supplied to it. It does not have river-level, drainage, elevation,
or official warning data. The scenario checker is a prototype experience.
Neither feature is an emergency warning system. Do not use this application as
a substitute for official emergency guidance.

## Technology stack

- Next.js 15 and React
- TypeScript
- Firebase Authentication, Firestore, and Storage
- OpenStreetMap Nominatim for geocoding
- Open-Meteo for current weather data
- Genkit and Google Gemini integration for AI-assisted news functionality
- Tailwind CSS and Radix UI components

## Requirements

- Node.js 20 or newer
- npm
- A Firebase web application with Authentication and Firestore enabled
- A Gemini API key for the AI news refresh feature

## Local setup

1. Clone the repository and enter the application directory:

   ```powershell
   git clone https://github.com/ali-320/studio.git
   cd studio
   ```

2. Install dependencies:

   ```powershell
   npm ci
   ```

3. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Fill in `.env.local` with the Firebase web configuration from the Firebase
   Console and the Gemini key used by the AI flow:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_GEMINI_API_KEY=
   GEMINI_API_KEY=
   ```

5. Start the development server:

   ```powershell
   npm run dev
   ```

6. Open [http://localhost:9002](http://localhost:9002).

Never commit `.env`, `.env.local`, API keys, service-account JSON files, or
other credentials. The repository includes `.env.example` only as a safe
configuration template.

## Useful commands

```powershell
npm run dev
npm run typecheck
npm run build
```

## Firebase configuration

The browser Firebase configuration connects the application to the existing
Firebase project. Firestore rules are provided in `firestore.rules`. Configure
Authentication providers and Firestore access rules in the Firebase Console
before demonstrating the application.

## Acknowledgments

- Firebase for authentication, database, and storage services.
- Next.js, React, TypeScript, Tailwind CSS, Radix UI, and Lucide.
- OpenStreetMap contributors and the Nominatim search service.
- Open-Meteo for current and historical weather data.
- Genkit and Google Gemini for AI-assisted functionality.

## License

This project is released under the [MIT License](./LICENSE).

## Project Contributions

Nigehbaan was initially started as a collaborative project with several team
members. The primary contributors responsible for the substantial majority of
the implementation—more than 95% of the project work—were **Hassan Ali** and
**Faisal Iqbal**.

Hassan Ali led the main development effort. Faisal Iqbal joined during the
hackathon period and resolved API-related issues, improved the integration of
live data, and managed fixes to the prediction system. Their combined work
formed the core of the project's functionality and final implementation.
