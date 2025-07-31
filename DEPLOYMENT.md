# Leaderboard Backend Deployment Guide

## Problem
Your leaderboard system currently runs on `localhost:4000`, which means it only works when your computer is active. When your computer goes to sleep or is inactive, the backend server stops running.

## Solution
Deploy the backend to Render (a cloud platform) so it runs 24/7.

## Steps to Deploy

### 1. Prepare the Backend
The backend is already prepared with:
- `backend/server.js` - Express server
- `backend/package.json` - Dependencies
- `backend/render.yaml` - Render configuration

### 2. Deploy to Render

1. **Create a Render account** at https://render.com

2. **Connect your GitHub repository**:
   - Go to your Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your repository

3. **Configure the service**:
   - **Name**: `leaderboard-backend`
   - **Root Directory**: `backend` (important!)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend

### 3. Update Frontend Configuration

After deployment, Render will give you a URL like:
`https://your-leaderboard-backend.onrender.com`

Update `src/config.js`:
```javascript
const config = {
  backendUrl: process.env.NODE_ENV === 'production' 
    ? 'https://retrowebsitebackend.onrender.com' // Replace with your actual URL
    : 'http://localhost:4000'
};
```

### 4. Deploy Frontend

Deploy your React app to Vercel or Netlify as usual. The frontend will now use the cloud backend instead of localhost.

## Benefits
- ✅ Leaderboard works 24/7
- ✅ Scores persist even when your computer is off
- ✅ Multiple users can access the leaderboard simultaneously
- ✅ No need to keep your computer running

## Testing
1. Deploy the backend to Render
2. Update the config.js with your Render URL
3. Deploy the frontend
4. Test the leaderboard functionality - it should work even when your computer is off!

## Troubleshooting
- If you get CORS errors, make sure the backend URL in `config.js` is correct
- If scores aren't saving, check the Render logs for errors
- The backend will automatically restart if it crashes 