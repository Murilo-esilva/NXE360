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

  let currentCardIndex = 0;

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
      if (currentCardIndex > 0) {
        currentCardIndex--;
        scene3D.currentCardIndex = currentCardIndex;
        scene3D.updateCardTransforms();
        scene3D.isAnimating = true;
        scene3D.animationStartTime = Date.now();
        play('left');
        ev.preventDefault();
      }
    } else if (k === 'ArrowRight') {
      if (currentCardIndex < scene3D.cardData.length - 1) {
        currentCardIndex++;
        scene3D.currentCardIndex = currentCardIndex;
        scene3D.updateCardTransforms();
        scene3D.isAnimating = true;
        scene3D.animationStartTime = Date.now();
        play('right');
        ev.preventDefault();
      }
    } else if (k === 'Enter' || k === ' ') {
      play('select');
      console.log('Selected card', currentCardIndex, scene3D.cardData[currentCardIndex].title);
      ev.preventDefault();
    } else if (k === 'Escape') {
      play('back');
      console.log('Back pressed');
      ev.preventDefault();
    }
  });

  console.log('NXE UI Controller initialized');

})();
