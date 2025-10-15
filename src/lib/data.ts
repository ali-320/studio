
type WeatherData = {
    date: string;
    rainfall: number;
    temperature: number;
};

type YearlyWeatherData = {
    [year: number]: {
        [region: string]: WeatherData[];
    };
};

const generateRandomData = (baseRainfall: number, baseTemp: number, regionModifier: number): WeatherData[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map(month => ({
        date: `${month}`,
        rainfall: Math.max(0, Math.round(baseRainfall * regionModifier + (Math.random() - 0.5) * 50)),
        temperature: Math.round(baseTemp + (Math.random() - 0.5) * 5),
    }));
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - i);
const regions = ["Punjab", "New Orleans, USA", "Karachi, Pakistan"]; // Example regions

const historicalWeatherData: YearlyWeatherData = years.reduce((acc, year) => {
    acc[year] = {};
    const baseRainfall = 150 - (currentYear - year) * 5;
    const baseTemp = 10 + (currentYear - year) * 0.5;
    
    regions.forEach((region, index) => {
      // Create some variation for different regions
      const regionModifier = 1 + (index * 0.2) - 0.1;
      acc[year][region] = generateRandomData(baseRainfall, baseTemp, regionModifier);
    });
    // Add a default for unknown regions
    acc[year]["default"] = generateRandomData(baseRainfall, baseTemp, 1);

    return acc;
}, {} as YearlyWeatherData);


export const getHistoricalWeatherData = (year: number, region: string): WeatherData[] => {
    const yearData = historicalWeatherData[year];
    if (yearData) {
        // Find a matching region, case-insensitively
        const matchingRegion = Object.keys(yearData).find(r => r.toLowerCase() === region.toLowerCase());
        return yearData[matchingRegion || 'default'] || [];
    }
    return [];
};


export const glacierData = [
    { mountain: "Himalayas", mass: 100 },
    { mountain: "Karakoram", mass: 98 },
    { mountain: "Hindu Kush", mass: 95 },
    { mountain: "Pamir", mass: 91 },
    { mountain: "Andes", mass: 88 },
    { mountain: "Alps", mass: 85 },
    { mountain: "Rockies", mass: 81 },
    { mountain: "Caucasus", mass: 78 },
];

const defaultTerrainData = [
  { name: 'Elevation < 50m', value: 400, fill: 'var(--color-terrain1)' },
  { name: 'Elevation 50-200m', value: 300, fill: 'var(--color-terrain2)' },
  { name: 'Elevation 200-500m', value: 300, fill: 'var(--color-terrain3)' },
  { name: 'Elevation > 500m', value: 200, fill: 'var(--color-terrain4)' },
];

const regionTerrainData: { [key: string]: any[] } = {
  "punjab": [
    { name: 'Plains < 100m', value: 600, fill: 'var(--color-terrain1)' },
    { name: 'Low Hills 100-300m', value: 250, fill: 'var(--color-terrain2)' },
    { name: 'Pothohar Plateau 300-600m', value: 150, fill: 'var(--color-terrain3)' },
  ],
  "new orleans, usa": [
    { name: 'Below Sea Level', value: 500, fill: 'var(--color-terrain1)' },
    { name: 'Sea Level to 5m', value: 400, fill: 'var(--color-terrain2)' },
    { name: 'Natural Levees 5-10m', value: 100, fill: 'var(--color-terrain3)' },
  ],
  "karachi, pakistan": [
    { name: 'Coastal Plains 0-20m', value: 700, fill: 'var(--color-terrain1)' },
    { name: 'Rolling Hills 20-100m', value: 200, fill: 'var(--color-terrain2)' },
    { name: 'Mangrove Forests', value: 100, fill: 'var(--color-terrain3)' },
  ]
};

export const getTerrainData = (region: string) => {
    const regionKey = region.toLowerCase();
    return regionTerrainData[regionKey] || defaultTerrainData;
};
