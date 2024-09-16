// const express = require("express");
// const admin = require("firebase-admin");
// const serviceAccount = require("./config/serviceAccountKey.json");

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL:
//     "https://test-ice-pc-ru-default-rtdb.asia-southeast1.firebasedatabase.app/", // Your Firebase Realtime Database URL
// });

// const db = admin.database();
// const app = express();
// const port = 3000;

// // Middleware to parse JSON requests
// app.use(express.json());

// // Endpoint to get all users' data
// app.get("/cf-api", async (req, res) => {
//   console.log("Received request for /cf-api");

//   try {
//     const usersRef = db.ref("users");
//     console.log("Fetching users data from Firebase...");
    
//     const snapshot = await usersRef.once("value");
//     const usersData = snapshot.val();
    
//     if (usersData) {
//       console.log("Users data fetched successfully");
//       res.json(usersData);
//     } else {
//       console.log("No users data found");
//       res.status(404).json({ error: "No users found" });
//     }
//   } catch (error) {
//     console.error("Error fetching users data:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Function to sanitize handles for Firebase paths (if needed in future)
// const sanitizePath = (handle) => {
//   return handle.replace(/[.#$[\]]/g, '_'); // Replace invalid characters with underscores
// };

// // Start the server
// app.listen(port, () => {
//   console.log(`API server listening at http://localhost:${port}`);
// });
const express = require("express");
const admin = require("firebase-admin");
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

// Decode Base64-encoded Firebase service account key
const serviceAccountKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(serviceAccountKey);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();

// API endpoint to get data
app.get("/cf-api", async (req, res) => {
  try {
    const snapshot = await db.ref("users").once("value");
    const data = snapshot.val();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
