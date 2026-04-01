import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SpotifyWidget } from '../components/SpotifyWidget';
import { useNowPlaying } from '../hooks/useNowPlaying';

export default function OverlayPage() {
  const [searchParams] = useSearchParams();
  
  const accentColor = searchParams.get('accent') || '#1DB954';
  const theme = (searchParams.get('theme') as 'dark' | 'light') || 'dark';
  const borderRadius = parseInt(searchParams.get('radius') || '14', 10);
  const bgOpacity = parseFloat(searchParams.get('opacity') || '0.72');

  const { track, error, progress } = useNowPlaying(3000); // poll every 3 seconds

  // Reset body background explicitly for OBS transparency
  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  if (error) {
    return (
      <div style={{ color: 'red', fontFamily: 'Inter, sans-serif', padding: '16px', background: 'rgba(0,0,0,0.8)', borderRadius: '8px' }}>
        Error: {error}
      </div>
    );
  }

  // Only render widget if something is actually playing or we have a track
  if (!track || (!track.isPlaying && !track.song)) {
    return null; // Render nothing, keep OBS overlay clean
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', background: 'transparent' }}>
      <SpotifyWidget
        track={track}
        progressMs={progress}
        accentColor={accentColor}
        theme={theme}
        borderRadius={borderRadius}
        bgOpacity={bgOpacity}
      />
    </div>
  );
}
