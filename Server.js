// Copyright ©2024 Uni-Coders, All rights reserved.
const express = require("express"); // Importing Express.js framework
const axios = require("axios"); // Importing Axios for making HTTP requests
const cors = require("cors"); // Importing CORS middleware for enabling Cross-Origin Resource Sharing
const mongoose = require("mongoose"); // Importing Mongoose for MongoDB interactions
const bcrypt = require("bcryptjs"); // Importing bcrypt for password hashing
const jwt = require("jsonwebtoken"); // Importing JSON Web Token for user authentication

const app = express(); // Creating an Express application
const PORT = process.env.PORT || 3001; // Defining the port number
app.use(cors()); // Using CORS middleware to enable Cross-Origin Resource Sharing
app.use(express.json()); // Parsing incoming JSON requests

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
  functions: {
    type: [String],
    default: [], // Default value as an empty array
  },
});

// Define User model
const User = mongoose.model("User", userSchema);

// Login route
/**
 * Authenticate user login.
 * @name POST/api/login
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.body.email - User's email address.
 * @param {string} req.body.password - User's password.
 * @returns {Object} Response object containing authentication token and username upon successful login.
 */
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

    // Log the functions array
    console.log(user.functions);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      "group11-uniCoders@SLIITCITYUNI"
    );

    // Send response with token, username, and functions array
    res.json({ token, username: user.username, functions: user.functions });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Define API endpoint for retrieving all users
/**
 * Retrieve all users.
 * @name GET/api/users
 * @function
 * @memberof module:Server
 * @inner
 * @returns {Object} Response object containing array of user details.
 */
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

// Define API endpoint for adding a new user
/**
 * Add new user.
 * @name POST/api/user
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.body.username - Username of the new user.
 * @param {string} req.body.email - Email of the new user.
 * @param {string} req.body.password - Password of the new user.
 * @param {array} req.body.functions - Array of functions selected for the new user (e.g., ['table', 'graph']).
 * @returns {Object} Response object indicating success or failure of user addition.
 */
app.post("/api/user", async (req, res) => {
  try {
    const { username, email, password, functions } = req.body;

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
      functions,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Failed to add user" });
  }
});

// Define API endpoint for updating user details including selected functions and password
/**
 * Update user details and password.
 * @name PUT/api/user/:username
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.params.username - The username of the user to update details for.
 * @param {string} req.body.email - New email address for the user.
 * @param {array} req.body.functions - Updated array of functions selected for the user (e.g., ['table', 'graph']).
 * @param {string} req.body.password - New password for the user.
 * @returns {Object} Response object indicating success or failure of user details update.
 */
app.put("/api/update/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { email, functions } = req.body;

    // Construct update object based on provided fields
    const updateFields = {};
    if (email) {
      updateFields.email = email;
    }
    if (functions) {
      updateFields.functions = functions;
    }

    // Update user details
    const updatedUser = await User.findOneAndUpdate(
      { username },
      updateFields,
      { new: true }
    );

    // Check if user exists
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User details updated successfully" });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Failed to update user details" });
  }
});

// Define API endpoint for deleting a user
/**
 * Delete user.
 * @name DELETE/api/user/:username
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.params.username - The username of the user to delete.
 * @returns {Object} Response object indicating success or failure of user deletion.
 */
app.delete("/api/delete/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Find user by username and delete
    const deletedUser = await User.findOneAndDelete({ username });

    // Check if user exists
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Define API endpoint for current weather
// Fetch current weather data based on country and city
/**
 * Retrieve current weather information.
 * @name GET/api/currentWeather
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.query.country - Country name.
 * @param {string} req.query.city - City name.
 * @returns {Object} Response object containing current weather data.
 */
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
/**
 * Retrieve future weather forecast.
 * @name GET/api/futureWeather
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.query.country - Country name.
 * @param {string} req.query.city - City name.
 * @returns {Object} Response object containing future weather forecast.
 */
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

// Define API endpoint for retrieving user details
/**
 * Retrieve user details based on username.
 * @name GET/api/user/:username
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.params.username - The username of the user to retrieve details for.
 * @returns {Object} Response object containing user details.
 */
app.get("/api/user/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send user details in the response
    res.json({ username: user.username, email: user.email });
  } catch (error) {
    console.error("Error retrieving user details:", error);
    res.status(500).json({ error: "Failed to retrieve user details" });
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
