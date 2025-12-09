import React, { useEffect, useState, useRef } from 'react';
import './toast.css';

const Toast = ({
  message,
  type = 'success',
  visible,
  onClose,
  duration = 3000,
}) => {
  const [progressKey, setProgressKey] = useState(0);
  const prevVisibleRef = useRef(visible);
  const prevMessageRef = useRef(message);

  // Effect for handling progress bar reset when toast becomes visible OR message changes
  useEffect(() => {
    const becameVisible = visible && !prevVisibleRef.current;
    const messageChanged = visible && message !== prevMessageRef.current;

    if (becameVisible || messageChanged) {
      setProgressKey((prev) => prev + 1);
    }

    prevVisibleRef.current = visible;
    prevMessageRef.current = message;
  }, [visible, message]);

  // Effect for handling timer
  useEffect(() => {
    let timer;
    if (visible && duration > 0) {
      timer = setTimeout(() => {
        onClose();
      }, duration);
    }

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`toast toast-${type}`}
      onClick={() => {
        onClose();
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className='toast-content'>
        {type === 'success' && (
          <svg
            className='toast-icon'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <polyline points='20,6 9,17 4,12'></polyline>
          </svg>
        )}
        {type === 'error' && (
          <svg
            className='toast-icon'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <circle cx='12' cy='12' r='10'></circle>
            <line x1='15' y1='9' x2='9' y2='15'></line>
            <line x1='9' y1='9' x2='15' y2='15'></line>
          </svg>
        )}
        {type === 'info' && (
          <svg
            className='toast-icon'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <circle cx='12' cy='12' r='10'></circle>
            <line x1='12' y1='16' x2='12' y2='12'></line>
            <line x1='12' y1='8' x2='12.01' y2='8'></line>
          </svg>
        )}
        {type === 'warning' && (
          <svg
            className='toast-icon'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'></path>
            <line x1='12' y1='9' x2='12' y2='13'></line>
            <line x1='12' y1='17' x2='12.01' y2='17'></line>
          </svg>
        )}
        <span className='toast-message'>{message}</span>
        <button
          className='toast-close-btn'
          onClick={() => {
            onClose();
          }}
          aria-label='Close notification'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <line x1='18' y1='6' x2='6' y2='18'></line>
            <line x1='6' y1='6' x2='18' y2='18'></line>
          </svg>
        </button>
      </div>
      {duration > 0 && (
        <div
          key={progressKey}
          className='toast-progress'
          style={{
            animationDuration: `${duration}ms`,
          }}
        />
      )}
    </div>
  );
};

export default Toast;
