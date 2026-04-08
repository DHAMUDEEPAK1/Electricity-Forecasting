/**
 * ========================================
 * data.js - Locality Profiles & Data Generation
 * Ported from Python data_pipeline.py and utils.py
 * ========================================
 */

// ========================================
// Configuration Constants
// ========================================
const CONFIG = {
    MAX_SOLAR_PERCENT: 40,
    MAX_WIND_PERCENT: 35,
    MAX_HYDRO_PERCENT: 50,
    MIN_THERMAL_PERCENT: 20,
    
    SOLAR_EFFICIENCY: 0.85,
    WIND_EFFICIENCY: 0.40,
    HYDRO_EFFICIENCY: 0.90,
    
    HEAT_WAVE_TEMP: 35,
    COLD_WAVE_TEMP: 10,
    GOOD_WIND_LOW: 3,
    GOOD_WIND_HIGH: 12,
    CLOUDY_THRESHOLD: 70,
    
    MORNING_PEAK_START: 7,
    MORNING_PEAK_END: 10,
    EVENING_PEAK_START: 18,
    EVENING_PEAK_END: 21,
    
    RESIDENTIAL_PRICE: 8.5,
    COMMERCIAL_PRICE: 12.0,
    INDUSTRIAL_PRICE: 7.5,
    
    GRID_CARBON: 0.82,
    SOLAR_CARBON: 0.05,
    WIND_CARBON: 0.01,
    HYDRO_CARBON: 0.02,
    THERMAL_CARBON: 0.95
};

// ========================================
// Locality Profiles
// ========================================
const LOCALITY_PROFILES = {
    mumbai: {
        name: "Mumbai",
        country: "India",
        lat: 19.0760,
        lon: 72.8777,
        timezone: "Asia/Kolkata",
        baseDemand: 3500,
        peakMultiplier: 1.3,
        energyMix: { solar: 8, wind: 5, hydro: 3, thermal: 84 },
        seasonalPattern: "monsoon"
    },
    delhi: {
        name: "Delhi",
        country: "India",
        lat: 28.7041,
        lon: 77.1025,
        timezone: "Asia/Kolkata",
        baseDemand: 2800,
        peakMultiplier: 1.4,
        energyMix: { solar: 12, wind: 8, hydro: 5, thermal: 75 },
        seasonalPattern: "extreme"
    },
    bangalore: {
        name: "Bangalore",
        country: "India",
        lat: 12.9716,
        lon: 77.5946,
        timezone: "Asia/Kolkata",
        baseDemand: 1800,
        peakMultiplier: 1.25,
        energyMix: { solar: 15, wind: 10, hydro: 8, thermal: 67 },
        seasonalPattern: "moderate"
    },
    chennai: {
        name: "Chennai",
        country: "India",
        lat: 13.0827,
        lon: 80.2707,
        timezone: "Asia/Kolkata",
        baseDemand: 1600,
        peakMultiplier: 1.35,
        energyMix: { solar: 10, wind: 6, hydro: 4, thermal: 80 },
        seasonalPattern: "coastal"
    },
    kolkata: {
        name: "Kolkata",
        country: "India",
        lat: 22.5726,
        lon: 88.3639,
        timezone: "Asia/Kolkata",
        baseDemand: 1900,
        peakMultiplier: 1.28,
        energyMix: { solar: 8, wind: 7, hydro: 6, thermal: 79 },
        seasonalPattern: "monsoon"
    },
    hyderabad: {
        name: "Hyderabad",
        country: "India",
        lat: 17.3850,
        lon: 78.4867,
        timezone: "Asia/Kolkata",
        baseDemand: 1700,
        peakMultiplier: 1.26,
        energyMix: { solar: 14, wind: 9, hydro: 7, thermal: 70 },
        seasonalPattern: "moderate"
    },
    london: {
        name: "London",
        country: "UK",
        lat: 51.5074,
        lon: -0.1278,
        timezone: "Europe/London",
        baseDemand: 45000,
        peakMultiplier: 1.2,
        energyMix: { solar: 8, wind: 25, hydro: 2, thermal: 65 },
        seasonalPattern: "temperate"
    },
    newyork: {
        name: "New York",
        country: "USA",
        lat: 40.7128,
        lon: -74.0060,
        timezone: "America/New_York",
        baseDemand: 55000,
        peakMultiplier: 1.25,
        energyMix: { solar: 8, wind: 10, hydro: 2, thermal: 80 },
        seasonalPattern: "continental"
    },
    tokyo: {
        name: "Tokyo",
        country: "Japan",
        lat: 35.6762,
        lon: 139.6503,
        timezone: "Asia/Tokyo",
        baseDemand: 48000,
        peakMultiplier: 1.22,
        energyMix: { solar: 10, wind: 5, hydro: 8, thermal: 77 },
        seasonalPattern: "humid"
    },
    sydney: {
        name: "Sydney",
        country: "Australia",
        lat: -33.8688,
        lon: 151.2093,
        timezone: "Australia/Sydney",
        baseDemand: 12000,
        peakMultiplier: 1.18,
        energyMix: { solar: 15, wind: 20, hydro: 10, thermal: 55 },
        seasonalPattern: "oceanic"
    }
};

