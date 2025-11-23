# Cloud Functions for Firebase

This directory contains Firebase Cloud Functions for the Who's Bringing What application.

## Required Environment Variables

Before deploying these functions, you must configure the following environment variables:

### PEXELS_API_KEY

**Required for:** `randomPotluckImage` and `backfillEventImages` functions

The Pexels API key is used to fetch random potluck-themed images from the Pexels API.

**How to obtain:**
1. Visit [https://www.pexels.com/api/](https://www.pexels.com/api/)
2. Sign up for a free API key
3. Copy your API key

**How to set:**
```bash
# For local development, create a .env file in the functions directory
echo "PEXELS_API_KEY=your_api_key_here" > .env

# For production deployment
firebase functions:secrets:set PEXELS_API_KEY
# Or using the Firebase Console: Functions > Environment variables
```

### BACKFILL_SECRET

**Required for:** `backfillEventImages` function

A secure secret used to protect the admin-only backfill endpoint.

**How to set:**
```bash
# For local development, add to your .env file
echo "BACKFILL_SECRET=your_secure_secret_here" >> .env

# For production deployment
firebase functions:secrets:set BACKFILL_SECRET
```

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your API keys and secrets in the `.env` file

3. Test locally using the Firebase emulator:
   ```bash
   npm run serve
   ```

4. Deploy to production:
   ```bash
   npm run deploy
   ```

## Functions

### randomPotluckImage

An HTTPS callable function that returns a random potluck-themed image based on event details.

**Endpoint:** `GET /randomPotluckImage`

**Query Parameters:**
- `title` - Event title
- `description` - Event description  
- `location` - Event location
- `date` - Event date
- `seed` - Optional seed for deterministic random selection

### backfillEventImages

An admin-only HTTPS function that backfills images for existing events without images.

**Endpoint:** `POST /backfillEventImages`

**Headers:**
- `X-Backfill-Secret` - Must match the `BACKFILL_SECRET` environment variable

**Query Parameters:**
- `force` - Set to `true` to reassign images even for events that already have one
