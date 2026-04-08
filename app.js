/**
 * ========================================
 * app.js - Main Application Logic
 * Dashboard with Chart.js visualizations
 * ========================================
 */

// ========================================
// State Management
// ========================================
const state = {
    currentCity: 'mumbai',
    currentTab: 'dashboard',
    dataRange: '24h',
    theme: 'dark',
    charts: {},
    demandData: [],
    weatherData: [],
    isLoading: false
};

// ========================================
// Chart.js Default Configuration
// ========================================
Chart.defaults.color = '#a0a0b0';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
Chart.defaults.font.family = "'Inter', sans-serif";

// ========================================
// Initialize Application
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadCityData(state.currentCity);
    updateLastUpdated();
});

// ========================================
// Event Listeners
// ========================================
function initEventListeners() {
    // City selector
    const citySelect = document.getElementById('citySelect');
    citySelect.addEventListener('change', (e) => {
        state.currentCity = e.target.value;
        loadCityData(state.currentCity);
    });
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', () => {
        loadCityData(state.currentCity);
        updateLastUpdated();
    });
    
    // Chart range controls
    document.querySelectorAll('.chart-range').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-range').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.dataRange = e.target.dataset.range;
            updateCharts();
        });
    });
}

// ========================================
// Data Loading
// ========================================
function loadCityData(cityId) {
    if (state.isLoading) return;
    state.isLoading = true;
    
    const profile = LOCALITY_PROFILES[cityId];
    if (!profile) {
        console.error('Unknown city:', cityId);
        return;
    }
    
    // Generate data
    const days = state.dataRange === '24h' ? 1 : state.dataRange === '7d' ? 7 : 30;
    state.demandData = generateDemandData(profile, days);
    state.weatherData = generateWeatherData(profile, days);
    
    // Update UI
    updateKPICards();
    updateCharts();
    updateRecommendations();
    
    state.isLoading = false;
}

function updateLastUpdated() {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = formatted;
}

// ========================================
// KPI Cards Update
// ========================================
function updateKPICards() {
    const currentDemand = state.demandData[state.demandData.length - 1]?.demand || 0;
    const prevDemand = state.demandData[state.demandData.length - 2]?.demand || currentDemand;
    const demandChange = ((currentDemand - prevDemand) / prevDemand * 100).toFixed(1);
    
    const currentWeather = state.weatherData[state.weatherData.length - 1] || {};
    const currentTemp = currentWeather.temperature || 0;
    
    const energyMix = calculateEnergyMix(currentWeather);
    const renewable = energyMix.renewable;
    
    // Determine grid status
    const avgDemand = state.demandData.reduce((sum, d) => sum + d.demand, 0) / state.demandData.length;
    const loadPercent = (currentDemand / avgDemand) * 100;
    let gridStatus = 'Normal';
    if (loadPercent > 90) gridStatus = 'High';
    if (loadPercent > 100) gridStatus = 'Critical';
    
    // Update DOM
    document.getElementById('currentDemand').textContent = formatNumber(currentDemand, 0) + ' MW';
    document.getElementById('demandChange').textContent = `${demandChange > 0 ? '+' : ''}${demandChange}%`;
    document.getElementById('demandChange').className = `kpi-change ${demandChange >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('currentTemp').textContent = currentTemp.toFixed(1) + '°C';
    document.getElementById('tempChange').textContent = getTempStatus(currentTemp);
    
    document.getElementById('renewableShare').textContent = renewable + '%';
    
    document.getElementById('gridStatus').textContent = gridStatus;
    document.getElementById('gridStatus').style.color = gridStatus === 'Critical' ? '#ef4444' : gridStatus === 'High' ? '#f59e0b' : '#10b981';
    document.getElementById('gridLoad').textContent = loadPercent.toFixed(0) + '% load';
}

function getTempStatus(temp) {
    if (temp > 35) return 'Heat Wave 🔴';
    if (temp > 30) return 'Warm 🟡';
    if (temp < 10) return 'Cold 🟡';
    return 'Normal 🟢';
}

// ========================================
// Charts Update
// ========================================
function updateCharts() {
    updateDemandChart();
    updateEnergyMixChart();
    updateWeatherChart();
    updateHeatmapChart();
}

function updateDemandChart() {
    const ctx = document.getElementById('demandChart').getContext('2d');
    const days = state.dataRange === '24h' ? 1 : state.dataRange === '7d' ? 7 : 30;
    
    // Split data into historical and forecast
    const splitPoint = Math.floor(state.demandData.length * 0.8);
    const historical = state.demandData.slice(0, splitPoint);
    const forecast = state.demandData.slice(splitPoint);
    
    const labels = state.demandData.map(d => formatTime(d.timestamp));
    const historicalData = historical.map(d => d.demand);
    const forecastData = [...Array(splitPoint).fill(null), ...forecast.map(d => d.demand)];
    
    if (state.charts.demand) {
        state.charts.demand.destroy();
    }
    
    state.charts.demand = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Historical',
                    data: [...historicalData, ...Array(state.demandData.length - splitPoint).fill(null)],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Forecast',
                    data: forecastData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#a0a0b0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatNumber(context.raw, 0)} MW`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 12
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        callback: (value) => formatNumber(value, 0) + ' MW'
                    }
                }
            }
        }
    });
}

