// Xbox 360 NXE 3D Scene using Three.js
// Implements the full 3D "Twist" navigation and reflective floor layout

import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// Camera setup (Perspective as per spec: FOV 45, position [0, 0, 10])
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.5, 8);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// ===== LIGHTING SETUP =====
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(2, 3, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Green accent glow light
const greenLight = new THREE.PointLight(0x107c10, 0.4);
greenLight.position.set(-4, 0, 2);
scene.add(greenLight);

// ===== REFLECTIVE FLOOR =====
// Floor positioned at Y = -2.2 as per spec
const floorGeometry = new THREE.PlaneGeometry(20, 15);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  metalness: 0.7,
  roughness: 0.2,
  side: THREE.DoubleSide
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.2;
floor.receiveShadow = true;
scene.add(floor);

// ===== DYNAMIC BACKGROUND BOKEH PARTICLES =====
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 20;
const positions = new Float32Array(particleCount * 3);
const scales = new Float32Array(particleCount);
const velocities = [];

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 15;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
  positions[i * 3 + 2] = -10 - Math.random() * 5;
  
  scales[i] = 0.5 + Math.random() * 1.5;
  velocities.push({
    x: (Math.random() - 0.5) * 0.02,
    y: 0.01 + Math.random() * 0.03,
    z: 0
  });
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.5,
  color: 0x107c10,
  transparent: true,
  opacity: 0.1,
  sizeAttenuation: true
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// ===== COLOR PALETTE (From NXE Spec) =====
const COLORS = {
  PRIMARY_GREEN: 0x107c10,
  GRADIENT_TOP: 0x1e3c1e,
  GRADIENT_MID: 0x0d1f0d,
  GRADIENT_BASE: 0x050a05,
  TEXT_WHITE: 0xffffff,
  CARD_GLOSS: [1, 1, 1, 0.15],
  CARD_SHADOW: [0, 0, 0, 0.4]
};

// ===== CARD CREATION =====
const cardMeshes = [];
const cardData = [];

function createCard(index, title = `Card ${index}`) {
  // Use BoxGeometry for simplicity, apply rounded corners via material
  const cardGeometry = new THREE.BoxGeometry(3.5, 2.0, 0.2);
  
  // Base gradient material (simulating the dark color gradient)
  const cardMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.GRADIENT_MID,
    metalness: 0.3,
    roughness: 0.4,
    side: THREE.FrontSide
  });
  
  const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
  cardMesh.castShadow = true;
  cardMesh.receiveShadow = true;
  
  // Apply border-radius-like effect via CSS shaders is not possible in WebGL
  // Instead, we'll rely on the mesh's appearance and focus on the 3D transformation
  
  cardMeshes.push(cardMesh);
  cardData.push({
    index,
    title,
    mesh: cardMesh,
    targetPos: new THREE.Vector3(),
    targetRot: new THREE.Quaternion(),
    baseScale: new THREE.Vector3(1, 1, 1)
  });
  
  scene.add(cardMesh);
  return cardData[cardData.length - 1];
}

// Create initial cards
for (let i = 0; i < 8; i++) {
  createCard(i, `Channel ${i}`);
}

// ===== THE "TWIST" NAVIGATION ALGORITHM =====
let currentCardIndex = 0;

function updateCardTransforms() {
  cardData.forEach((card, idx) => {
    const relativeIndex = idx - currentCardIndex;
    
    if (relativeIndex === 0) {
      // Active card: centered, front, full size
      card.targetPos.set(0, 0, 0);
      card.targetRot.setFromEuler(new THREE.Euler(0, 0, 0));
      card.baseScale.set(1, 1, 1);
    } else if (relativeIndex > 0) {
      // Cards to the right: perspective transformation
      const i = relativeIndex;
      card.targetPos.x = 1.8 + (i * 1.1);
      card.targetPos.y = 0.1 * i;
      card.targetPos.z = -1.2 * i;
      
      const rotY = -40 * (Math.PI / 180); // Convert to radians
      card.targetRot.setFromEuler(new THREE.Euler(0, rotY, 0));
      
      const scale = Math.pow(0.85, i);
      card.baseScale.set(scale, scale, scale);
    } else {
      // Cards to the left: hidden off-screen
      card.targetPos.set(-10, 0, 0);
      card.targetRot.setFromEuler(new THREE.Euler(0, 0, 0));
      card.baseScale.set(0.1, 0.1, 0.1);
    }
  });
}

updateCardTransforms();

function applyCardTransforms() {
  cardData.forEach((card) => {
    card.mesh.position.copy(card.targetPos);
    card.mesh.quaternion.copy(card.targetRot);
    card.mesh.scale.copy(card.baseScale);
  });
}

applyCardTransforms();

// ===== EASING FUNCTIONS (As per spec) =====
function easeQuinticOut(t) {
  // cubic-bezier(0.25, 1.0, 0.33, 1.0)
  return 1 - Math.pow(1 - t, 5);
}

function easeCardScroll(t) {
  return easeQuinticOut(t);
}

// ===== ANIMATION LOOP & SMOOTH INTERPOLATION =====
const CARD_TRANSITION_DURATION = 0.35; // 350ms
let isAnimating = false;
let animationStartTime = 0;

function animate() {
  requestAnimationFrame(animate);
  
  // Update particle bokeh
  const positions = particlesGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] += velocities[i].x;
    positions[i * 3 + 1] += velocities[i].y;
    
    // Wrap around
    if (positions[i * 3] > 10) positions[i * 3] = -10;
    if (positions[i * 3 + 1] > 6) positions[i * 3 + 1] = -6;
  }
  particlesGeometry.attributes.position.needsUpdate = true;
  
  // Pulsate particle opacity
  const pulseOpacity = 0.08 + Math.sin(Date.now() * 0.001) * 0.05;
  particlesMaterial.opacity = pulseOpacity;
  
  // Smooth card interpolation during transitions
  if (isAnimating) {
    const elapsed = (Date.now() - animationStartTime) / 1000;
    const progress = Math.min(elapsed / CARD_TRANSITION_DURATION, 1);
    const eased = easeCardScroll(progress);
    
    cardData.forEach((card) => {
      card.mesh.position.lerp(card.targetPos, eased);
      card.mesh.quaternion.slerp(card.targetRot, eased);
      card.mesh.scale.lerp(card.baseScale, eased);
    });
    
    if (progress >= 1) {
      isAnimating = false;
    }
  }
  
  renderer.render(scene, camera);
}

function navigateCards(delta) {
  if (isAnimating) return false;

  const nextIndex = Math.max(0, Math.min(currentCardIndex + delta, cardData.length - 1));
  if (nextIndex === currentCardIndex) return false;

  currentCardIndex = nextIndex;
  updateCardTransforms();
  isAnimating = true;
  animationStartTime = Date.now();

  return true;
}

function getCurrentCard() {
  return cardData[currentCardIndex];
}

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== PUBLIC API FOR EXTERNAL CONTROL =====
export {
  scene,
  camera,
  renderer,
  cardData,
  currentCardIndex,
  updateCardTransforms,
  navigateCards,
  getCurrentCard,
  particles,
  floor
};

// Expose to global window for external UI control
window.nxeScene = {
  scene,
  camera,
  renderer,
  cardData,
  updateCardTransforms,
  navigate: navigateCards,
  getCurrentCard,
  particles,
  floor,
  CARD_TRANSITION_DURATION,
  get currentCardIndex() {
    return currentCardIndex;
  },
  get isAnimating() {
    return isAnimating;
  },
  get animationStartTime() {
    return animationStartTime;
  }
};

// Start animation loop
animate();
