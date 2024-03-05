const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://Uni-Coders:ixdvEHuAitq7V5ah@solarcast.ajupiq2.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define User schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

// Define User model
const User = mongoose.model("User", userSchema);

// Signup route
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, "your_secret_key");

    res.json({ token, username: user.username });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Define API endpoint for current weather
// Fetch current weather data based on country and city
app.get("/api/currentWeather", async (req, res) => {
  try {
    const { country, city } = req.query;
    const currentWeatherEndpoint = `http://api.weatherapi.com/v1/current.json?key=d3c3d16842134b428fb192144241202&q=${city},${country}`;
    const response = await axios.get(currentWeatherEndpoint);
    const currentWeatherData = response.data;
    const formattedData = {
      name: currentWeatherData.location.name,
      country: currentWeatherData.location.country,
      localtime: currentWeatherData.location.localtime,
      temperature: currentWeatherData.current.temp_c,
      humidity: currentWeatherData.current.humidity,
      windSpeed: currentWeatherData.current.wind_kph,
      condition: currentWeatherData.current.condition.text,
    };
    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching current weather data:", error);
    res.status(500).json({ error: "Failed to fetch current weather data" });
  }
});

// Define API endpoint for future weather
app.get("/api/futureWeather", async (req, res) => {
  try {
    const { city, country } = req.query; // Extract city and country from query parameters

    // Weather API endpoint with city and country parameters
    const futureWeatherEndpoint = `http://api.weatherapi.com/v1/forecast.json?key=d3c3d16842134b428fb192144241202&q=${city},${country}`;

    const futureWeatherData = [];
    const currentDate = new Date();
    for (let i = 0; i < 6; i++) {
      // Changed to loop for 5 days
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i + 1);
      const formattedDate = formatDate(date);
      console.log(formattedDate);
      const response = await axios.get(
        `${futureWeatherEndpoint}&dt=${formattedDate}`
      );
      const forecast = response.data.forecast.forecastday[0]; // Get the forecast for the first day only
      const weatherData = {
        date: forecast.date,
        temperature: {
          max: forecast.day.avgtemp_c,
        },
        humidity: forecast.day.avghumidity,
        windSpeed: forecast.hour[6].wind_kph,
        condition: forecast.day.condition.text,
      };
      futureWeatherData.push(weatherData);
    }
    res.json(futureWeatherData);
  } catch (error) {
    console.error("Error fetching future weather data:", error);
    res.status(500).json({ error: "Failed to fetch future weather data" });
  }
});

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
