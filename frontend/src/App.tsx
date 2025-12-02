import { useState } from 'react'
import './App.css'
import { VideoPlayer } from './components/VideoPlayer'
import { VideoRequestForm } from './components/VideoRequestForm'
import { LoadingState } from './components/LoadingState'
import { RevisionChat } from './components/RevisionChat'

type AppState = 'idle' | 'loading' | 'preview' | 'rendering' | 'completed';

interface VideoData {
  requestId: string;
  htmlContent?: string;
  videoUrl?: string;
  script?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

function App() {
  const [state, setState] = useState<AppState>('idle');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  // Configure your backend URL
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const handleVideoRequest = async (prompt: string, aspectRatio: '16:9' | '9:16' | '1:1') => {
    setState('loading');
    setError(null);

    try {
      // Call backend to create video
      const response = await fetch(`${BACKEND_URL}/video-requests/create-full`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      if (!response.ok) {
        throw new Error('Failed to create video request');
      }

      const data = await response.json();
      
      // Poll for the HTML preview
      const requestId = data.requestId;
      await pollForPreview(requestId, aspectRatio);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('idle');
    }
  };

  const pollForPreview = async (requestId: string, aspectRatio: '16:9' | '9:16' | '1:1') => {
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
            aspectRatio,
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

  const handleRefine = async (critique: string) => {
    if (!videoData?.htmlContent) return;
    
    setIsRefining(true);
    try {
      const response = await fetch(`${BACKEND_URL}/video-requests/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: videoData.htmlContent,
          critique,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine video');
      }

      const data = await response.json();
      setVideoData((prev) => prev ? { ...prev, htmlContent: data.htmlContent } : null);
    } catch (err) {
      console.error('Refinement error:', err);
      throw err; // Propagate to chat component
    } finally {
      setIsRefining(false);
    }
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
        <div className="left-panel">
          <VideoRequestForm 
            onSubmit={handleVideoRequest} 
            isLoading={state === 'loading'} 
          />
          
          {state === 'preview' && (
            <div className="chat-container">
              <RevisionChat onRefine={handleRefine} isRefining={isRefining} />
            </div>
          )}
        </div>

        {/* Right Panel - Video Player or Loading State */}
        <div className="right-panel">
          {state === 'idle' && (
            <div className="placeholder-state">
              <div className="placeholder-icon">🎬</div>
              <h3>Ready to Create</h3>
              <p>Enter a topic on the left to generate your video</p>
            </div>
          )}

          {state === 'loading' && (
            <LoadingState message="Generating script, audio, and animation..." />
          )}

          {state === 'preview' && videoData?.htmlContent && (
            <VideoPlayer 
              htmlContent={videoData.htmlContent}
              aspectRatio={videoData.aspectRatio || '16:9'}
            />
          )}

          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={handleRegenerate}>Try Again</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
