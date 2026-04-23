import { useState, useEffect } from 'react';
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

  const { track: liveTrack, progress: liveProgress } = useNowPlaying();

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setIsAuth(data.isAuthenticated);
        if (data.isAuthenticated) {
          fetch('/api/user')
            .then((res) => res.json())
            .then((user) => setUserData(user))
            .catch(() => setUserData(null));
        }
      })
      .catch(() => setIsAuth(false));
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const previewTrack = isAuth && liveTrack?.song ? liveTrack : DEFAULT_TRACK;
  const previewProgress = isAuth && liveTrack?.song ? liveProgress : DEFAULT_TRACK.progress_ms!;

  const overlayUrl = `${window.location.origin}/overlay?accent=${encodeURIComponent(
    accentColor
  )}&theme=${theme}&radius=${borderRadius}&opacity=${bgOpacity}`;

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
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col gap-4">
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
            
            <div className="pt-3 border-t border-green-500/10">
              <h3 className="text-green-400 font-semibold mb-1 text-xs">Spotify Connected</h3>
              <p className="text-[10px] text-green-500/50 uppercase tracking-tight">Using live data for preview</p>
            </div>
          </div>
        )}

        <div className="space-y-6 flex-1">
          {/* Theme */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('dark')}
                className={`py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                  theme === 'dark' ? 'bg-neutral-800 border-neutral-600 text-white' : 'border-neutral-800 text-neutral-500 hover:bg-neutral-800/50'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                  theme === 'light' ? 'bg-neutral-200 border-neutral-400 text-black' : 'border-neutral-800 text-neutral-500 hover:bg-neutral-800/50'
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Accent Color</label>
            <div className="flex gap-3">
              {['#1DB954', '#ffffff', '#FF5A5A', '#A154FF', '#FFBD54'].map((c) => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    accentColor === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Border Radius</label>
              <span className="text-xs text-neutral-500">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="w-full accent-[#1DB954]"
            />
          </div>

          {/* Background Opacity */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Background Opacity</label>
              <span className="text-xs text-neutral-500">{Math.round(bgOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bgOpacity}
              onChange={(e) => setBgOpacity(Number(e.target.value))}
              className="w-full accent-[#1DB954]"
            />
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative Grid BG */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-2xl">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Live Preview</h2>
            <p className="text-neutral-500">How it will look on your stream</p>
          </div>

          {/* Checkerboard Pattern underneath widget to show transparency properly */}
          <div className="p-8 rounded-3xl relative">
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

          <div className="w-full bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex flex-col gap-4">
             <div>
                <h3 className="text-sm font-semibold text-white mb-1">Overlay URL</h3>
                <p className="text-xs text-neutral-400">Add this as a Browser Source in OBS. Set width to 400px, height to 120px.</p>
             </div>
             <div className="flex gap-2 p-3 bg-black rounded-lg border border-neutral-800 items-center overflow-hidden">
                <code className="text-xs text-neutral-300 flex-1 truncate select-all">{overlayUrl}</code>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
