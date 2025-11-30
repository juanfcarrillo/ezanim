import React, { useRef, useState, useMemo, useEffect } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  htmlContent?: string;
  videoUrl?: string;
  requestId?: string;
  onRegenerate?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  htmlContent, 
  videoUrl,
  requestId,
  onRegenerate 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Generate audio URL when requestId is available
  const audioUrl = useMemo(() => {
    if (requestId && htmlContent) {
      return `${BACKEND_URL}/poc/audio/${requestId}`;
    }
    return null;
  }, [requestId, htmlContent, BACKEND_URL]);

  // Scale iframe to fit container
  useEffect(() => {
    const updateScale = () => {
      if (iframeRef.current && containerRef.current) {
        const container = containerRef.current;
        const iframe = iframeRef.current;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Original dimensions of the HTML content
        const originalWidth = 1920;
        const originalHeight = 1080;
        
        // Calculate scale to fit
        const scaleX = containerWidth / originalWidth;
        const scaleY = containerHeight / originalHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Apply transform
        iframe.style.transform = `scale(${scale})`;
        
        // Center if needed
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;
        const offsetX = (containerWidth - scaledWidth) / 2;
        const offsetY = (containerHeight - scaledHeight) / 2;
        
        iframe.style.left = `${offsetX}px`;
        iframe.style.top = `${offsetY}px`;
      }
    };

    // Update scale on mount and resize
    updateScale();
    window.addEventListener('resize', updateScale);
    
    // Small delay to ensure iframe is loaded
    const timer = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timer);
    };
  }, [htmlContent]);

  // Inject control script into HTML content and fix viewport scaling
  const enhancedHtmlContent = useMemo(() => {
    if (!htmlContent) return undefined;

    let modifiedHtml = htmlContent;

    // Fix viewport dimensions - make it fit the iframe container
    // Replace 100vw/100vh with absolute dimensions that will scale properly
    const styleInjection = `
      <style>
        html, body {
          width: 1920px !important;
          height: 1080px !important;
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
    modifiedHtml = modifiedHtml.replace('</body>', `${controlScript}</body>`);

    return modifiedHtml;
  }, [htmlContent]);

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
          audio.play().catch(err => console.error('Audio play failed:', err));
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
        audio.play().catch(err => console.error('Audio play failed:', err));
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

  const togglePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // If we have HTML content (preview mode)
  if (htmlContent) {
    return (
      <div className="glass video-player-wrapper">
        <div className="player-header">
          <h3>🎬 Video Preview</h3>
          <p>HTML Animation with Anime.js</p>
        </div>
        
        <div className="video-player-container" ref={containerRef}>
          <iframe
            ref={iframeRef}
            srcDoc={enhancedHtmlContent}
            className="video-iframe"
            title="Video Preview"
            sandbox="allow-scripts allow-same-origin"
          />
          
          {/* Hidden audio element synced with animation */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="auto"
              style={{ display: 'none' }}
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
        
        <div className="video-player-container">
          <video
            ref={videoRef}
            className="video-element"
            src={videoUrl}
            onClick={togglePlayVideo}
            controls
          />
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
