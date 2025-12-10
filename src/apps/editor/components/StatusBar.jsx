import React from 'react';
import './StatusBar.css';

const StatusBar = ({ 
  lastSaved, 
  isDirty, 
  isOnline, 
  currentTool, 
  selectedCount 
}) => {
  const formatLastSaved = (timestamp) => {
    if (!timestamp) return 'Chưa bao giờ lưu';
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Vừa lưu';
    if (minutes < 60) return `Saved ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Saved ${hours}h ago`;
    return `Saved ${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="status-bar">
      <div className="status-section">
        <span className={`save-status ${isDirty ? 'dirty' : 'clean'}`}>
          {isDirty ? (
            <>
              <span className="status-dot dirty"></span>
              Unsaved changes
            </>
          ) : (
            <>
              <span className="status-dot clean"></span>
              {formatLastSaved(lastSaved)}
            </>
          )}
        </span>
      </div>
      
      <div className="status-section">
        {currentTool && <span>Tool: {currentTool}</span>}
        {selectedCount > 0 && <span>{selectedCount} selected</span>}
      </div>
      
      <div className="status-section">
        <span className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
};

export default StatusBar;