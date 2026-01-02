import React, { useRef, useState, useMemo, useEffect } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  htmlContent?: string;
  videoUrl?: string;
  requestId?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  onRegenerate?: () => void;
  onRender?: (duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  htmlContent, 
  videoUrl,
  requestId,
  aspectRatio = '16:9',
  onRegenerate,
  onRender
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const { width: originalWidth, height: originalHeight } = useMemo(() => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '16:9':
      default:
        return { width: 1920, height: 1080 };
    }
  }, [aspectRatio]);

  // Generate audio URL when requestId is available
  const audioUrl = useMemo(() => {
    if (requestId && htmlContent) {
      return `${BACKEND_URL}/poc/audio/${requestId}`;
    }
    return null;
  }, [requestId, htmlContent, BACKEND_URL]);

  // Scale iframe to fit container using ResizeObserver
  useEffect(() => {
    const updateScale = () => {
      if (iframeRef.current && containerRef.current) {
        const container = containerRef.current;
        const iframe = iframeRef.current;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        if (containerWidth === 0 || containerHeight === 0) return;

        // Calculate scale to fit
        const scaleX = containerWidth / originalWidth;
        const scaleY = containerHeight / originalHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Apply transform with center origin for perfect centering
        iframe.style.transformOrigin = 'center center';
        iframe.style.transform = `translate(-50%, -50%) scale(${scale})`;
        iframe.style.left = '50%';
        iframe.style.top = '50%';
        
        // Force visibility
        iframe.style.opacity = '1';
      }
    };

    // Initial update
    updateScale();

    // Use ResizeObserver for robust size tracking
    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [htmlContent, originalWidth, originalHeight]);

  // Inject control script into HTML content and fix viewport scaling
  const enhancedHtmlContent = useMemo(() => {
    if (!htmlContent) return undefined;

    let modifiedHtml = htmlContent;

    // Fix viewport dimensions - make it fit the iframe container
    // Replace 100vw/100vh with absolute dimensions that will scale properly
    const styleInjection = `
      <style>
        html, body {
          width: ${originalWidth}px !important;
          height: ${originalHeight}px !important;
          max-width: none !important;
          max-height: none !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          transform-origin: top left;
        }
      </style>
    `;

    // Inject style before closing </head> or at the start of <body>
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${styleInjection}</head>`);
    } else if (modifiedHtml.includes('<body')) {
      modifiedHtml = modifiedHtml.replace('<body', `${styleInjection}<body`);
    } else {
      // Fallback if no head/body tags found
      modifiedHtml = `${styleInjection}${modifiedHtml}`;
    }

    // Inject a script that listens for postMessage and controls the timeline
    const controlScript = `
      <script>
        // Listen for messages from parent window
        window.addEventListener('message', function(event) {
          if (event.data.action === 'play') {
            if (window.tl) {
              if (window.tl.completed) {
                window.tl.restart();
              } else {
                window.tl.play();
              }
            }
          } else if (event.data.action === 'pause') {
            if (window.tl && window.tl.pause) {
              window.tl.pause();
            }
          } else if (event.data.action === 'restart') {
            if (window.tl && window.tl.restart) {
              window.tl.restart();
            }
          }
        });
      </script>
    `;

    // Insert before closing </body> tag
    if (modifiedHtml.includes('</body>')) {
      modifiedHtml = modifiedHtml.replace('</body>', `${controlScript}</body>`);
    } else {
      modifiedHtml += controlScript;
    }

    return modifiedHtml;
  }, [htmlContent, originalWidth, originalHeight]);

  const togglePlayHtml = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const audio = audioRef.current;
      
      if (isPlaying) {
        // Pause both animation and audio
        iframeRef.current.contentWindow.postMessage({ action: 'pause' }, '*');
        if (audio) audio.pause();
        setIsPlaying(false);
      } else {
        // Play both animation and audio
        iframeRef.current.contentWindow.postMessage({ action: 'play' }, '*');
        if (audio) {
          audio.play().catch((err: unknown) => console.error('Audio play failed:', err));
        }
        setIsPlaying(true);
      }
    }
  };

  const restartHtml = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const audio = audioRef.current;
      
      // Restart both animation and audio
      iframeRef.current.contentWindow.postMessage({ action: 'restart' }, '*');
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((err: unknown) => console.error('Audio play failed:', err));
      }
      setIsPlaying(true);
    }
  };

  const copyHtmlToClipboard = async () => {
    if (htmlContent) {
      try {
        await navigator.clipboard.writeText(htmlContent);
        alert('✅ HTML copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('❌ Failed to copy HTML');
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Determine container styles based on aspect ratio
  const containerStyle = useMemo(() => {
    const ratio = aspectRatio.replace(':', '/');
    
    if (aspectRatio === '9:16') {
      return {
        aspectRatio: ratio,
        height: '70vh', // Constrain height for vertical videos
        width: 'auto',
        maxWidth: '100%'
      };
    }
    
    if (aspectRatio === '1:1') {
      return {
        aspectRatio: ratio,
        height: '70vh',
        width: 'auto',
        maxWidth: '100%'
      };
    }

    // Default 16:9
    return {
      aspectRatio: ratio,
      width: '100%',
      height: 'auto'
    };
  }, [aspectRatio]);

  // If we have HTML content (preview mode)
  if (htmlContent) {
    return (
      <div className="glass video-player-wrapper">
        <div className="player-header">
          <h3>🎬 Video Preview</h3>
          <p>HTML Animation with Anime.js</p>
        </div>
        
        <div className="player-center-stage">
          <div 
            className="video-player-container" 
            ref={containerRef}
            style={containerStyle}
          >
            <iframe
              ref={iframeRef}
              srcDoc={enhancedHtmlContent}
              className="video-iframe"
              title="Video Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{
                width: `${originalWidth}px`,
                height: `${originalHeight}px`,
                transformOrigin: 'center center',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)', // Initial transform before JS takes over
                opacity: 0, // Start hidden, show after scale
                transition: 'opacity 0.2s ease'
              }}
            />
            
            {/* Hidden audio element synced with animation */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                preload="auto"
                style={{ display: 'none' }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
              />
            )}
            
            <div className="controls-overlay">
              <div className="controls-row">
                <button className="control-btn" onClick={togglePlayHtml}>
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                
                <button className="control-btn secondary" onClick={restartHtml}>
                  🔄 Restart
                </button>
                
                {onRegenerate && (
                  <button className="control-btn secondary" onClick={onRegenerate}>
                    ♻️ Regenerate
                  </button>
                )}

                {onRender && (
                  <button className="control-btn primary" onClick={() => onRender(duration)}>
                    🚀 Render Video
                  </button>
                )}
              </div>
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </div>

        <div className="player-footer">
          {requestId && (
            <span className="request-id">ID: {requestId}</span>
          )}
          <button className="copy-btn" onClick={copyHtmlToClipboard}>
            📋 Copy HTML
          </button>
        </div>
      </div>
    );
  }

  // If we have a video URL (final rendered video)
  if (videoUrl) {
    return (
      <div className="glass video-player-wrapper">
        <div className="player-header">
          <h3>✨ Final Video</h3>
          <p>Rendered with audio</p>
        </div>
        
        <div className="player-center-stage">
          <div 
            className="video-player-container"
            style={containerStyle}
          >
            <video
              className="video-element"
              src={videoUrl}
              controls
            />
          </div>
        </div>

        <div className="player-footer">
          <a href={videoUrl} download className="download-btn">
            ⬇️ Download Video
          </a>
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="glass video-player-wrapper empty-state">
      <div className="empty-content">
        <div className="empty-icon">🎥</div>
        <h3>No Video Yet</h3>
        <p>Submit a request to create your first video</p>
      </div>
    </div>
  );
};

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
