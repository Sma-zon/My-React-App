# Render Deployment Guide

## Deployment Steps

1. **Connect your GitHub repository to Render**
   - Go to render.com and create a new Web Service
   - Connect your GitHub repository
   - **Important**: Set the root directory to `backend/` in Render settings

2. **Environment Configuration**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

3. **Environment Variables**
   - `NODE_ENV`: `production`

## Troubleshooting

### "Cannot find module 'uuid'" Error
This error occurs when dependencies aren't properly installed. Multiple fixes applied:

1. **Updated package.json** with exact versions and postinstall verification
2. **Added .npmrc** for consistent npm behavior
3. **Created root-level render.yaml** that points to backend directory
4. **Added engines field** to specify Node.js version
5. **Added postinstall script** to verify uuid module

### If the error persists:

#### Option 1: Manual Render Configuration
1. In Render dashboard, go to your service settings
2. Set **Root Directory** to `backend`
3. Set **Build Command** to `npm install`
4. Set **Start Command** to `npm start`
5. Redeploy with "Clear build cache"

#### Option 2: Alternative Build Command
Try changing the build command to:
```
npm ci --only=production
```

#### Option 3: Check Render Logs
1. Go to your Render service logs
2. Look for any npm install errors
3. Check if the backend directory is being recognized

#### Option 4: Force Reinstall
Add this to your package.json scripts:
```json
"prestart": "npm install"
```

## File Structure
```
my-first-react-app/
├── render.yaml           # Root-level Render config
└── backend/
    ├── server.js          # Main server file
    ├── package.json       # Dependencies and scripts
    ├── package-lock.json  # Locked dependency versions
    ├── render.yaml        # Backend-specific config
    ├── .npmrc            # NPM configuration
    ├── scores.json       # Leaderboard data
    └── DEPLOYMENT.md     # This file
```

## Testing Locally
```bash
cd backend
npm install
npm start
```

The server will run on http://localhost:4000

## Latest Changes Made
- Added root-level render.yaml
- Updated package.json with postinstall verification
- Added deployment script for testing
- Enhanced troubleshooting steps 