// ========================================
// Data Generation Functions
// ========================================

/**
 * Generate demand data based on locality profile
 */
function generateDemandData(profile, days = 7) {
    const data = [];
    const now = new Date();
    const hours = days * 24;
    
    for (let i = 0; i < hours; i++) {
        const timestamp = new Date(now.getTime() - (hours - i) * 3600000);
        const hour = timestamp.getHours();
        const dayOfWeek = timestamp.getDay();
        const month = timestamp.getMonth();
        
        // Base demand
        let demand = profile.baseDemand;
        
        // Hourly pattern (peak at 9am and 9pm)
        const hourlyPattern = Math.sin((hour - 6) * Math.PI / 12);
        demand += demand * 0.15 * hourlyPattern;
        
        // Weekly pattern (lower on weekends)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            demand *= 0.85;
        }
        
        // Seasonal pattern
        const seasonalMultiplier = getSeasonalMultiplier(month, profile.seasonalPattern);
        demand *= seasonalMultiplier;
        
        // Add random noise
        demand += (Math.random() - 0.5) * demand * 0.08;
        
        data.push({
            timestamp: timestamp.toISOString(),
            hour: hour,
            dayOfWeek: dayOfWeek,
            month: month + 1,
            demand: Math.max(demand, profile.baseDemand * 0.4)
        });
    }
    
    return data;
}

/**
 * Generate weather data based on locality
 */
function generateWeatherData(profile, days = 7) {
    const data = [];
    const now = new Date();
    const hours = days * 24;
    
    const baseTemp = getBaseTemperature(profile.lat);
    
    for (let i = 0; i < hours; i++) {
        const timestamp = new Date(now.getTime() - (hours - i) * 3600000);
        const hour = timestamp.getHours();
        const month = timestamp.getMonth();
        
        // Temperature with daily cycle
        const dailyTemp = baseTemp + 5 * Math.sin((hour - 6) * Math.PI / 12);
        const seasonalTemp = 8 * Math.sin((month - 3) * Math.PI / 6);
        const temperature = dailyTemp + seasonalTemp + (Math.random() - 0.5) * 3;
        
        // Other weather variables
        const humidity = 50 + 30 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 15;
        const windSpeed = 3 + 5 * Math.random();
        const cloudCover = 20 + 40 * Math.random();
        
        // Solar radiation (0 at night)
        const solarRad = (hour >= 6 && hour <= 18) ? 
            5 * Math.sin((hour - 6) * Math.PI / 12) * (1 - cloudCover / 150) : 0;
        
        data.push({
            timestamp: timestamp.toISOString(),
            hour: hour,
            temperature: temperature,
            humidity: Math.max(20, Math.min(95, humidity)),
            windSpeed: windSpeed,
            cloudCover: Math.max(0, Math.min(100, cloudCover)),
            solarRadiation: Math.max(0, solarRad)
        });
    }
    
    return data;
}

/**
 * Calculate energy mix based on weather
 */
function calculateEnergyMix(weather) {
    const { cloudCover, windSpeed, solarRadiation, hour, temperature } = weather;
    
    // Solar calculation
    let solar = 25;
    if (hour >= 6 && hour <= 18) {
        solar = Math.max(0, 40 - cloudCover * 0.6);
    } else {
        solar = 0;
    }
    solar = Math.min(solar, CONFIG.MAX_SOLAR_PERCENT);
    
    // Wind calculation
    let wind = 0;
    if (windSpeed < 3) {
        wind = Math.max(0, windSpeed * 5);
    } else if (windSpeed <= 12) {
        wind = Math.min(35, 15 + (windSpeed - 3) * 2);
    } else {
        wind = Math.max(0, 35 - (windSpeed - 12) * 3);
    }
    wind = wind * CONFIG.WIND_EFFICIENCY;
    wind = Math.min(wind, CONFIG.MAX_WIND_PERCENT);
    
    // Hydro (simplified)
    const hydro = 10 + Math.random() * 5;
    
    // Thermal (fills the rest)
    let thermal = 100 - (solar + wind + hydro);
    thermal = Math.max(thermal, CONFIG.MIN_THERMAL_PERCENT);
    
    return {
        solar: Math.round(solar),
        wind: Math.round(wind),
        hydro: Math.round(hydro),
        thermal: Math.round(thermal),
        renewable: Math.round(solar + wind + hydro)
    };
}

/**
 * Get recommendations based on weather and demand
 */
