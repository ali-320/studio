
type WeatherData = {
    date: string;
    rainfall: number;
    temperature: number;
};

type YearlyWeatherData = {
    [year: number]: WeatherData[];
};

const generateRandomData = (baseRainfall: number, baseTemp: number): WeatherData[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map(month => ({
        date: `${month}`,
        rainfall: Math.max(0, Math.round(baseRainfall + (Math.random() - 0.5) * 50)),
        temperature: Math.round(baseTemp + (Math.random() - 0.5) * 5),
    }));
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

export const historicalWeatherData: YearlyWeatherData = years.reduce((acc, year) => {
    // Adjust base values for variety
    const baseRainfall = 150 - (currentYear - year) * 5;
    const baseTemp = 10 + (currentYear - year) * 0.5;
    acc[year] = generateRandomData(baseRainfall, baseTemp);
    return acc;
}, {} as YearlyWeatherData);


export const glacierData = [
    { year: 2010, mass: 100 },
    { year: 2012, mass: 98 },
    { year: 2014, mass: 95 },
    { year: 2016, mass: 91 },
    { year: 2018, mass: 88 },
    { year: 2020, mass: 85 },
    { year: 2022, mass: 81 },
    { year: 2024, mass: 78 },
];

export const terrainData = [
  { name: 'Elevation < 50m', value: 400, fill: 'var(--color-terrain1)' },
  { name: 'Elevation 50-200m', value: 300, fill: 'var(--color-terrain2)' },
  { name: 'Elevation 200-500m', value: 300, fill: 'var(--color-terrain3)' },
  { name: 'Elevation > 500m', value: 200, fill: 'var(--color-terrain4)' },
];
