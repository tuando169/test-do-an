import React, { useState, useEffect, useRef } from 'react';
import './MobileControls.css';

const MobileControls = ({ onMove, onJoystickStateChange, onHidePanels }) => {
  const [isMobile, setIsMobile] = useState(false);
  const joystickRef = useRef(null);
  const knobRef = useRef(null);
  const joystickPointerId = useRef(null);
  const active = useRef(false);
  const joystickTouchId = useRef(null);

  const handleTouchStart = (e) => {
  for (const touch of e.changedTouches) {
    const el = joystickRef.current;
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    ) {
      joystickTouchId.current = touch.identifier;
      active.current = true;
      requestAnimationFrame(() => onJoystickStateChange?.(true));
      onHidePanels?.(); // Hide any open panels when joystick becomes active
      updateJoystick(touch.clientX, touch.clientY);
      break;
    }
  }
};

const handleTouchMove = (e) => {
  if (!active.current) return;
  const touch = [...e.touches].find(t => t.identifier === joystickTouchId.current);
  if (!touch) return;
  updateJoystick(touch.clientX, touch.clientY);
};

const handleTouchEnd = (e) => {
  const released = [...e.changedTouches].some(t => t.identifier === joystickTouchId.current);
  if (released && active.current) {
    active.current = false;
    joystickTouchId.current = null;
    requestAnimationFrame(() => {
  if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
});

    onMove?.(0, 0);
    requestAnimationFrame(() => onJoystickStateChange?.(false));
  }
};

  // Detect mobile
  useEffect(() => {
    const check = () =>
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth <= 768
      );
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    // Force non-passive touchmove on joystick container
    const el = joystickRef.current;
    if (el) {
      const handler = (e) => e.preventDefault();
      el.addEventListener('touchmove', handler, { passive: false });
      return () => el.removeEventListener('touchmove', handler);
    }
  }, []);

  useEffect(() => {
    const el = joystickRef.current;
    if (!el) return;
    const preventDefaultMove = (e) => e.preventDefault();
    el.addEventListener('touchmove', preventDefaultMove, { passive: false });
    return () => el.removeEventListener('touchmove', preventDefaultMove);
  }, []);

  useEffect(() => {
    const forceReset = () => {
      if (active.current) {
        active.current = false;
        joystickPointerId.current = null;
        if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
        onMove?.(0, 0);
        requestAnimationFrame(() => onJoystickStateChange?.(false));
      }
    };
    window.addEventListener('pointercancel', forceReset);
    window.addEventListener('touchcancel', forceReset);
    return () => {
      window.removeEventListener('pointercancel', forceReset);
      window.removeEventListener('touchcancel', forceReset);
    };
  }, []);

  const updateJoystick = (clientX, clientY) => {
    const el = joystickRef.current;
    const knob = knobRef.current;
    if (!el || !knob) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = rect.width * 0.4;

    const ratio = dist > max ? max / dist : 1;
    const finalX = dx * ratio;
    const finalY = dy * ratio;

    // Apply transform directly (no React re-render)
    knob.style.transform = `translate(${finalX}px, ${finalY}px)`;

    const nx = finalX / max;
    const ny = -finalY / max;
    onMove?.(nx, ny);
  };

  useEffect(() => {
    const preventGesture = (e) => e.preventDefault();
    document.addEventListener('gesturestart', preventGesture);
    document.addEventListener('gesturechange', preventGesture);
    document.addEventListener('gestureend', preventGesture);
    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  }, []);

  if (!isMobile) return null;

  return (
    <div className="mobile-controls">
      <div className="mobile-joystick-container left">
        <div
          ref={joystickRef}
          className="mobile-joystick"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div ref={knobRef} className="mobile-joystick-knob" />
        </div>

      </div>
    </div>
  );
};

export default MobileControls;
