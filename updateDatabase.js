// const admin = require("firebase-admin");
// const fetch = require("node-fetch");
// const serviceAccount = require("./config/serviceAccountKey.json");

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL:
//     "https://test-ice-pc-ru-default-rtdb.asia-southeast1.firebasedatabase.app/", // Correct URL
// });

// const db = admin.database();

// // Function to fetch handles from a JSON file
// const fetchHandles = async () => {
//   const fetch = (await import("node-fetch")).default; // Dynamic import
//   try {
//     const response = await fetch(
//       "https://raw.githubusercontent.com/SaifullahMnsur/codeforces-api/main/handles.json"
//     );
//     const data = await response.json();
//     return data.handles.join(";"); // Return the handles array as a semicolon-separated string
//   } catch (error) {
//     console.error("Error fetching handles:", error);
//     return [];
//   }
// };

// // Function to fetch user information from Codeforces API
// const fetchUserInfo = async (handles) => {
//   const fetch = (await import("node-fetch")).default; // Dynamic import
//   try {
//     const response = await fetch(
//       `https://codeforces.com/api/user.info?handles=${handles}`
//     );
//     const userInfo = await response.json();
//     return userInfo;
//   } catch (error) {
//     console.error("Error fetching user info:", error);
//     return null;
//   }
// };

// // Function to sanitize Firebase database paths
// const sanitizePath = (path) => {
//   return path.replace(/[.#$[\]]/g, '_').replace(/\.\.+/g, '_'); // Replace invalid characters and double dots
// };

// // Function to update the database
// const updateDatabase = async () => {
//   try {
//     console.log("Starting database update...");
//     const handles = await fetchHandles();
//     console.log("Handles:", handles);

//     if (handles.length === 0) {
//       console.error("No handles found.");
//       return;
//     }

//     const userInfo = await fetchUserInfo(handles);

//     if (userInfo && userInfo.result) {
//       userInfo.result.forEach((user) => {
//         const sanitizedHandle = sanitizePath(user.handle); // Sanitize the handle for Firebase
//         const userRef = db.ref(`users/${sanitizedHandle}`);
//         userRef.set({
//           handle: user.handle, // Store original handle in the database
//           maxRank: user.maxRank,
//           maxRating: user.maxRating,
//           rank: user.rank,
//           rating: user.rating,
//           solvedProblem: 0, // Initialize solvedProblem with 0
//         });
//         console.log(`Data for user ${user.handle} written to database.`);
//       });
//     } else {
//       console.error("No user info found.");
//     }
//   } catch (error) {
//     console.error("Error updating database:", error);
//   }
// };

// // Call the function to update the database
// updateDatabase();


const admin = require("firebase-admin");
const fetch = require("node-fetch");
require('dotenv').config(); // Load environment variables from .env file

// Decode Base64-encoded Firebase service account key
const serviceAccountKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(serviceAccountKey);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();

const updateInterval = 3600000; // 1 hour in milliseconds

// Function to fetch handles from a JSON file
const fetchHandles = async () => {
  const fetch = (await import("node-fetch")).default; // Dynamic import
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/SaifullahMnsur/codeforces-api/main/handles.json"
    );
    const data = await response.json();
    return data.handles.join(";"); // Return the handles array as a semicolon-separated string
  } catch (error) {
    console.error("Error fetching handles:", error);
    return [];
  }
};

// Function to fetch user information from Codeforces API
const fetchUserInfo = async (handles) => {
  const fetch = (await import("node-fetch")).default; // Dynamic import
  try {
    const response = await fetch(
      `https://codeforces.com/api/user.info?handles=${handles}`
    );
    const userInfo = await response.json();
    return userInfo;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
};

// Function to sanitize handle for Firebase path
const sanitizePath = (handle) => {
  return handle.replace(/[.#$[\]]/g, '_'); // Replace invalid characters with underscores
};

// Function to update the database
const updateDatabase = async () => {
  try {
    console.log("Starting database update...");
    const handles = await fetchHandles();
    console.log("Handles fetched:", handles);

    if (handles.length === 0) {
      console.error("No handles found.");
      return;
    }

    console.log("Fetching user info...");
    const userInfo = await fetchUserInfo(handles);
    console.log("User info fetched:", userInfo);

    if (userInfo && userInfo.result) {
      const updatePromises = userInfo.result.map((user) => {
        const sanitizedHandle = sanitizePath(user.handle); // Sanitize the handle for Firebase
        const userRef = db.ref(`users/${sanitizedHandle}`);
        return userRef.set({
          handle: user.handle, // Store original handle in the database
          maxRank: user.maxRank,
          maxRating: user.maxRating,
          rank: user.rank,
          rating: user.rating,
          solvedProblem: 0, // Initialize solvedProblem with 0
        }).then(() => {
          console.log(`Data for user ${user.handle} written to database.`);
        }).catch((error) => {
          console.error(`Error writing data for user ${user.handle}:`, error);
        });
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
    } else {
      console.error("No user info found.");
    }
  } catch (error) {
    console.error("Error updating database:", error);
  }
};

// Function to format time in MM:SS
const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Countdown display function
const startCountdown = (interval) => {
  let timeRemaining = interval;

  setInterval(() => {
    timeRemaining -= 1000; // Decrement by 1 second (1000 ms)
    console.log(`Time until next update: ${formatTime(timeRemaining)}`);
    if (timeRemaining <= 0) {
      timeRemaining = interval; // Reset the countdown
    }
  }, 1000); // Update every 1 second
};

// Run the update immediately
updateDatabase();

// Start the countdown and schedule the update
startCountdown(updateInterval);
setInterval(updateDatabase, updateInterval); // Schedule the update to run every hour
