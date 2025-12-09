/**
 * SoundController - A comprehensive audio management class
 * Handles multiple audio streams with automatic volume balancing
 * Enhanced with iOS compatibility fixes
 */
class SoundController {
  constructor(options = {}) {
    this.audioContext = null;
    this.masterGainNode = null;
    this.audioElements = new Map(); // Map to store audio elements by ID
    this.gainNodes = new Map(); // Map to store gain nodes for volume control
    this.isInitialized = false;
    this.isIOS = this.detectIOS();
    this.userInteracted = false;
    
    // Configuration
    this.config = {
      masterVolume: options.masterVolume || 1.0,
      backgroundVolume: options.backgroundVolume || 0.3,
      maxConcurrentAudio: options.maxConcurrentAudio || 5,
      autoVolumeAdjustment: options.autoVolumeAdjustment !== false, // default true
      backgroundAudioUrl: options.backgroundAudioUrl || null,
      autoPlayBackground: options.autoPlayBackground || false,
      fadeInDuration: options.fadeInDuration || 1000, // ms
      fadeOutDuration: options.fadeOutDuration || 500, // ms
    };

    // Initialize audio context on first user interaction
    this.initPromise = null;
    
    // iOS-specific setup
    if (this.isIOS) {
      this.setupIOSAudioUnlock();
    }
    document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && this.audioContext?.state === 'suspended') {
      try { await this.audioContext.resume(); } catch {}
    }
  });
  }

  /**
   * Detect if the device is iOS
   */
  detectIOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOSDevice) {
      // Detect iOS version for enhanced compatibility
      const iosVersion = this.getIOSVersion();
      console.log(`iOS detected - Version: ${iosVersion}, Device: ${navigator.userAgent}`);
      
      // iPhone 12 Pro Max and newer need special handling
      this.isModernIOS = iosVersion >= 14;
      this.isStrictAudioPolicy = iosVersion >= 15; // iOS 15+ has stricter audio policies
    }
    
    return isIOSDevice;
  }

  /**
   * Get iOS version
   */
  getIOSVersion() {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return parseInt(match[1], 10);
    }
    // Fallback for newer iOS versions that don't report version
    return 15; // Assume modern iOS
  }

  /**
   * Verify audio unlock status specifically for iPhone 12 Pro Max
   */
  async verifyIOSAudioUnlock() {
    if (!this.isIOS) return true;
    
    console.log('iOS: Verifying audio unlock status...');
    
    // Check AudioContext state
    const contextReady = this.audioContext && this.audioContext.state === 'running';
    console.log(`iOS: AudioContext state: ${this.audioContext?.state}, ready: ${contextReady}`);
    
    // For iPhone 12 Pro Max and newer, perform additional verification
    if (this.isModernIOS) {
      try {
        // Test if we can create and play a silent audio buffer
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start();
        
        // Test if we can play HTML5 audio
        const testAudio = document.createElement('audio');
        testAudio.volume = 0;
        testAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSqS3PLEcSMELYfP8daLOgcZYrnr4Z1OEg1Tq+T0s2ESCA==';
        
        const canPlay = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(false), 2000);
          
          testAudio.addEventListener('canplaythrough', () => {
            clearTimeout(timeout);
            resolve(true);
          }, { once: true });
          
          testAudio.addEventListener('error', () => {
            clearTimeout(timeout);
            resolve(false);
          }, { once: true });
          
          testAudio.load();
        });
        
        console.log(`iOS: Test audio can play: ${canPlay}`);
        return contextReady && canPlay;
        
      } catch (error) {
        console.warn('iOS: Audio unlock verification failed:', error);
        return false;
      }
    }
    
    return contextReady;
  }

  /**
   * Setup iOS audio unlock mechanism
   */
  setupIOSAudioUnlock() {
    const unlockAudio = async (event) => {
      if (this.userInteracted) return;
      
      console.log(`iOS: User interaction detected (${event.type}), unlocking audio`);
      this.userInteracted = true;
      
      // Create a test audio element to unlock the audio system
      try {
        const testAudio = new Audio();
        testAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        testAudio.volume = 0.01;
        testAudio.muted = true;
        
        // For modern iOS (iPhone 12 Pro Max and newer)
        if (this.isModernIOS) {
          testAudio.setAttribute('webkit-playsinline', 'true');
          testAudio.setAttribute('playsinline', 'true');
          testAudio.setAttribute('autoplay', 'false');
        }
        
        await testAudio.play();
        testAudio.pause();
        testAudio.currentTime = 0;
        console.log('iOS: Audio unlock successful');
      } catch (error) {
        console.warn('iOS: Audio unlock test failed:', error);
      }
      
      // Try to resume audio context if it exists
      if (this.audioContext) {
        try {
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('iOS: AudioContext resumed');
          }
        } catch (err) {
          console.warn('iOS: Failed to resume AudioContext:', err);
        }
      }
      
      // Remove event listeners after first interaction
      this.removeIOSEventListeners(unlockAudio);
    };

    // Store reference for removal
    this.iosUnlockHandler = unlockAudio;
    
    // Add comprehensive event listeners for iOS unlock
    const events = ['touchstart', 'touchend', 'click', 'pointerdown', 'pointerup'];
    events.forEach(eventType => {
      document.addEventListener(eventType, unlockAudio, { 
        passive: true, 
        once: false,
        capture: true 
      });
    });
    
    // Also listen on window for broader coverage
    window.addEventListener('click', unlockAudio, { passive: true, once: true });
    
    // ✅ Universal fallback unlock: bất kỳ chạm nào cũng resume AudioContext
    document.addEventListener('touchstart', async () => {
      if (this.audioContext?.state === 'suspended') {
        try {
          await this.audioContext.resume();
          this.userInteracted = true;
          console.log('🔓 AudioContext unlocked by fallback touch');
        } catch (e) {
          console.warn('Fallback unlock failed:', e);
        }
      }
    }, { once: true });

    console.log('iOS: Audio unlock handlers registered');
  }

  /**
   * Remove iOS event listeners
   */
  removeIOSEventListeners(handler) {
    const events = ['touchstart', 'touchend', 'click', 'pointerdown', 'pointerup'];
    events.forEach(eventType => {
      document.removeEventListener(eventType, handler, { capture: true });
    });
    window.removeEventListener('click', handler);
    console.log('iOS: Audio unlock handlers removed');
  }

  /**
   * Initialize the audio context and master gain node
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // For iOS, wait for user interaction
      if (this.isIOS && !this.userInteracted) {
        console.log('iOS: Waiting for user interaction to initialize audio');
        return new Promise((resolve) => {
          const checkInteraction = () => {
            if (this.userInteracted) {
              this.initAudioContext().then(resolve);
            } else {
              setTimeout(checkInteraction, 100);
            }
          };
          checkInteraction();
        });
      }
      
      return this.initAudioContext();
    } catch (error) {
      console.error('Failed to initialize SoundController:', error);
      throw error;
    }
  }

  /**
   * Initialize the actual audio context
   */
  async initAudioContext() {
  if (this.isInitialized) return;

  this.audioContext = window.__globalAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
  window.__globalAudioCtx = this.audioContext;

  if (this.audioContext.state === 'suspended') {
    await this.audioContext.resume();
  }

  this.masterGainNode = this.audioContext.createGain();
  this.masterGainNode.connect(this.audioContext.destination);
  this.masterGainNode.gain.value = this.config.masterVolume;

  this.isInitialized = true;
  console.log("✅ AudioContext initialized");
}

  /**
   * Ensure audio context is initialized
   */
  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    return this.initPromise;
  }

  async ensureResumed() {
    await this.ensureInitialized();

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('🔊 AudioContext resumed by user gesture');
      } catch (err) {
        console.warn('⚠️ Failed to resume AudioContext:', err);
      }
    }

    this.userInteracted = true;
    return true;
  }

  /**
   * Play background audio that loops continuously
   * @param {string} url - Audio file URL
   * @param {number} volume - Volume level (0-1), optional
   */
  async playBackgroundAudio(url, volume = this.config.backgroundVolume) {
    
    await this.ensureInitialized();

    const audioId = 'background_audio';

    // Stop existing background audio
    if (this.audioElements.has(audioId)) {
      this.stopAudio(audioId);
    }

    // iOS double-check unlock
    if (this.isIOS) {
      await this.resumeAudioContext();
    }

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.playsInline = true;
    audio.preload = 'auto';
    audio.muted = false;
    audio.defaultMuted = false;

    const track = this.audioContext.createMediaElementSource(audio);
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);

    if (!this.masterGainNode) {
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = this.config.masterVolume;
      this.masterGainNode.connect(this.audioContext.destination);
    }

    track.connect(gain);
    gain.connect(this.masterGainNode);

    this.audioElements.set(audioId, {
      audio,
      source: track,
      gainNode: gain,
      volume,
      isBackground: true,
      url,
      loop: true,
    });

    try {
      await audio.play();
      console.log(" Background audio started:", url);
    } catch (err) {
      console.warn(" Background audio play failed:", err);
    }

    // Safari tends to zero out gain on init — force restore
    setTimeout(() => {
      gain.gain.setValueAtTime(volume, this.audioContext.currentTime + 0.1);
      console.log(" Enforced background gain:", volume);
    }, 800);

    return audioId;
  }

  /**
   * Play audio from a given URL
   * @param {string} url - Audio file URL
   * @param {Object} options - Audio options
   */
  async playAudio(url, options = {}) {
  await this.ensureInitialized();
  await this.ensureResumed();

  const id = options.id || "tour_audio";

  // 🔹 Nếu audio đã tồn tại — reuse nó
  let audioData = this.audioElements.get(id);
  let audio;
  if (audioData?.audio) {
    audio = audioData.audio;
    if (audio.src !== url) {
      try {
        audio.pause();
        audio.src = url;
        audio.load();
      } catch (err) {
        console.warn("Reuse audio failed, fallback to recreate", err);
        audio = new Audio(url);
      }
    }
  } else {
    audio = new Audio(url);
  }

  audio.crossOrigin = "anonymous";
  audio.playsInline = true;
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audio.loop = options.loop ?? false;
  audio.volume = options.volume ?? 1.0;

  // 🔹 Nếu chưa có gain node thì tạo mới
  let gainNode = audioData?.gainNode;
  if (!gainNode) {
    const track = this.audioContext.createMediaElementSource(audio);
    gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(audio.volume, this.audioContext.currentTime);
    track.connect(gainNode);
    gainNode.connect(this.masterGainNode);

    this.audioElements.set(id, { audio, gainNode, url });
  }

  // 🔹 Gọi play() non-await để không block gesture
  try {
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(err => console.warn("🔇 Safari blocked play:", err));
    }
  } catch (err) {
    console.warn("🔇 Play failed:", err);
  }

  return audio;
}


  /**
   * Enhanced iOS audio loading with multiple fallback strategies
   * @param {HTMLAudioElement} audio - Audio element
   * @param {string} url - Audio URL
   */
  async loadAudioForIOS(audio, url) {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = 10000; // 10 second timeout
      
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('loadeddata', onLoadedData);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('abort', onError);
        clearTimeout(timeoutId);
      };
      
      const resolveOnce = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        console.log('iOS: Audio loaded successfully');
        resolve();
      };
      
      const rejectOnce = (error) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        console.error('iOS: Audio load failed:', error);
        reject(new Error(`iOS audio load failed: ${error.message || 'Unknown error'}`));
      };
      
      // Multiple event listeners for different iOS behaviors
      const onCanPlay = () => {
        console.log('iOS: canplaythrough event fired');
        resolveOnce();
      };
      
      const onLoadedData = () => {
        console.log('iOS: loadeddata event fired');
        // For iPhone 12 Pro Max, sometimes this is the only reliable event
        if (this.isModernIOS && audio.readyState >= 2) {
          resolveOnce();
        }
      };
      
      const onLoadedMetadata = () => {
        console.log('iOS: loadedmetadata event fired');
        // Backup for when canplaythrough doesn't fire
        if (audio.duration > 0) {
          setTimeout(resolveOnce, 100); // Small delay to ensure readiness
        }
      };
      
      const onError = (e) => {
        console.warn('iOS: Audio load error:', e);
        rejectOnce(e);
      };
      
      // Set up event listeners
      audio.addEventListener('canplaythrough', onCanPlay, { once: true });
      audio.addEventListener('loadeddata', onLoadedData, { once: false });
      audio.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.addEventListener('abort', onError, { once: true });
      
      // Timeout fallback
      const timeoutId = setTimeout(() => {
        if (audio.readyState >= 2) {
          // Audio seems ready even without events
          console.log('iOS: Audio load timeout but readyState indicates ready');
          resolveOnce();
        } else {
          rejectOnce(new Error('Audio load timeout'));
        }
      }, timeout);
      
      try {
        // Force load with multiple strategies
        audio.load();
        
        // For iPhone 12 Pro Max, sometimes we need to force a play/pause cycle
        if (this.isModernIOS && this.userInteracted) {
          setTimeout(async () => {
            try {
              audio.volume = 0.01;
              await audio.play();
              audio.pause();
              audio.currentTime = 0;
              audio.volume = 1.0;
              console.log('iOS: Forced play/pause cycle completed');
            } catch (e) {
              console.warn('iOS: Forced play/pause failed:', e);
            }
          }, 100);
        }
      } catch (error) {
        rejectOnce(error);
      }
    });
  }

  /**
   * Play audio with retry logic for iOS compatibility
   * @param {HTMLAudioElement} audio - Audio element
   * @param {string} id - Audio ID for logging
   */
  async playAudioWithRetry(audio, id, maxRetries = 5) {
    // Increase retries for modern iOS devices
    if (this.isModernIOS) {
      maxRetries = 7;
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // For iPhone 12 Pro Max and newer, ensure proper context state
        if (this.isModernIOS && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
          console.log(`iOS: AudioContext resumed for play attempt ${attempt}`);
        }
        
        // Additional checks for strict audio policy devices
        if (this.isStrictAudioPolicy) {
          // Ensure user interaction occurred
          if (!this.userInteracted) {
            throw new Error('User interaction required for audio playback');
          }
          
          // Verify audio element state
          if (audio.readyState < 2) {
            console.warn(`iOS: Audio not ready (readyState: ${audio.readyState}), forcing load`);
            audio.load();
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        await audio.play();
        console.log(`iOS: Audio play successful on attempt ${attempt} for ${id}`);
        return; // Success
        
      } catch (error) {
        console.warn(`iOS: Audio play attempt ${attempt}/${maxRetries} failed for ${id}:`, error.message);
        
        if (attempt < maxRetries) {
          // Progressive delay with additional strategies for iPhone 12 Pro Max
          const delay = this.isModernIOS ? 200 * attempt : 100 * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Try additional recovery strategies
          if (this.isModernIOS) {
            try {
              // Strategy 1: Reset audio element
              if (attempt === 2) {
                audio.currentTime = 0;
                audio.load();
              }
              
              // Strategy 2: Force audio context interaction
              if (attempt === 3) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = 0;
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.01);
              }
              
            } catch (strategyError) {
              console.warn(`iOS: Recovery strategy ${attempt} failed:`, strategyError);
            }
          }
          
          // Try to resume audio context if suspended
          if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
              await this.audioContext.resume();
              console.log(`iOS: AudioContext resumed on attempt ${attempt}`);
            } catch (resumeError) {
              console.warn(`iOS: Failed to resume AudioContext:`, resumeError);
            }
          }
        } else {
          // Final attempt failed
          console.error(`iOS: Failed to play audio after ${maxRetries} attempts for ${id}`);
          throw new Error(`iOS: Failed to play audio after ${maxRetries} attempts: ${error.message}`);
        }
      }
    }
  }

  /**
   * Check if audio with given ID exists
   * @param {string} id - Audio ID
   * @returns {boolean} - Whether audio exists
   */
  hasAudio(id) {
    return this.audioElements.has(id);
  }

  /**
   * Stop a specific audio by ID
   * @param {string} id - Audio ID
   * @param {boolean} fadeOut - Whether to fade out before stopping
   */
  stopAudio(id, fadeOut = false) {
    const audioData = this.audioElements.get(id);
    if (!audioData) {
      // Silently return if audio doesn't exist - this is common in cleanup scenarios
      return;
    }

    if (fadeOut) {
      this.fadeOut(id, this.config.fadeOutDuration).then(() => {
        this.removeAudio(id);
      });
    } else {
      this.removeAudio(id);
    }
  }

  /**
   * Remove audio element and clean up resources
   * @param {string} id - Audio ID
   */
  removeAudio(id) {
    const audioData = this.audioElements.get(id);
    if (!audioData) return;

    const { audio, source, gainNode } = audioData;
    
    try {
      // Stop audio
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      
      // Disconnect nodes safely
      if (source && typeof source.disconnect === 'function') {
        source.disconnect();
      }
      if (gainNode && typeof gainNode.disconnect === 'function') {
        gainNode.disconnect();
      }
      
      // Remove references
      this.audioElements.delete(id);
      this.gainNodes.delete(id);
      
      // Auto-adjust remaining volumes
      if (this.config.autoVolumeAdjustment) {
        this.autoAdjustVolumes();
      }
      
      console.log(`Audio stopped and removed: ${id}`);
    } catch (error) {
      console.error(`Error removing audio ${id}:`, error);
    }
  }

  /**
   * Stop all audio
   * @param {boolean} fadeOut - Whether to fade out before stopping
   */
  stopAllAudio(fadeOut = false) {
    const audioIds = Array.from(this.audioElements.keys());
    audioIds.forEach(id => this.stopAudio(id, fadeOut));
  }

  /**
   * Adjust volume for a specific audio
   * @param {string} id - Audio ID
   * @param {number} volume - Volume level (0-1)
   * @param {number} duration - Fade duration in ms (optional)
   */
  setVolume(id, volume, duration = 0) {
    const audioData = this.audioElements.get(id);
    if (!audioData) {
      console.warn(`Audio with ID ${id} not found`);
      return;
    }

    // Update stored volume
    audioData.volume = volume;

    if (duration > 0) {
      // Smooth volume transition
      this.fadeToVolume(id, volume, duration);
    } else {
      // Immediate volume change
      audioData.gainNode.gain.value = volume;
    }
  }

  /**
   * Set loop state for a specific audio
   * @param {string} id - Audio ID
   * @param {boolean} loop - Whether to loop the audio
   */
  setLoop(id, loop) {
    const audioData = this.audioElements.get(id);
    if (!audioData) {
      console.warn(`Audio with ID ${id} not found`);
      return false;
    }

    // Update the audio element's loop property
    audioData.audio.loop = loop;
    // Update stored loop state
    audioData.loop = loop;
    
    console.log(`Audio ${id} loop set to: ${loop}`);
    return true;
  }

  /**
   * Pause a specific audio by ID
   * @param {string} id - Audio ID
   * @returns {boolean} - Success status
   */
  pauseAudio(id) {
    const audioData = this.audioElements.get(id);
    if (!audioData) {
      console.warn(`Audio with ID ${id} not found`);
      return false;
    }

    try {
      audioData.audio.pause();
      console.log(`Audio paused: ${id}`);
      return true;
    } catch (error) {
      console.error(`Error pausing audio ${id}:`, error);
      return false;
    }
  }

  /**
   * Resume a specific audio by ID
   * @param {string} id - Audio ID
   * @returns {boolean} - Success status
   */
  async resumeAudio(id) {
    const audioData = this.audioElements.get(id);
    if (!audioData) {
      console.warn(`Audio with ID ${id} not found`);
      return false;
    }

    const { audio, gainNode } = audioData;

    try {
      // 1️⃣ Resume AudioContext if needed
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
        console.log(`AudioContext resumed for ${id}`);
      }

      // 2️⃣ Reconnect if the source was disconnected
      try {
        const test = gainNode.gain.value; // will throw if disconnected
      } catch (err) {
        console.warn(`Rebuilding audio graph for ${id}`);
        const newSource = this.audioContext.createMediaElementSource(audio);
        newSource.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        audioData.source = newSource;
        this.audioElements.set(id, audioData);
      }

      // 3️⃣ Restore playback position
      if (audio.paused) {
        // Giữ nguyên currentTime (đã dừng giữa chừng)
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log(`Resumed audio ${id} at ${audio.currentTime.toFixed(2)}s`);
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to resume audio ${id}:`, error);
      return false;
    }
  }

  /**
   * Check if a specific audio is currently paused
   * @param {string} id - Audio ID
   * @returns {boolean|null} - Paused status or null if not found
   */
  isAudioPaused(id) {
    const audioData = this.audioElements.get(id);
    if (!audioData) {
      return null;
    }
    return audioData.audio.paused;
  }

  /**
   * Toggle loop state for a specific audio
   * @param {string} id - Audio ID
   * @returns {boolean} - New loop state
   */
  toggleLoop(id) {
    const audioData = this.audioElements.get(id);
    if (!audioData) {
      console.warn(`Audio with ID ${id} not found`);
      return false;
    }

    const newLoopState = !audioData.audio.loop;
    this.setLoop(id, newLoopState);
    return newLoopState;
  }

  /**
   * Get loop state for a specific audio
   * @param {string} id - Audio ID
   * @returns {boolean|null} - Loop state or null if audio not found
   */
  getLoop(id) {
    const audioData = this.audioElements.get(id);
    if (!audioData) {
      console.warn(`Audio with ID ${id} not found`);
      return null;
    }
    return audioData.audio.loop;
  }

  /**
   * Set loop state for all currently playing audio
   * @param {boolean} loop - Whether to loop all audio
   */
  setLoopAll(loop) {
    let count = 0;
    this.audioElements.forEach((audioData, id) => {
      this.setLoop(id, loop);
      count++;
    });
    console.log(`Set loop to ${loop} for ${count} audio streams`);
    return count;
  }

  /**
   * Set master volume for all audio
   * @param {number} volume - Master volume level (0-1)
   * @param {number} duration - Fade duration in ms (optional)
   */
  setMasterVolume(volume, duration = 0) {

    if (!this.isInitialized) return;
    if (volume > 0) {
      this.config.masterVolume = volume;
    }

    if (duration > 0) {
      // Smooth master volume transition
      const currentTime = this.audioContext.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(currentTime);
      this.masterGainNode.gain.linearRampToValueAtTime(volume, currentTime + duration / 1000);
    } else {
      this.masterGainNode.gain.value = volume;
    }
  }

  /**
   * Auto-adjust volumes when multiple audio files are playing
   */
  autoAdjustVolumes() {
    const audioCount = this.audioElements.size;
    if (audioCount <= 1) return;

    // Calculate volume reduction factor
    const reductionFactor = Math.max(0.2, 1 / Math.sqrt(audioCount));
    
    this.audioElements.forEach((audioData, id) => {
      const adjustedVolume = audioData.volume * reductionFactor;
      audioData.gainNode.gain.value = adjustedVolume;
    });

    console.log(`Auto-adjusted volumes for ${audioCount} audio streams (factor: ${reductionFactor.toFixed(2)})`);
  }

  /**
   * Fade in audio
   * @param {string} id - Audio ID
   * @param {number} targetVolume - Target volume
   * @param {number} duration - Fade duration in ms
   */
  fadeIn(id, targetVolume, duration) {
    this.fadeToVolume(id, targetVolume, duration);
  }

  /**
   * Fade out audio
   * @param {string} id - Audio ID
   * @param {number} duration - Fade duration in ms
   */
  fadeOut(id, duration) {
    return this.fadeToVolume(id, 0, duration);
  }

  /**
   * Fade to specific volume
   * @param {string} id - Audio ID
   * @param {number} targetVolume - Target volume
   * @param {number} duration - Fade duration in ms
   */
  fadeToVolume(id, targetVolume, duration) {
    return new Promise((resolve) => {
      const audioData = this.audioElements.get(id);
      if (!audioData) {
        resolve();
        return;
      }

      const { gainNode } = audioData;
      const currentTime = this.audioContext.currentTime;
      
      gainNode.gain.cancelScheduledValues(currentTime);
      gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration / 1000);
      
      setTimeout(resolve, duration);
    });
  }

  /**
   * Remove oldest non-background audio to make room for new audio
   */
  removeOldestNonBackgroundAudio() {
    for (const [id, audioData] of this.audioElements) {
      if (!audioData.isBackground) {
        this.stopAudio(id);
        break;
      }
    }
  }

  /**
   * Get currently playing audio information
   */
  getPlayingAudio() {
    const playingAudio = [];
    this.audioElements.forEach((audioData, id) => {
      playingAudio.push({
        id,
        url: audioData.url,
        volume: audioData.volume,
        currentVolume: audioData.gainNode.gain.value,
        isBackground: audioData.isBackground,
        loop: audioData.loop,
        currentTime: audioData.audio.currentTime,
        duration: audioData.audio.duration
      });
    });
    return playingAudio;
  }

  /**
   * Check if audio context is suspended and resume if needed
   * Enhanced for iOS compatibility
   */
  async resumeAudioContext() {
    if (!this.audioContext) {
      console.warn('No audio context to resume');
      return false;
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log(`Audio context resumed (iOS: ${this.isIOS})`);
        
        // For iOS, mark that user has interacted
        if (this.isIOS) {
          this.userInteracted = true;
        }
        
        return true;
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        return false;
      }
    }
    
    try {
      if (this.masterGainNode && this.masterGainNode.numberOfOutputs === 0) {
        console.log("🔄 Reconnecting masterGainNode to destination");
        this.masterGainNode.connect(this.audioContext.destination);
      }
    } catch (e) {
      console.warn("Reconnect masterGainNode failed:", e);
    }
    return true; // Already running
  }

  /**
   * Dispose of the sound controller and clean up resources
   */
  dispose() {
    this.stopAllAudio();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.audioElements.clear();
    this.gainNodes.clear();
    this.isInitialized = false;
    
    console.log('SoundController disposed');
  }

  /**
   * Debug method for iPhone 12 Pro Max testing
   * Call from browser console: window.debugAudio()
   */
  debugAudioStatus() {
    const status = {
      isIOS: this.isIOS,
      iosVersion: this.iosVersion,
      isModernIOS: this.isModernIOS,
      isStrictAudioPolicy: this.isStrictAudioPolicy,
      userInteracted: this.userInteracted,
      audioContextState: this.audioContext?.state,
      audioElementsCount: this.audioElements.size,
      backgroundAudioActive: this.audioElements.has('background_audio')
    };
    
    console.log('🎵 iPhone 12 Pro Max Audio Debug Status:', status);
    
    // Test audio unlock
    this.verifyIOSAudioUnlock().then(unlocked => {
      console.log('🔓 Audio Unlock Status:', unlocked);
    });
    
    return status;
  }
  
  /**
   * Force audio unlock for iPhone 12 Pro Max (call from console)
   */
  async forceAudioUnlock() {
    console.log('🔥 Forcing audio unlock for iPhone 12 Pro Max...');
    
    // Simulate user interaction
    this.userInteracted = true;
    
    // Try to resume audio context
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('✅ AudioContext resumed');
    }
    
    // Try to play test audio
    try {
      const testAudio = new Audio('/audio/background_loop.mp3');
      testAudio.volume = 0.1;
      await testAudio.play();
      testAudio.pause();
      console.log('✅ Test audio played successfully');
      return true;
    } catch (error) {
      console.error('❌ Test audio failed:', error);
      return false;
    }
  }
}

export default SoundController;