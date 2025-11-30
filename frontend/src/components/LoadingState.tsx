import React from 'react';
import './LoadingState.css';

interface LoadingStateProps {
  stage?: string;
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  stage = 'Processing', 
  message = 'Your video is being created...' 
}) => {
  return (
    <div className="glass loading-state">
      <div className="loading-content">
        <div className="loader-container">
          <div className="loader">
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
          </div>
        </div>
        
        <h3>{stage}</h3>
        <p>{message}</p>
        
        <div className="loading-steps">
          <div className="step">
            <div className="step-icon">📝</div>
            <span>Generating Script</span>
          </div>
          <div className="step">
            <div className="step-icon">🎙️</div>
            <span>Creating Audio</span>
          </div>
          <div className="step">
            <div className="step-icon">✨</div>
            <span>Building Animation</span>
          </div>
          <div className="step">
            <div className="step-icon">🎬</div>
            <span>Rendering Video</span>
          </div>
        </div>
      </div>
    </div>
  );
};
