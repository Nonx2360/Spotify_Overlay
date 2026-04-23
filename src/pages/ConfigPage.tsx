import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { SpotifyWidget } from '../components/SpotifyWidget';
import { useNowPlaying, type TrackInfo } from '../hooks/useNowPlaying';

const DEFAULT_TRACK: TrackInfo = {
  isPlaying: true,
  song: 'Blinding Lights',
  artist: 'The Weeknd · After Hours',
  duration_ms: 200000,
  progress_ms: 83000,
};

export default function ConfigPage() {
  const [accentColor, setAccentColor] = useState('#1DB954');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [borderRadius, setBorderRadius] = useState(14);
  const [bgOpacity, setBgOpacity] = useState(0.72);
  const [isAuth, setIsAuth] = useState(false);
  const [userData, setUserData] = useState<{ name: string; image: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Extract refresh token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('refreshToken');
    if (token) {
      localStorage.setItem('spotify_refresh_token', token);
      setRefreshToken(token);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setRefreshToken(localStorage.getItem('spotify_refresh_token'));
    }
  }, []);

  const { track: liveTrack, progress: liveProgress } = useNowPlaying(refreshToken);

  useEffect(() => {
    if (!refreshToken) {
      setIsAuth(false);
      return;
    }

    fetch(`/api/status?refreshToken=${refreshToken}`)
      .then((res) => res.json())
      .then((data) => {
        setIsAuth(data.isAuthenticated);
        if (data.isAuthenticated) {
          fetch(`/api/user?refreshToken=${refreshToken}`)
            .then((res) => res.json())
            .then((user) => setUserData(user))
            .catch(() => setUserData(null));
        }
      })
      .catch(() => setIsAuth(false));
  }, [refreshToken]);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const previewTrack = isAuth && liveTrack?.song ? liveTrack : DEFAULT_TRACK;
  const previewProgress = isAuth && liveTrack?.song ? liveProgress : DEFAULT_TRACK.progress_ms!;

  const overlayUrl = `${window.location.origin}/overlay?accent=${encodeURIComponent(
    accentColor
  )}&theme=${theme}&radius=${borderRadius}&opacity=${bgOpacity}${refreshToken ? `&refreshToken=${refreshToken}` : ''}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar Setup */}
      <div className="w-96 border-r border-neutral-800 p-8 flex flex-col gap-8 bg-neutral-900/50">
        <div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">Spotify Widget</h1>
          <p className="text-neutral-400 text-sm">Configure your OBS Overlay</p>
        </div>

        {!isAuth ? (
          <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
            <h3 className="font-semibold mb-2 text-sm text-neutral-200">Connect to Spotify</h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Login to view real-time playback in the preview and enable the overlay.
            </p>
            <button
              onClick={handleLogin}
              className="w-full py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-lg text-sm transition-colors"
            >
              Connect Spotify
            </button>
          </div>
        ) : (
          <div className="bg-green-950/60 border border-green-800/50 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {userData?.image ? (
                <img src={userData.image} alt={userData.name} className="w-10 h-10 rounded-full border border-green-500/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                   <span className="text-green-500 text-xs font-bold">{userData?.name?.charAt(0) || '?'}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs text-green-500/70 font-medium">Welcome</span>
                <span className="text-sm font-bold text-white">{userData?.name || 'User'}</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-green-800/30 flex flex-col items-start">
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium mb-1">Spotify Connected</span>
              <p className="text-[10px] text-green-500/50 uppercase tracking-wider">Using live data for preview</p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {/* Theme */}
          <div className="py-5 border-b border-white/10 space-y-3">
            <label className="text-xs font-semibold tracking-widest text-white/40 uppercase">Theme</label>
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-1.5 text-sm font-medium transition-all duration-200 rounded-md ${
                  theme === 'dark' ? 'bg-white text-black' : 'text-white/50 hover:text-white/70'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-1.5 text-sm font-medium transition-all duration-200 rounded-md ${
                  theme === 'light' ? 'bg-white text-black' : 'text-white/50 hover:text-white/70'
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div className="py-5 border-b border-white/10 space-y-3">
            <label className="text-xs font-semibold tracking-widest text-white/40 uppercase">Accent Color</label>
            <div className="flex gap-3 items-center">
              {['#1DB954', '#ffffff', '#FF5A5A', '#A154FF', '#FFBD54'].map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => setAccentColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    accentColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 ml-1">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div className="py-5 border-b border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold tracking-widest text-white/40 uppercase">Border Radius</label>
              <span className="text-white/70 text-sm">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
              style={{ background: `linear-gradient(to right, ${accentColor} ${borderRadius}%, rgba(255,255,255,0.2) ${borderRadius}%)` }}
            />
          </div>

          {/* Background Opacity */}
          <div className="py-5 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold tracking-widest text-white/40 uppercase">Background Opacity</label>
              <span className="text-white/70 text-sm">{Math.round(bgOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bgOpacity}
              onChange={(e) => setBgOpacity(Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
              style={{ background: `linear-gradient(to right, ${accentColor} ${bgOpacity * 100}%, rgba(255,255,255,0.2) ${bgOpacity * 100}%)` }}
            />
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative Grid BG */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#ffffff08_1px,_transparent_1px)] bg-[size:20px_20px]"></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-w-2xl">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-3xl text-white/90 font-semibold tracking-tight">Live Preview</h2>
            <p className="text-white/40 text-sm">How it will look on your stream</p>
          </div>

          {/* Checkerboard Pattern underneath widget to show transparency properly */}
          <div className="p-8 rounded-3xl relative mb-20">
            <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-20">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, #404040 25%, transparent 25%, transparent 75%, #404040 75%, #404040), repeating-linear-gradient(45deg, #404040 25%, #262626 25%, #262626 75%, #404040 75%, #404040)`,
                  backgroundPosition: `0 0, 10px 10px`,
                  backgroundSize: `20px 20px`
                }}
              />
            </div>

            <div className="relative p-12 drop-shadow-2xl">
              <SpotifyWidget
                track={previewTrack}
                progressMs={previewProgress}
                accentColor={accentColor}
                theme={theme}
                borderRadius={borderRadius}
                bgOpacity={bgOpacity}
              />
            </div>
          </div>

          <div className="absolute bottom-4 w-full border border-white/10 rounded-xl p-4 bg-white/5 flex flex-col gap-3 backdrop-blur-sm">
             <div>
                <h3 className="text-sm font-semibold text-white/90 mb-1">Overlay URL</h3>
                <p className="text-xs text-white/40">Add this as a Browser Source in OBS. Set width to 400px, height to 120px.</p>
             </div>
             <div className="flex gap-2 p-2 bg-black/40 rounded-lg border border-white/5 items-center overflow-hidden">
                <code className="font-mono text-sm text-white/70 flex-1 truncate select-all px-2">{overlayUrl}</code>
                <button 
                  onClick={() => { navigator.clipboard.writeText(overlayUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-md text-xs font-medium text-white/90"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
