import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundFX } from './SoundFX';
import { Volume2, VolumeX, RotateCcw, Terminal } from 'lucide-react';

export type Portfolio3DTheme = 'cyberpunk' | 'matrix' | 'sunset' | 'violet';

interface ThreeDKeyboardProps {
  currentTheme: Portfolio3DTheme;
  onThemeChange: (theme: Portfolio3DTheme) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const THEME_PALETTES: Record<Portfolio3DTheme, {
  name: string;
  primary: number;
  secondary: number;
  underglow: number;
  accentHex: string;
  bgRgb: string;
}> = {
  cyberpunk: {
    name: 'Cyberpunk Neon',
    primary: 0x00f0ff,
    secondary: 0xff007f,
    underglow: 0x00d4ff,
    accentHex: '#00f0ff',
    bgRgb: '0, 240, 255',
  },
  matrix: {
    name: 'Matrix Emerald',
    primary: 0x10b981,
    secondary: 0xa6e3a1,
    underglow: 0x059669,
    accentHex: '#10b981',
    bgRgb: '16, 185, 129',
  },
  sunset: {
    name: 'Sunset Amber',
    primary: 0xf59e0b,
    secondary: 0xf43f5e,
    underglow: 0xd97706,
    accentHex: '#f59e0b',
    bgRgb: '245, 158, 11',
  },
  violet: {
    name: 'Deep Violet',
    primary: 0x8b5cf6,
    secondary: 0x3b82f6,
    underglow: 0x7c3aed,
    accentHex: '#8b5cf6',
    bgRgb: '139, 92, 246',
  },
};

// Keyboard Layout definition (60% layout with custom accent keys)
interface KeyDef {
  code: string;
  label: string;
  width: number;
  row: number;
  isAccent?: boolean;
  isModifier?: boolean;
}

const KEYBOARD_ROWS: KeyDef[][] = [
  // Row 0
  [
    { code: 'Escape', label: 'ESC', width: 1.0, row: 0, isAccent: true },
    { code: 'Digit1', label: '1', width: 1.0, row: 0 },
    { code: 'Digit2', label: '2', width: 1.0, row: 0 },
    { code: 'Digit3', label: '3', width: 1.0, row: 0 },
    { code: 'Digit4', label: '4', width: 1.0, row: 0 },
    { code: 'Digit5', label: '5', width: 1.0, row: 0 },
    { code: 'Digit6', label: '6', width: 1.0, row: 0 },
    { code: 'Digit7', label: '7', width: 1.0, row: 0 },
    { code: 'Digit8', label: '8', width: 1.0, row: 0 },
    { code: 'Digit9', label: '9', width: 1.0, row: 0 },
    { code: 'Digit0', label: '0', width: 1.0, row: 0 },
    { code: 'Minus', label: '-', width: 1.0, row: 0 },
    { code: 'Equal', label: '=', width: 1.0, row: 0 },
    { code: 'Backspace', label: 'BKSP', width: 1.8, row: 0, isModifier: true },
  ],
  // Row 1
  [
    { code: 'Tab', label: 'TAB', width: 1.4, row: 1, isModifier: true },
    { code: 'KeyQ', label: 'Q', width: 1.0, row: 1 },
    { code: 'KeyW', label: 'W', width: 1.0, row: 1 },
    { code: 'KeyE', label: 'E', width: 1.0, row: 1 },
    { code: 'KeyR', label: 'R', width: 1.0, row: 1 },
    { code: 'KeyT', label: 'T', width: 1.0, row: 1 },
    { code: 'KeyY', label: 'Y', width: 1.0, row: 1 },
    { code: 'KeyU', label: 'U', width: 1.0, row: 1 },
    { code: 'KeyI', label: 'I', width: 1.0, row: 1 },
    { code: 'KeyO', label: 'O', width: 1.0, row: 1 },
    { code: 'KeyP', label: 'P', width: 1.0, row: 1 },
    { code: 'BracketLeft', label: '[', width: 1.0, row: 1 },
    { code: 'BracketRight', label: ']', width: 1.0, row: 1 },
    { code: 'Backslash', label: '\\', width: 1.4, row: 1 },
  ],
  // Row 2
  [
    { code: 'CapsLock', label: 'CAPS', width: 1.7, row: 2, isModifier: true },
    { code: 'KeyA', label: 'A', width: 1.0, row: 2 },
    { code: 'KeyS', label: 'S', width: 1.0, row: 2 },
    { code: 'KeyD', label: 'D', width: 1.0, row: 2 },
    { code: 'KeyF', label: 'F', width: 1.0, row: 2 },
    { code: 'KeyG', label: 'G', width: 1.0, row: 2 },
    { code: 'KeyH', label: 'H', width: 1.0, row: 2 },
    { code: 'KeyJ', label: 'J', width: 1.0, row: 2 },
    { code: 'KeyK', label: 'K', width: 1.0, row: 2 },
    { code: 'KeyL', label: 'L', width: 1.0, row: 2 },
    { code: 'Semicolon', label: ';', width: 1.0, row: 2 },
    { code: 'Quote', label: '\'', width: 1.0, row: 2 },
    { code: 'Enter', label: 'ENTER', width: 2.1, row: 2, isAccent: true },
  ],
  // Row 3
  [
    { code: 'ShiftLeft', label: 'SHIFT', width: 2.1, row: 3, isModifier: true },
    { code: 'KeyZ', label: 'Z', width: 1.0, row: 3 },
    { code: 'KeyX', label: 'X', width: 1.0, row: 3 },
    { code: 'KeyC', label: 'C', width: 1.0, row: 3 },
    { code: 'KeyV', label: 'V', width: 1.0, row: 3 },
    { code: 'KeyB', label: 'B', width: 1.0, row: 3 },
    { code: 'KeyN', label: 'N', width: 1.0, row: 3 },
    { code: 'KeyM', label: 'M', width: 1.0, row: 3 },
    { code: 'Comma', label: ',', width: 1.0, row: 3 },
    { code: 'Period', label: '.', width: 1.0, row: 3 },
    { code: 'Slash', label: '/', width: 1.0, row: 3 },
    { code: 'ShiftRight', label: 'SHIFT', width: 2.7, row: 3, isModifier: true },
  ],
  // Row 4
  [
    { code: 'ControlLeft', label: 'CTRL', width: 1.25, row: 4, isModifier: true },
    { code: 'MetaLeft', label: 'WIN', width: 1.25, row: 4, isModifier: true },
    { code: 'AltLeft', label: 'ALT', width: 1.25, row: 4, isModifier: true },
    { code: 'Space', label: 'PRAKASH CHOUDHARY', width: 5.75, row: 4, isAccent: true },
    { code: 'AltRight', label: 'ALT', width: 1.25, row: 4, isModifier: true },
    { code: 'ContextMenu', label: 'FN', width: 1.25, row: 4, isModifier: true },
    { code: 'ControlRight', label: 'CTRL', width: 1.8, row: 4, isModifier: true },
  ],
];

// Helper to create razor-sharp procedural keycap textures with labels
function createKeycapTexture(label: string, isAccent: boolean, isModifier: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  if (isAccent) {
    grad.addColorStop(0, '#1a2836');
    grad.addColorStop(1, '#0e1824');
  } else if (isModifier) {
    grad.addColorStop(0, '#24273a');
    grad.addColorStop(1, '#181926');
  } else {
    grad.addColorStop(0, '#2d3149');
    grad.addColorStop(1, '#1e2030');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  // Subtle bevel border
  ctx.strokeStyle = isAccent ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 120, 120);

  // Key Label text
  ctx.fillStyle = isAccent ? '#ffffff' : '#cdd6f4';
  const fontSize = label.length > 8 ? 14 : label.length > 4 ? 20 : 28;
  ctx.font = `bold ${fontSize}px "JetBrains Mono", Consolas, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const ThreeDKeyboard: React.FC<ThreeDKeyboardProps> = ({
  currentTheme,
  onThemeChange,
  soundEnabled,
  onToggleSound,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [typedBuffer, setTypedBuffer] = useState<string>('PRESS ANY KEY');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const keyMeshMapRef = useRef<Map<string, {
    mesh: THREE.Mesh;
    baseY: number;
    currentY: number;
    targetY: number;
    mat: THREE.MeshStandardMaterial;
    accentColor: number;
  }>>(new Map());

  // Function to press a keycap down and trigger sound
  const triggerKeyPress = useCallback((code: string, label?: string) => {
    const keyData = keyMeshMapRef.current.get(code) || keyMeshMapRef.current.get(code.toUpperCase());
    if (keyData) {
      keyData.targetY = keyData.baseY - 0.14;
      keyData.mat.emissive.setHex(THEME_PALETTES[currentTheme].primary);
      keyData.mat.emissiveIntensity = 1.6;
    }

    soundFX.playKeyClick();

    const displayLabel = label || code.replace(/Key|Digit/, '');
    if (displayLabel.length <= 4) {
      setTypedBuffer(prev => {
        const next = (prev === 'PRESS ANY KEY' ? '' : prev) + displayLabel;
        return next.slice(-20);
      });
    }
  }, [currentTheme]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as per Skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.045);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 6.2, 7.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Environment map via RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.08; // Prevent going completely below floor
    controls.minDistance = 3.5;
    controls.maxDistance = 14;
    controls.target.set(0, 0.2, 0);

    // Lighting rig
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x4f8ef7, 0x111122, 1.2);
    scene.add(fillLight);

    // Dynamic Under-glow PointLight
    const themeInfo = THEME_PALETTES[currentTheme];
    const underglowLight = new THREE.PointLight(themeInfo.primary, 4.0, 10);
    underglowLight.position.set(0, 0.1, 0);
    scene.add(underglowLight);

    // Keyboard Group container
    const keyboardGroup = new THREE.Group();
    scene.add(keyboardGroup);

    // ── Build Keyboard Case & Chassis (3-12 parts) ───────────────────────────
    const unitScale = 0.55;
    const chassisWidth = 15.6 * unitScale;
    const chassisDepth = 6.2 * unitScale;
    const chassisHeight = 0.5 * unitScale;

    // 1. Bottom Aluminum Beveled Base
    const baseGeo = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisDepth);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x181a26,
      metalness: 0.88,
      roughness: 0.22,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = chassisHeight / 2;
    baseMesh.castShadow = !isSoftwareGl;
    baseMesh.receiveShadow = !isSoftwareGl;
    keyboardGroup.add(baseMesh);

    // 2. Acrylic RGB Diffuser Ring around chassis base
    const ringGeo = new THREE.BoxGeometry(chassisWidth + 0.14, 0.08, chassisDepth + 0.14);
    const ringMat = new THREE.MeshStandardMaterial({
      color: themeInfo.underglow,
      emissive: themeInfo.underglow,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.04;
    keyboardGroup.add(ringMesh);

    // 3. Top Switch Mounting Plate
    const plateGeo = new THREE.BoxGeometry(chassisWidth - 0.2, 0.06, chassisDepth - 0.2);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0f111a,
      metalness: 0.95,
      roughness: 0.15,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = chassisHeight + 0.03;
    keyboardGroup.add(plateMesh);

    // 4. Contact shadow plane
    const shadowGeo = new THREE.PlaneGeometry(chassisWidth * 1.5, chassisDepth * 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.005;
    scene.add(shadowMesh);

    // 5. Subtle Floating Cyber Particles
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 25;
      starPos[i * 3 + 1] = Math.random() * 12;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: themeInfo.primary,
      size: 0.06,
      transparent: true,
      opacity: 0.65,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ── Build Keycaps Grid ───────────────────────────────────────────────────
    const keyHeight = 0.28 * unitScale;
    const keySpacing = 1.02 * unitScale;
    const totalRowWidth = 14.8 * unitScale;
    const startZ = -(2 * keySpacing);

    keyMeshMapRef.current.clear();

    KEYBOARD_ROWS.forEach((row, rowIdx) => {
      let currentX = -totalRowWidth / 2;

      row.forEach(k => {
        const keyW = k.width * unitScale * 0.94;
        const keyD = 0.92 * unitScale;
        const kGeo = new THREE.BoxGeometry(keyW, keyHeight, keyD);

        const tex = createKeycapTexture(k.label, !!k.isAccent, !!k.isModifier);
        const kMat = new THREE.MeshStandardMaterial({
          color: k.isAccent ? themeInfo.primary : k.isModifier ? 0x1f2335 : 0x24283b,
          metalness: k.isAccent ? 0.35 : 0.6,
          roughness: 0.32,
          map: tex,
          emissive: k.isAccent ? themeInfo.primary : 0x000000,
          emissiveIntensity: k.isAccent ? 0.25 : 0.0,
        });

        const keyMesh = new THREE.Mesh(kGeo, kMat);
        const kX = currentX + (k.width * unitScale) / 2;
        const kY = chassisHeight + keyHeight / 2 + 0.05;
        const kZ = startZ + rowIdx * keySpacing;

        keyMesh.position.set(kX, kY, kZ);
        keyMesh.castShadow = !isSoftwareGl;
        keyMesh.receiveShadow = !isSoftwareGl;

        // Custom properties for raycasting & animation
        keyMesh.userData = {
          code: k.code,
          label: k.label,
          baseY: kY,
          isAccent: k.isAccent,
        };

        keyboardGroup.add(keyMesh);

        keyMeshMapRef.current.set(k.code, {
          mesh: keyMesh,
          baseY: kY,
          currentY: kY,
          targetY: kY,
          mat: kMat,
          accentColor: k.isAccent ? themeInfo.primary : 0x00f0ff,
        });

        // Also index by simple letter/digit
        const cleanLetter = k.label.toUpperCase();
        if (cleanLetter && !keyMeshMapRef.current.has(cleanLetter)) {
          keyMeshMapRef.current.set(cleanLetter, keyMeshMapRef.current.get(k.code)!);
        }

        currentX += k.width * unitScale;
      });
    });

    // Angle keyboard slightly towards user for ergonomic 3D look
    keyboardGroup.rotation.x = 0.12;

    // ── Mouse Raycasting for Interactive Key Clicking ─────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(keyboardGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.code) {
          triggerKeyPress(hit.userData.code, hit.userData.label);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // ── Window Resize ────────────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Physical Keyboard Typing Listener ────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input/textarea
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      triggerKeyPress(e.code, e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKeyDown);

    // ── Render / Animation Loop ──────────────────────────────────────────────
    let animId = 0;
    const clock = new THREE.Clock();

    const renderTick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Idle floating auto-rotation
      if (autoRotate) {
        keyboardGroup.rotation.y = Math.sin(time * 0.4) * 0.08;
      }

      // Shimmer star field
      starField.rotation.y = time * 0.02;

      // Animate spring physics for keycap presses & emissive decay
      keyMeshMapRef.current.forEach(item => {
        // Return key smoothly to resting position
        item.targetY = THREE.MathUtils.damp(item.targetY, item.baseY, 12, delta);
        item.currentY = THREE.MathUtils.damp(item.currentY, item.targetY, 18, delta);
        item.mesh.position.y = item.currentY;

        // Fade emissive glow back down
        if (item.mat.emissiveIntensity > 0.05) {
          const restingIntensity = item.mesh.userData.isAccent ? 0.3 : 0.0;
          item.mat.emissiveIntensity = THREE.MathUtils.damp(
            item.mat.emissiveIntensity,
            restingIntensity,
            6,
            delta
          );
        }
      });

      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderTick);
    };

    renderTick();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);

      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [currentTheme, triggerKeyPress, autoRotate]);

  return (
    <div className="relative w-full h-[460px] md:h-[540px] rounded-3xl overflow-hidden border border-white/10 bg-[#060814] shadow-2xl flex flex-col group">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top Overlay: 3D Station HUD & Interactive Indicator */}
      <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-[#090d1e]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg pointer-events-auto">
          <div
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: THEME_PALETTES[currentTheme].accentHex }}
          />
          <span className="text-xs font-bold text-white tracking-wide">
            3D Interactive Dev Station
          </span>
          <span className="text-[10px] text-[#89b4fa] font-mono px-2 py-0.5 rounded-md bg-[#89b4fa]/15 border border-[#89b4fa]/20">
            Click / Type
          </span>
        </div>

        {/* Live typing command buffer */}
        <div className="flex items-center gap-2 bg-[#090d1e]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg pointer-events-auto">
          <Terminal size={12} className="text-[#a6e3a1]" />
          <span className="text-xs font-mono text-[#a6e3a1] font-semibold">
            {typedBuffer}
          </span>
        </div>
      </div>

      {/* Bottom Floating Control Dock (Following Three.js Skill Directives) */}
      <div className="mt-auto relative z-10 p-4 flex items-center justify-between pointer-events-none gap-3 flex-wrap">
        {/* Preset quick actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#090d1e]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6c7086] px-2">
            Quick Type:
          </span>
          {['KAFKA', 'NODE', 'AI', 'DEV'].map(word => (
            <button
              key={word}
              onClick={() => {
                word.split('').forEach((ch, idx) => {
                  setTimeout(() => triggerKeyPress(ch), idx * 90);
                });
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-[#cdd6f4] hover:text-white bg-[#181a2f] hover:bg-[#252848] transition-all hover:scale-105 active:scale-95"
            >
              {word}
            </button>
          ))}
        </div>

        {/* 3D Theme & Audio Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#090d1e]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
          {/* Sound FX Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundFX.enabled = !soundEnabled;
            }}
            title={soundEnabled ? 'Mute Mechanical Switch Clicks' : 'Enable Mechanical Switch Clicks'}
            className={`p-2 rounded-xl transition-all ${
              soundEnabled
                ? 'bg-[#89b4fa]/20 text-[#89b4fa] border border-[#89b4fa]/30'
                : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#181a2f]'
            }`}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause 3D Auto-Rotate' : 'Enable 3D Auto-Rotate'}
            className={`p-2 rounded-xl transition-all ${
              autoRotate
                ? 'bg-[#cba6f7]/20 text-[#cba6f7] border border-[#cba6f7]/30'
                : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#181a2f]'
            }`}
          >
            <RotateCcw size={14} className={autoRotate ? 'animate-spin-slow' : ''} />
          </button>

          {/* Theme Palette Switcher */}
          <div className="flex items-center gap-1 pl-1 border-l border-white/10">
            {(['cyberpunk', 'matrix', 'sunset', 'violet'] as Portfolio3DTheme[]).map(th => {
              const info = THEME_PALETTES[th];
              const isSelected = currentTheme === th;
              return (
                <button
                  key={th}
                  onClick={() => onThemeChange(th)}
                  title={`Switch to ${info.name}`}
                  className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: info.accentHex }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
