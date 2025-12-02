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
    const maxAttempts = 120; // 2 minutes max wait for initial draft
    let attempts = 0;
    let isPreviewActive = true;

    const poll = async () => {
      if (!isPreviewActive) return;

      try {
        const response = await fetch(`${BACKEND_URL}/poc/preview/${requestId}`);
        
        if (response.ok) {
          const htmlContent = await response.text();
          
          // Update state with new content
          setVideoData(prev => {
            // Only update if content changed to avoid re-renders
            if (prev?.htmlContent === htmlContent) return prev;
            return {
              requestId,
              htmlContent,
              aspectRatio,
            };
          });
          
          setState('preview');
          
          // Continue polling for updates (refinements) every 2 seconds
          setTimeout(poll, 2000);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          // Only throw timeout if we never got ANY content
          if (state !== 'preview') {
            throw new Error('Timeout waiting for preview');
          }
        }
      } catch (err) {
        // If we already have a preview, just log error and retry later (maybe server is busy)
        if (state === 'preview') {
          console.warn('Poll failed, retrying...', err);
          setTimeout(poll, 5000);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load preview');
          setState('idle');
        }
      }
    };

    poll();
    
    // Cleanup function to stop polling if component unmounts or request changes
    return () => { isPreviewActive = false; };
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
