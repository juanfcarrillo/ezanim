import React, { useState } from 'react';
import './VideoRequestForm.css';

interface VideoRequestFormProps {
  onSubmit: (prompt: string, aspectRatio: '16:9' | '9:16' | '1:1') => void;
  isLoading: boolean;
}

export const VideoRequestForm: React.FC<VideoRequestFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length >= 10) {
      onSubmit(prompt, aspectRatio);
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

        <div className="form-group">
          <label htmlFor="aspectRatio">Aspect Ratio</label>
          <select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
            disabled={isLoading}
            className="aspect-ratio-select"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait/Shorts)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isLoading || prompt.trim().length < 10}
        >
          {isLoading ? 'Creating...' : '🚀 Generate Video'}
        </button>
      </form>
    </div>
  );
};
