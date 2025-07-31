// Configuration for the leaderboard backend
const config = {
  // Use deployed backend URL in production, localhost in development
  backendUrl: process.env.NODE_ENV === 'production' 
    ? 'https://retrowebsitebackend.onrender.com' // Your deployed Render URL
    : 'http://localhost:4000'
};

export default config; 