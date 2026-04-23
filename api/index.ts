import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import SpotifyWebApi from 'spotify-web-api-node';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory cache to prevent hitting Spotify's token refresh endpoint every 3 seconds
// This cache is ephemeral and will be lost on Vercel instance restarts, which is fine!
const tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

const getSpotifyApi = () => {
  return new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  });
};

// Start OAuth Flow
app.get('/api/login', (req, res) => {
  const spotifyApi = getSpotifyApi();
  const scopes = ['user-read-currently-playing', 'user-read-playback-state'];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'some-state');
  res.redirect(authorizeURL);
});

// OAuth Callback
app.get('/api/callback', async (req, res) => {
  const code = req.query.code as string;
  
  if (!code) {
    return res.status(400).send('No code provided');
  }

  const spotifyApi = getSpotifyApi();

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    const expiresAt = Date.now() + data.body['expires_in'] * 1000;
    
    // Cache the initial token
    tokenCache.set(refreshToken, { accessToken, expiresAt });
    
    const frontendUrl = process.env.FRONTEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    
    // Redirect to frontend WITH the refresh token in the URL
    // The frontend will save it and remove it from the URL
    res.redirect(`${frontendUrl}?refreshToken=${refreshToken}`);
  } catch (error) {
    console.error('Error during authorization code grant:', error);
    res.status(500).send('Authentication failed');
  }
});

// Helper to ensure valid token from the client's refresh token
async function getValidAccessToken(refreshToken: string): Promise<string | null> {
  if (!refreshToken) return null;

  const cached = tokenCache.get(refreshToken);
  
  // If we have a valid cached token, use it
  if (cached && Date.now() < cached.expiresAt - 60000) {
    return cached.accessToken;
  }

  // Otherwise, refresh it using the Spotify API
  try {
    const spotifyApi = getSpotifyApi();
    spotifyApi.setRefreshToken(refreshToken);
    const data = await spotifyApi.refreshAccessToken();
    
    const newAccessToken = data.body['access_token'];
    const expiresAt = Date.now() + data.body['expires_in'] * 1000;
    
    tokenCache.set(refreshToken, { accessToken: newAccessToken, expiresAt });
    return newAccessToken;
  } catch (error) {
    console.error('Failed to refresh token', error);
    // If refresh fails (e.g. token revoked), remove from cache
    tokenCache.delete(refreshToken);
    return null;
  }
}

// Middleware to extract refresh token and initialize Spotify API
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const refreshToken = req.query.refreshToken as string;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  const accessToken = await getValidAccessToken(refreshToken);
  if (!accessToken) {
    return res.status(401).json({ error: 'Failed to authenticate with Spotify' });
  }

  const spotifyApi = getSpotifyApi();
  spotifyApi.setAccessToken(accessToken);
  (req as any).spotifyApi = spotifyApi;
  next();
};

app.get('/api/now-playing', authenticate, async (req, res) => {
  const spotifyApi = (req as any).spotifyApi as SpotifyWebApi;

  try {
    const data = await spotifyApi.getMyCurrentPlaybackState();
    
    if (data.statusCode === 204 || !data.body || !data.body.item) {
      return res.status(200).json({ isPlaying: false });
    }

    const item = data.body.item;
    const progress_ms = data.body.progress_ms;
    
    if (item.type !== 'track') {
      return res.status(200).json({ isPlaying: false });
    }

    const track = {
      isPlaying: data.body.is_playing,
      song: item.name,
      artist: item.artists.map((a: any) => a.name).join(', '),
      album: item.album.name,
      albumArt: item.album.images[0]?.url || '',
      progress_ms: progress_ms,
      duration_ms: item.duration_ms,
    };

    res.json(track);
  } catch (error) {
    console.error('Failed to fetch currently playing:', error);
    res.status(500).json({ error: 'Failed to fetch from Spotify' });
  }
});

app.get('/api/user', authenticate, async (req, res) => {
  const spotifyApi = (req as any).spotifyApi as SpotifyWebApi;

  try {
    const data = await spotifyApi.getMe();
    res.json({
      name: data.body.display_name,
      image: data.body.images?.[0]?.url || null,
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/status', async (req, res) => {
  const refreshToken = req.query.refreshToken as string;
  if (!refreshToken) {
    return res.json({ isAuthenticated: false });
  }

  const accessToken = await getValidAccessToken(refreshToken);
  res.json({
    isAuthenticated: !!accessToken
  });
});

app.post('/api/logout', (req, res) => {
  const refreshToken = req.query.refreshToken as string;
  if (refreshToken) {
    tokenCache.delete(refreshToken);
  }
  res.json({ success: true });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
  });
}

export default app;
