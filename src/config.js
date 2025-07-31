// Configuration for the leaderboard backend
const config = {
  // Use deployed backend URL in production, localhost in development
  backendUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-leaderboard-backend.onrender.com' // Replace with your actual Render URL
    : 'http://localhost:4000'
};

export default config; 