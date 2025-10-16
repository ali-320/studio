// Represents a decade of authentic-looking mock data.
// In a real application, this would come from a weather API.

export const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 9 + i);

const generateMonthlyData = (year: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseTemp = 10 + (year % 5); // Base temperature varies slightly per year
    const baseRain = 50 + (year % 10) * 5; // Base rainfall varies

    return months.map((month, index) => {
        // Simple seasonality simulation
        const seasonFactor = Math.sin((index / 12) * 2 * Math.PI - Math.PI / 2); // Peaks in summer
        const temp = baseTemp + seasonFactor * 15 + (Math.random() - 0.5) * 4; // Temp varies seasonally
        const rainfall = baseRain + (seasonFactor > 0.5 ? 100 : 0) + Math.random() * 50; // More rain in 'summer'
        
        return {
            month,
            temp: parseFloat(temp.toFixed(1)),
            rainfall: parseFloat(rainfall.toFixed(0)),
        };
    });
};

export const weatherData = years.map(year => ({
    year,
    data: generateMonthlyData(year),
}));


const generateGlacierData = (year: number) => {
    const mountains = ['K2', 'Nanga Parbat', 'Gasherbrum I', 'Broad Peak', 'Rakaposhi'];
    // Simulate slight glacier melt over the decade
    const meltFactor = (year - years[0]) * 0.5;

    return mountains.map((mountain, index) => {
        const baseThickness = 150 - index * 20; // Different base thickness for each
        const thickness = baseThickness - meltFactor - Math.random() * 5;
        return {
            mountain,
            thickness: parseFloat(thickness.toFixed(2)),
        };
    });
};

export const glacierData = years.map(year => ({
    year,
    data: generateGlacierData(year),
}));
