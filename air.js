// Fetch coordinates using Geocoding API
async function getLocationCoordinates(location) {
    const apiKey = '5770de019f7a4d1db1e202716250302'; // Your API key
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;

    try {
        const response = await fetch(geocodingUrl);
        if (!response.ok) {
            throw new Error(`Error fetching location coordinates: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.length === 0) {
            throw new Error('Location not found.');
        }
        return { lat: data[0].lat, lon: data[0].lon };
    } catch (error) {
        console.error('Failed to fetch location coordinates:', error.message);
        return null;
    }
}

// Fetch air quality data using Air Pollution API
async function fetchAirQualityData(lat, lon) {
    const apiKey = '5770de019f7a4d1db1e202716250302'; // Your API key
    const apiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Error fetching air quality data: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch air quality data:', error.message);
        return null;
    }
}

// Update air quality metrics
function updateMetrics(data) {
    if (!data || !data.list || data.list.length === 0) {
        console.error('No air quality data available.');
        return;
    }

    const airQuality = data.list[0].components; // Extract components from the API response

    document.getElementById('pm25-value').textContent = airQuality.pm2_5;
    document.getElementById('pm10-value').textContent = airQuality.pm10;
    document.getElementById('o3-value').textContent = airQuality.o3;
    document.getElementById('no2-value').textContent = airQuality.no2;

    // Add status based on thresholds (example logic)
    document.getElementById('pm25-status').textContent = getStatus(airQuality.pm2_5);
    document.getElementById('pm10-status').textContent = getStatus(airQuality.pm10);
    document.getElementById('o3-status').textContent = getStatus(airQuality.o3);
    document.getElementById('no2-status').textContent = getStatus(airQuality.no2);
}

// Helper function to determine status
function getStatus(value) {
    if (value <= 50) return 'Good';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Unhealthy for Sensitive Groups';
    if (value <= 200) return 'Unhealthy';
    return 'Very Unhealthy';
}

// Initialize air quality chart
function initializeChart(data) {
    if (!data || !data.list || data.list.length === 0) {
        console.error('No air quality data available for chart.');
        return;
    }

    const ctx = document.getElementById('airQualityChart').getContext('2d');
    const pm25Values = data.list.map(entry => entry.components.pm2_5);
    const dates = data.list.map(entry => new Date(entry.dt * 1000).toLocaleDateString());

    const airQualityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'PM2.5 Levels',
                data: pm25Values,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: 'PM2.5 (µg/m³)' } }
            }
        }
    });
}

// Event listener for search button
document.getElementById('search-button').addEventListener('click', async () => {
    const location = document.getElementById('location-search').value.trim();
    if (!location) {
        alert('Please enter a location.');
        return;
    }

    // Step 1: Get coordinates
    const coordinates = await getLocationCoordinates(location);
    if (!coordinates) {
        alert('Failed to fetch location coordinates. Please try again.');
        return;
    }

    // Step 2: Fetch air quality data
    const data = await fetchAirQualityData(coordinates.lat, coordinates.lon);
    if (data) {
        updateMetrics(data);
        initializeChart(data);
    } else {
        alert('Failed to fetch air quality data. Please try again.');
    }
});