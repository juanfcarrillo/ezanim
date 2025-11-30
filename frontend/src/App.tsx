import { useState } from 'react'
import './App.css'
import { VideoPlayer } from './components/VideoPlayer'
import { VideoRequestForm } from './components/VideoRequestForm'
import { LoadingState } from './components/LoadingState'

type AppState = 'idle' | 'loading' | 'preview' | 'rendering' | 'completed';

interface VideoData {
  requestId: string;
  htmlContent?: string;
  videoUrl?: string;
  script?: string;
}

function App() {
  const [state, setState] = useState<AppState>('idle');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Configure your backend URL
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const handleVideoRequest = async (prompt: string) => {
    setState('loading');
    setError(null);

    try {
      // Call backend to create video
      const response = await fetch(`${BACKEND_URL}/video-requests/create-full`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to create video request');
      }

      const data = await response.json();
      
      // Poll for the HTML preview
      const requestId = data.requestId;
      await pollForPreview(requestId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('idle');
    }
  };

  const pollForPreview = async (requestId: string) => {
    const maxAttempts = 30; // 30 seconds
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/poc/preview/${requestId}`);
        
        if (response.ok) {
          const htmlContent = await response.text();
          setVideoData({
            requestId,
            htmlContent,
          });
          setState('preview');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          throw new Error('Timeout waiting for preview');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
        setState('idle');
      }
    };

    poll();
  };

  const handleRegenerate = () => {
    setVideoData(null);
    setState('idle');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>✨ Ezanim</h1>
        <p>Create AI-powered explainer videos with animations</p>
      </header>
      
      <main className="content-wrapper">
        {/* Request Form - Always visible on the left */}
        <div>
          <VideoRequestForm 
            onSubmit={handleVideoRequest}
            isLoading={state === 'loading'}
          />
          
          {error && (
            <div className="glass error-message" style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'rgba(239, 68, 68, 0.2)',
              borderColor: 'rgba(239, 68, 68, 0.4)'
            }}>
              <p style={{ color: 'white', margin: 0 }}>⚠️ {error}</p>
            </div>
          )}
        </div>

        {/* Right side - State based content */}
        <div>
          {state === 'idle' && (
            <VideoPlayer />
          )}

          {state === 'loading' && (
            <LoadingState 
              stage="Creating Video"
              message="Generating script, audio, and animations..."
            />
          )}

          {(state === 'preview' || state === 'rendering' || state === 'completed') && videoData && (
            <VideoPlayer
              htmlContent={videoData.htmlContent}
              videoUrl={videoData.videoUrl}
              requestId={videoData.requestId}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
      </main>

      <footer style={{ 
        textAlign: 'center', 
        marginTop: '4rem', 
        padding: '2rem',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.9rem'
      }}>
        <p>Powered by NestJS • Puppeteer • Anime.js • ElevenLabs</p>
      </footer>
    </div>
  )
}

export default App
