// UI Navigation Controller for NXE 3D Scene
// This module handles keyboard input, audio, and integration with the 3D renderer

(async function() {
  // Wait for the 3D scene to load
  const waitForScene = () => {
    return new Promise((resolve) => {
      const checkScene = () => {
        if (window.nxeScene && window.nxeScene.cardData) {
          resolve(window.nxeScene);
        } else {
          setTimeout(checkScene, 100);
        }
      };
      checkScene();
    });
  };

  const scene3D = await waitForScene();

  const sounds = {
    focus: document.getElementById('snd-focus'),
    select: document.getElementById('snd-select'),
    back: document.getElementById('snd-back'),
    left: document.getElementById('snd-panel-left'),
    right: document.getElementById('snd-panel-right')
  };

  function play(name) {
    try {
      const a = sounds[name];
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
    } catch (e) {}
  }

  document.addEventListener('keydown', (ev) => {
    const k = ev.key;

    if (k === 'ArrowLeft') {
      if (scene3D.navigate(-1)) {
        play('left');
        ev.preventDefault();
      }
    } else if (k === 'ArrowRight') {
      if (scene3D.navigate(1)) {
        play('right');
        ev.preventDefault();
      }
    } else if (k === 'Enter' || k === ' ') {
      const selectedCard = scene3D.getCurrentCard();
      play('select');
      console.log('Selected card', selectedCard.index, selectedCard.title);
      ev.preventDefault();
    } else if (k === 'Escape') {
      play('back');
      console.log('Back pressed');
      ev.preventDefault();
    }
  });

  console.log('NXE UI Controller initialized');

})();
