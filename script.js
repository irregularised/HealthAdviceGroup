const apiToken = "5770de019f7a4d1db1e202716250302";
let airQualityChart;

document.addEventListener("DOMContentLoaded", () => {
    fetchAirQuality();
    setupAccessibility();
});

// AQI Ranges and Status Definitions
const aqiRanges = {
    good: { min: 0, max: 50, color: '#00e400', text: 'Good' },
    moderate: { min: 51, max: 100, color: '#ffff00', text: 'Moderate' },
    unhealthySensitive: { min: 101, max: 150, color: '#ff7e00', text: 'Unhealthy for Sensitive Groups' },
    unhealthy: { min: 151, max: 200, color: '#ff0000', text: 'Unhealthy' },
    veryUnhealthy: { min: 201, max: 300, color: '#8f3f97', text: 'Very Unhealthy' },
    hazardous: { min: 301, max: Infinity, color: '#7e0023', text: 'Hazardous' }
};

// Function to Get AQI Status
function getAQIStatus(value) {
    for (const [level, range] of Object.entries(aqiRanges)) {
        if (value >= range.min && value <= range.max) {
            return {
                level: range.text,
                color: range.color
            };
        }
    }
    return { level: 'Unknown', color: '#gray' };
}

// Function to Get Health Recommendations
function getHealthRecommendations(aqi) {
    if (aqi <= 50) return "Air quality is good. It's a great time for outdoor activities!";
    if (aqi <= 150) return "Air quality is acceptable. However, sensitive individuals should consider limiting prolonged outdoor exposure.";
    if (aqi <= 400) return "Members of sensitive groups may experience health effects. The general public is less likely to be affected.";
    if (aqi <= 500) return "Everyone may begin to experience health effects. Sensitive groups should avoid outdoor activities.";
    if (aqi <= 1000) return "Health alert: The risk of health effects is increased for everyone. Avoid outdoor activities.";
    return "Health warning: Everyone should avoid all outdoor activities.";
}

// Function to Calculate Overall AQI
function calculateOverallAQI(airQuality) {
    const pollutants = ["pm2_5", "pm10", "o3", "no2", "so2", "co"];
    return Math.max(...pollutants.map(pollutant => airQuality[pollutant] || 0));
}

// Fetch Air Quality Data
async function fetchAirQuality() {
    const city = document.getElementById("cityInput").value || "London";
    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiToken}&q=${city}&aqi=yes`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        const airQuality = data.current.air_quality;
        const overallAQI = calculateOverallAQI(airQuality); // Calculate overall AQI
        
        updateDashboard(airQuality, city);
        updateRecommendations(overallAQI); // Pass the calculated AQI to update recommendations
    } catch (error) {
        console.error("Failed to fetch air quality data:", error);
        showError("Failed to fetch air quality data. Please try again.");
    }
}

// Update Dashboard with Air Quality Data
function updateDashboard(airQuality, city) {
    updateTable(airQuality);
    updateChart(airQuality);
}

// Update Table with Air Quality Metrics
function updateTable(airQuality) {
    const tableBody = document.getElementById("airQualityTable");
    tableBody.innerHTML = "";
    
    const parameters = {
        "pm2_5": "PM2.5",
        "pm10": "PM10",
        "o3": "Ozone",
        "no2": "Nitrogen Dioxide",
        "so2": "Sulfur Dioxide",
        "co": "Carbon Monoxide"
    };
    
    Object.entries(parameters).forEach(([key, label]) => {
        if (airQuality[key]) {
            const value = airQuality[key].toFixed(2);
            const status = getAQIStatus(value);
            const row = `
                <tr>
                    <td>${label}</td>
                    <td>${value}</td>
                    <td><span class="badge" style="background-color: ${status.color}" aria-label="${status.level}">${status.level}</span></td>
                </tr>`;
            tableBody.innerHTML += row;
        }
    });
}

// Update Chart with Air Quality Metrics
function updateChart(airQuality) {
    const ctx = document.getElementById("airQualityChart").getContext("2d");
    
    if (airQualityChart) {
        airQualityChart.destroy();
    }
    
    const labels = {
        "pm2_5": "PM2.5",
        "pm10": "PM10",
        "o3": "Ozone",
        "no2": "NO₂",
        "so2": "SO₂",
        "co": "CO"
    };
    
    const chartData = {
        labels: Object.values(labels),
        datasets: [{
            label: 'Air Quality Metrics',
            data: Object.keys(labels).map(key => airQuality[key]),
            backgroundColor: Object.keys(labels).map(key => 
                getAQIStatus(airQuality[key]).color + '80'),
            borderColor: Object.keys(labels).map(key => 
                getAQIStatus(airQuality[key]).color),
            borderWidth: 1
        }]
    };
    
    airQualityChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update Health Recommendations
function updateRecommendations(aqiIndex) {
    const recommendationsDiv = document.getElementById("healthRecommendations");
    const recommendation = getHealthRecommendations(aqiIndex); // Get recommendations based on AQI
    recommendationsDiv.textContent = recommendation;
    
    // Set appropriate alert class based on AQI
    const alertClass = aqiIndex <= 50 ? 'alert-success' :
                      aqiIndex <= 100 ? 'alert-info' :
                      aqiIndex <= 150 ? 'alert-warning' : 'alert-danger';
    recommendationsDiv.className = `alert ${alertClass}`;
    recommendationsDiv.setAttribute("aria-live", "polite");
}

// Show Error Messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = message;
    errorDiv.setAttribute("role", "alert");
    document.querySelector('.air-quality-container').prepend(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Setup Accessibility Features
function setupAccessibility() {
    document.getElementById("cityInput").setAttribute("aria-label", "Enter city name");
    document.getElementById("fetchDataButton").setAttribute("aria-label", "Fetch air quality data");
    document.getElementById("healthRecommendations").setAttribute("role", "status");
}