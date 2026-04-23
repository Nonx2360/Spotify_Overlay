import { useState, useEffect } from 'react';

export interface TrackInfo {
  isPlaying: boolean;
  song?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  progress_ms?: number;
  duration_ms?: number;
}

export function useNowPlaying(pollInterval: number = 3000) {
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeoutId: number;

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch('/api/now-playing');
        
        if (response.status === 401) {
          setError('Not authenticated');
          setTrack({ isPlaying: false });
          setLoading(false);
          return; // Stop polling if not auth
        }

        if (!response.ok) throw new Error('Network response was not ok');

        const data: TrackInfo = await response.json();
        setTrack(data);
        setError(null);
        
        if (data.isPlaying && data.progress_ms !== undefined) {
          setProgress(data.progress_ms);
        }

      } catch (err) {
        console.error('Failed to fetch track info:', err);
        setError('Failed to fetch from Spotify API');
      } finally {
        setLoading(false);
        timeoutId = setTimeout(fetchNowPlaying, pollInterval) as any as number;
      }
    };

    fetchNowPlaying();

    return () => clearTimeout(timeoutId);
  }, [pollInterval]);

  // Client-side progress interpolation
  useEffect(() => {
    if (!track?.isPlaying || !track?.duration_ms) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1000;
        return next > track.duration_ms! ? track.duration_ms! : next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [track?.isPlaying, track?.duration_ms, track?.progress_ms]); // re-sync when server updates progress

  return { track, loading, error, progress };
}
