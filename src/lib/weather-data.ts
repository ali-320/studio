// Represents a decade of authentic-looking mock data.
// In a real application, this would come from a weather API.

export const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 9 + i);

/**
 * Deterministically generates mock monthly weather data based on a seed (coordinates).
 */
export const generateMonthlyData = (year: number, lat: number = 0, lon: number = 0) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create a pseudo-random seed based on lat/lon
    const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 43758.5453;
    const baseTemp = 10 + (year % 5) + (seed % 10); 
    const baseRain = 50 + (year % 10) * 5 + (seed % 20);

    return months.map((month, index) => {
        const seasonFactor = Math.sin((index / 12) * 2 * Math.PI - Math.PI / 2);
        const temp = baseTemp + seasonFactor * 15 + ((seed * (index + 1)) % 4);
        const rainfall = baseRain + (seasonFactor > 0.5 ? 100 : 0) + ((seed * (index + 2)) % 50);
        
        return {
            month,
            temp: parseFloat(temp.toFixed(1)),
            rainfall: parseFloat(rainfall.toFixed(0)),
        };
    });
};

/**
 * Deterministically generates mock glacier data based on a seed (coordinates).
 */
export const generateGlacierData = (year: number, lat: number = 0, lon: number = 0) => {
    const mountains = ['K2', 'Nanga Parbat', 'Gasherbrum I', 'Broad Peak', 'Rakaposhi'];
    const seed = Math.abs(Math.cos(lat * 12.9898 + lon * 78.233)) * 43758.5453;
    const meltFactor = (year - years[0]) * 0.5;

    return mountains.map((mountain, index) => {
        const baseThickness = 150 - index * 20 + (seed % 15);
        const thickness = baseThickness - meltFactor - ((seed * (index + 1)) % 5);
        return {
            mountain,
            thickness: parseFloat(thickness.toFixed(2)),
        };
    });
};
