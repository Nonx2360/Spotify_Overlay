import React from 'react';
import type { TrackInfo } from '../hooks/useNowPlaying';

interface SpotifyWidgetProps {
  track: TrackInfo | null;
  progressMs: number;
  accentColor?: string;
  theme?: 'dark' | 'light';
  borderRadius?: number;
  bgOpacity?: number;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

export const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({
  track,
  progressMs,
  accentColor = '#1DB954',
  theme = 'dark',
  borderRadius = 14,
  bgOpacity = 0.72,
}) => {
  const isPlaying = track?.isPlaying || false;
  
  // Theme logic
  const isDark = theme === 'dark';
  const bgColor = isDark 
    ? `rgba(0, 0, 0, ${bgOpacity})` 
    : `rgba(255, 255, 255, ${bgOpacity})`;
  const textColor = isDark ? '#ffffff' : '#000000';
  const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const progressBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Dummy fallback data if not playing
  const displayTrack = track?.song || 'Nothing playing';
  const displayArtist = track?.artist || 'Spotify is quiet';
  const currentMs = isPlaying ? progressMs : 0;
  const durationMs = track?.duration_ms || 1;
  const progressPct = Math.min(100, Math.max(0, (currentMs / durationMs) * 100));

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '14px',
        backgroundColor: bgColor,
        borderRadius: `${borderRadius}px`,
        padding: '12px 16px 12px 12px',
        minWidth: '320px',
        maxWidth: '380px',
        border: `1px solid ${borderColor}`,
        position: 'relative',
        overflow: 'hidden',
        clipPath: `inset(0 round ${borderRadius}px)`,
        transform: 'translateZ(0)',
        color: textColor
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: `${Math.max(0, borderRadius - 6)}px`,
          flexShrink: 0,
          background: isDark ? '#282828' : '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {track?.albumArt ? (
          <img
            src={track.albumArt}
            alt="Album Art"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18V5l12-2v13" stroke={subTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke={subTextColor} strokeWidth="1.5"/>
            <circle cx="18" cy="16" r="3" stroke={subTextColor} strokeWidth="1.5"/>
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} viewBox="0 0 24 24" fill={accentColor} xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12"/>
            <path d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1zm-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.3.1-.65-.1-.75-.45-.1-.3.1-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85z" fill="white"/>
          </svg>
          <span style={{ fontSize: '10px', color: accentColor, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {isPlaying ? 'Now playing' : 'Spotify'}
          </span>
          {isPlaying && (
            <div
              className="pulse-dot"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: accentColor,
                marginLeft: '2px'
              }}
            />
          )}
        </div>

        <div style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
          {displayTrack}
        </div>
        
        <div style={{ fontSize: '12px', color: subTextColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px', marginBottom: '8px' }}>
          {displayArtist}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: subTextColor, minWidth: '28px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
             {formatTime(currentMs)}
          </span>
          <div style={{ flex: 1, height: '3px', background: progressBg, borderRadius: '99px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: accentColor,
                borderRadius: '99px',
                width: `${progressPct}%`,
                transition: isPlaying ? 'width 1s linear' : 'none'
              }}
            />
          </div>
          <span style={{ fontSize: '10px', color: subTextColor, minWidth: '28px', textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>
             {track?.duration_ms ? formatTime(track.duration_ms) : '0:00'}
          </span>
        </div>
      </div>
    </div>
  );
};
