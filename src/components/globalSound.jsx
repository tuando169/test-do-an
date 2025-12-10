import SoundController from '../apps/editor/SoundController';

if (!window.soundController) {
  window.soundController = new SoundController({
    masterVolume: 0.6,
    backgroundVolume: 0.4,
    autoPlayBackground: false,
    fadeInDuration: 2000,
    fadeOutDuration: 1000
  });
}

export default window.soundController;