function updateEnergyMixChart() {
    const ctx = document.getElementById('energyMixChart').getContext('2d');
    const currentWeather = state.weatherData[state.weatherData.length - 1] || {};
    const mix = calculateEnergyMix(currentWeather);
    
    if (state.charts.energyMix) {
        state.charts.energyMix.destroy();
    }
    
    state.charts.energyMix = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Solar', 'Wind', 'Hydro', 'Thermal'],
            datasets: [{
                data: [mix.solar, mix.wind, mix.hydro, mix.thermal],
                backgroundColor: ['#ffd700', '#87ceeb', '#0066cc', '#ff6b6b'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw}%`
                    }
                }
            }
        }
    });
}

function updateWeatherChart() {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    
    const labels = state.weatherData.slice(-48).map(d => formatTime(d.timestamp));
    const tempData = state.weatherData.slice(-48).map(d => d.temperature);
    const demandData = state.demandData.slice(-48).map(d => d.demand);
    
    // Normalize demand for comparison
    const maxDemand = Math.max(...demandData);
    const normalizedDemand = demandData.map(d => (d / maxDemand) * 40);
    
    if (state.charts.weather) {
        state.charts.weather.destroy();
    }
    
    state.charts.weather = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    yAxisID: 'y',
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Demand (normalized)',
                    data: normalizedDemand,
                    borderColor: '#6366f1',
                    backgroundColor: 'transparent',
                    yAxisID: 'y1',
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true
                    }
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    display: false,
                    min: 0,
                    max: 40
                }
            }
        }
    });
}

function updateHeatmapChart() {
    const ctx = document.getElementById('heatmapChart').getContext('2d');
    
    // Aggregate demand by hour and day of week
    const heatmapData = Array(7).fill(null).map(() => Array(24).fill(0));
    const counts = Array(7).fill(null).map(() => Array(24).fill(0));
    
    state.demandData.forEach(d => {
        const dayOfWeek = d.dayOfWeek;
        const hour = d.hour;
        heatmapData[dayOfWeek][hour] += d.demand;
        counts[dayOfWeek][hour]++;
    });
    
    // Average
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 24; j++) {
            if (counts[i][j] > 0) {
                heatmapData[i][j] /= counts[i][j];
            }
        }
    }
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Flatten for Chart.js
    const flatData = heatmapData.flat();
    
    if (state.charts.heatmap) {
        state.charts.heatmap.destroy();
    }
    
    state.charts.heatmap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours.flatMap(h => days.map(d => `${d} ${h}:00`)),
            datasets: [{
                label: 'Avg Demand',
                data: flatData,
                backgroundColor: flatData.map(v => {
                    const max = Math.max(...flatData);
                    const min = Math.min(...flatData);
                    const normalized = (v - min) / (max - min);
                    return `rgba(99, 102, 241, ${0.3 + normalized * 0.7})`;
                }),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        maxTicksLimit: 24,
                        font: { size: 9 }
                    }
                },
                y: {
                    display: false
                }
            }
        }
    });
}

// ========================================
// Recommendations Update
// ========================================
function updateRecommendations() {
    const currentWeather = state.weatherData[state.weatherData.length - 1] || {};
    const currentDemand = state.demandData[state.demandData.length - 1]?.demand || 0;
    const hour = currentWeather.hour || 12;
    
    const recommendations = getRecommendations(currentWeather, currentDemand, hour);
    
    const container = document.getElementById('recommendationsList');
    container.innerHTML = '';
    
    recommendations.slice(0, 6).forEach(rec => {
        const item = document.createElement('div');
        item.className = `recommendation-item ${rec.priority}`;
        item.innerHTML = `
            <span class="recommendation-icon">${rec.icon}</span>
            <div class="recommendation-content">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <div class="recommendation-meta">
                    <span class="recommendation-priority ${rec.priority}">${rec.priority}</span>
                    <span>💰 ${rec.savings}</span>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No recommendations at this time.</p>';
    }
}

// ========================================
// Tab Navigation
// ========================================
function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
    });
    
    // Update title
    const titles = {
        dashboard: 'Dashboard Overview',
        forecast: 'Demand Forecast',
        analytics: 'Analytics',
        'energy-mix': 'Energy Mix',
        settings: 'Settings'
    };
    document.querySelector('.page-title').textContent = titles[tabId] || 'Dashboard';
    
    // In a full implementation, we'd show/hide sections
    // For now, all sections are visible on one page
}

// ========================================
// Theme Toggle
// ========================================
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    
    const toggleBtn = document.getElementById('themeToggle');
    toggleBtn.querySelector('span').textContent = state.theme === 'dark' ? '🌙' : '☀️';
    
    // Update charts for theme
    updateCharts();
}

// ========================================
// Utility Functions
// ========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
