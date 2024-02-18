const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());

// Define API endpoint for current weather
const currentWeatherEndpoint = 'http://api.weatherapi.com/v1/current.json?key=d3c3d16842134b428fb192144241202&q=Negombo';

// Fetch current weather data
app.get('/api/currentWeather', async (req, res) => {
  try {
    const response = await axios.get(currentWeatherEndpoint);
    const currentWeatherData = response.data;
    res.json(currentWeatherData);
  } catch (error) {
    console.error('Error fetching current weather data:', error);
    res.status(500).json({ error: 'Failed to fetch current weather data' });
  }
});

// Define API endpoint for future weather
const futureWeatherEndpoint = 'http://api.weatherapi.com/v1/forecast.json?key=d3c3d16842134b428fb192144241202&q=Negombo';

// Fetch future weather data for 5 days
app.get('/api/futureWeather', async (req, res) => {
  try {
    const futureWeatherData = [];
    const currentDate = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i + 1);
      const formattedDate = formatDate(date);
      console.log(formattedDate);
      const response = await axios.get(`${futureWeatherEndpoint}&dt=${formattedDate}`);
      futureWeatherData.push(response.data);
    }
    res.json(futureWeatherData);
  } catch (error) {
    console.error('Error fetching future weather data:', error);
    res.status(500).json({ error: 'Failed to fetch future weather data' });
  }
});

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