function getRecommendations(weather, demand, hour) {
    const recommendations = [];
    const { temperature, humidity, windSpeed, cloudCover } = weather;
    const demandValue = demand || 3000;
    
    // Temperature-based recommendations
    if (temperature > CONFIG.HEAT_WAVE_TEMP) {
        recommendations.push({
            icon: '🌡️',
            title: 'Heat Wave Alert',
            description: `Temperature ${temperature.toFixed(1)}°C exceeds threshold. Pre-cool buildings before peak hours (6-9 PM).`,
            priority: 'high',
            savings: '15-20% cooling costs'
        });
    }
    
    // Wind-based recommendations
    if (windSpeed >= CONFIG.GOOD_WIND_LOW && windSpeed <= CONFIG.GOOD_WIND_HIGH) {
        recommendations.push({
            icon: '💨',
            title: 'High Wind - Clean Energy Available',
            description: `Wind speed ${windSpeed.toFixed(1)} m/s is optimal. Charge EVs/batteries during this period.`,
            priority: 'medium',
            savings: 'Reduce carbon by 30%'
        });
    }
    
    // Cloud cover recommendations
    if (cloudCover > CONFIG.CLOUDY_THRESHOLD) {
        recommendations.push({
            icon: '☁️',
            title: 'Low Solar Expected',
            description: `${cloudCover.toFixed(0)}% cloud cover reduces solar generation. Consider reducing non-essential loads.`,
            priority: 'medium',
            savings: '5-10% energy savings'
        });
    }
    
    // Peak hours
    if ((hour >= CONFIG.EVENING_PEAK_START && hour <= 21) || (hour >= CONFIG.MORNING_PEAK_START && hour <= CONFIG.MORNING_PEAK_END)) {
        recommendations.push({
            icon: '⚡',
            title: 'Peak Demand Period',
            description: 'Current time is peak demand period. Avoid running high-power appliances.',
            priority: 'high',
            savings: 'Avoid peak charges'
        });
    }
    
    // Off-peak
    if (hour >= 22 || hour <= 5) {
        recommendations.push({
            icon: '🌙',
            title: 'Off-Peak Hours',
            description: 'Current time is off-peak. Good time for high-consumption tasks.',
            priority: 'low',
            savings: '30-50% cheaper rates'
        });
    }
    
    // Humidity
    if (humidity > 80 && temperature > 30) {
        recommendations.push({
            icon: '💦',
            title: 'High Humidity Warning',
            description: `${humidity.toFixed(0)}% humidity with ${temperature.toFixed(1)}°C feels hotter. Use fans instead of AC when possible.`,
            priority: 'medium',
            savings: '10-15% cooling costs'
        });
    }
    
    // Low wind
    if (windSpeed < CONFIG.GOOD_WIND_LOW) {
        recommendations.push({
            icon: '🔔',
            title: 'Low Wind - High Thermal Expected',
            description: `Wind ${windSpeed.toFixed(1)} m/s below optimal. Grid will rely more on thermal generation.`,
            priority: 'low',
            savings: 'Expect higher rates'
        });
    }
    
    return recommendations;
}

// ========================================
// Helper Functions
// ========================================

function getSeasonalMultiplier(month, pattern) {
    const multipliers = {
        extreme: [1.3, 1.25, 1.1, 0.95, 0.9, 1.0, 1.15, 1.2, 1.1, 0.95, 1.1, 1.35],
        monsoon: [1.1, 1.05, 1.0, 0.95, 1.2, 1.35, 1.3, 1.25, 1.15, 1.0, 0.95, 1.05],
        moderate: [1.0, 0.98, 1.0, 0.95, 0.92, 0.95, 1.0, 1.05, 1.0, 0.95, 0.98, 1.02],
        coastal: [0.95, 0.92, 0.95, 0.98, 1.0, 1.1, 1.15, 1.18, 1.1, 0.98, 0.95, 0.92],
        temperate: [1.15, 1.1, 1.0, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2],
        continental: [1.25, 1.2, 1.05, 0.9, 0.85, 0.95, 1.1, 1.15, 1.0, 0.9, 1.05, 1.3],
        humid: [1.0, 0.98, 1.0, 1.05, 1.1, 1.2, 1.25, 1.3, 1.15, 1.0, 0.98, 1.0],
        oceanic: [0.95, 0.92, 0.95, 1.0, 1.1, 1.2, 1.3, 1.35, 1.2, 1.05, 0.95, 0.92]
    };
    
    const patternMultipliers = multipliers[pattern] || multipliers.moderate;
    return patternMultipliers[month];
}

function getBaseTemperature(latitude) {
    // Approximate base temperature based on latitude
    const absLat = Math.abs(latitude);
    if (absLat < 20) return 28; // Tropical
    if (absLat < 35) return 22; // Subtropical
    if (absLat < 50) return 15; // Temperate
    return 8; // Continental
}

function formatNumber(num, decimals = 0) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        LOCALITY_PROFILES,
        generateDemandData,
        generateWeatherData,
        calculateEnergyMix,
        getRecommendations,
        formatNumber,
        formatTime,
        formatDate
    };
}
