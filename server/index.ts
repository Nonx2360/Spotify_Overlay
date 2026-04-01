import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import SpotifyWebApi from 'spotify-web-api-node';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

let userTokens = {
  accessToken: '',
  refreshToken: '',
  expiresAt: 0,
};

// Start OAuth Flow
app.get('/api/login', (req, res) => {
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

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    userTokens.accessToken = data.body['access_token'];
    userTokens.refreshToken = data.body['refresh_token'];
    userTokens.expiresAt = Date.now() + data.body['expires_in'] * 1000;
    
    spotifyApi.setAccessToken(userTokens.accessToken);
    spotifyApi.setRefreshToken(userTokens.refreshToken);
    
    res.redirect('http://localhost:5173/'); // Redirect back to front-end config UI
  } catch (error) {
    console.error('Error during authorization code grant:', error);
    res.status(500).send('Authentication failed');
  }
});

// Helper to ensure valid token
async function checkAndRefreshTokens() {
  if (!userTokens.refreshToken) return false;
  
  if (Date.now() > userTokens.expiresAt - 60000) { // Refresh if less than 1 min remaining
    try {
      const data = await spotifyApi.refreshAccessToken();
      userTokens.accessToken = data.body['access_token'];
      userTokens.expiresAt = Date.now() + data.body['expires_in'] * 1000;
      spotifyApi.setAccessToken(userTokens.accessToken);
      return true;
    } catch (error) {
      console.error('Failed to refresh token', error);
      return false;
    }
  }
  return true;
}

// Get Currently Playing (proxied completely server-side to hide auth details)
app.get('/api/now-playing', async (req, res) => {
  const isAuth = await checkAndRefreshTokens();
  if (!isAuth || !userTokens.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Spotify' });
  }

  try {
    const data = await spotifyApi.getMyCurrentPlaybackState();
    
    if (data.statusCode === 204 || !data.body || !data.body.item) {
      return res.status(200).json({ isPlaying: false });
    }

    const item = data.body.item;
    const progress_ms = data.body.progress_ms;
    
    if (item.type !== 'track') { // Just handling music tracks for now
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

app.get('/api/user', async (req, res) => {
  const isAuth = await checkAndRefreshTokens();
  if (!isAuth || !userTokens.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

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

app.get('/api/status', (req, res) => {
  res.json({
    isAuthenticated: !!userTokens.accessToken
  });
});

// Logout / Reset
app.post('/api/logout', (req, res) => {
  userTokens = { accessToken: '', refreshToken: '', expiresAt: 0 };
  spotifyApi.resetAccessToken();
  spotifyApi.resetRefreshToken();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
