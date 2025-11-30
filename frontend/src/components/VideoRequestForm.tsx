import React, { useState } from 'react';
import './VideoRequestForm.css';

interface VideoRequestFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const VideoRequestForm: React.FC<VideoRequestFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length >= 10) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="glass video-request-form">
      <h2>✨ Create Your Video</h2>
      <p className="form-description">
        Describe what you want to explain in your video. Be specific and detailed.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="prompt">Video Topic</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Explain the facade design pattern in software engineering with a real-world analogy..."
            rows={6}
            disabled={isLoading}
            minLength={10}
            required
          />
          <span className="char-count">
            {prompt.length} characters {prompt.length < 10 && `(minimum 10)`}
          </span>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isLoading || prompt.trim().length < 10}
        >
          {isLoading ? 'Creating...' : '🚀 Generate Video'}
        </button>
      </form>

      <div className="form-footer">
        <p>⚡ Powered by AI • 🎙️ ElevenLabs Voice • ✨ Anime.js Animations</p>
      </div>
    </div>
  );
};
