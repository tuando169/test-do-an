import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress, message, visible }) => {
  if (!visible) return null;

  return (
    <div className="progress-overlay">
      <div className="progress-container">
        <div className="progress-message">{message}</div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-percentage">{Math.round(progress)}%</div>
      </div>
    </div>
  );
};

export default ProgressBar;