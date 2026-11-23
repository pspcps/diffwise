import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Code2,
  MessageCircle,
  RotateCcw,
  RotateCw,
  Pause,
  Play,
} from "lucide-react";
import * as THREE from "three";
import { useMotion } from "../Motion/MotionContext";
import { useLanguageTheme } from "../Guide/LanguageThemeContext";
import { LANGUAGE_THEMES } from "../Portfolio/LanguageThemes";

export type DeskDestination = "projects" | "experience" | "contact";
// Original procedural scene. No models, textures or code from the reference portfolio.
export default function DeskScene({
  onExplore,
  mode = "portfolio",
}: {
  onExplore: (section: DeskDestination) => void;
  mode?: "portfolio" | "tools";
}) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<{
    rotate: (step: number) => void;
    reset: () => void;
  } | null>(null);
  const onExploreRef = useRef(onExplore);
  const motionRef = useRef(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  const { enabled } = useMotion();
  const { theme } = useLanguageTheme();
  useEffect(() => {
    onExploreRef.current = onExplore;
  }, [onExplore]);
  useEffect(() => {
    motionRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);
  function pauseRotation() {
    autoRotateRef.current = false;
    setAutoRotate(false);
  }
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const canvas = renderer.domElement;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Prakash’s 3D engineering desk: developer, monitors, laptop, notebook and plant. Use the labeled controls to explore.",
    );
    element.appendChild(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4.8, 4.8, 3.8, -3.8, 0.1, 80);
    camera.position.set(7, 6.2, 9);
    camera.lookAt(0, 1.65, 0);
    const desk = new THREE.Group();
    scene.add(desk);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    const targets: THREE.Object3D[] = [];
    const accentColor = LANGUAGE_THEMES[theme].primaryHex;
    function material(color: string, roughness = 0.7) {
      const m = new THREE.MeshStandardMaterial({ color, roughness });
      materials.add(m);
      return m;
    }
    const cream = material("#eee8d9"),
      wood = material("#c1a078"),
      navy = material("#263b49"),
      dark = material("#28333b"),
      skin = material("#e8b78d"),
      hair = material("#28302d"),
      accent = material(accentColor),
      paper = material("#fbf8ec"),
      pink = material("#dfa5a0"),
      leaf = material("#54916f"),
      clay = material("#d98762");
    function mesh(
      geometry: THREE.BufferGeometry,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = desk,
    ) {
      geometries.add(geometry);
      const item = new THREE.Mesh(geometry, mat);
      item.position.set(x, y, z);
      item.castShadow = true;
      item.receiveShadow = true;
      parent.add(item);
      return item;
    }
    function box(
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = desk,
    ) {
      return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
    }
    function ball(
      r: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = desk,
    ) {
      return mesh(new THREE.SphereGeometry(r, 24, 18), mat, x, y, z, parent);
    }
    function cylinder(
      top: number,
      bottom: number,
      height: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = desk,
    ) {
      return mesh(
        new THREE.CylinderGeometry(top, bottom, height, 28),
        mat,
        x,
        y,
        z,
        parent,
      );
    }
    function link(object: THREE.Object3D, destination: DeskDestination) {
      object.userData.destination = destination;
      targets.push(object);
    }
    function screenTexture(lines: string[], background: string) {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 320;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, 512, 320);
        ctx.fillStyle = "#81949e";
        ctx.font = "18px monospace";
        ctx.fillText(
          mode === "tools" ? "PSDEVTOOL / STUDIO" : "PRAKASH / WORKSPACE",
          30,
          38,
        );
        ctx.fillStyle = accentColor;
        ctx.fillRect(30, 60, 450, 2);
        ctx.font = "22px monospace";
        lines.forEach((line, i) => {
          ctx.fillStyle = i % 2 ? "#b5d1d0" : "#f3d38c";
          ctx.fillText(line, 30, 108 + i * 35);
        });
      }
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.add(texture);
      return texture;
    }
    function screenMaterial(texture: THREE.Texture) {
      const m = new THREE.MeshBasicMaterial({ map: texture });
      materials.add(m);
      return m;
    }
    // Rounded silhouettes are constructed from simple, low-poly original primitives.
    const platform = cylinder(3.75, 3.8, 0.16, material("#d5d6bf"), 0, 0.05, 0);
    platform.scale.z = 0.76;
    const rug = cylinder(2.8, 2.8, 0.025, material("#a8bca4"), 0, 0.15, 0.2);
    rug.scale.z = 0.68;
    box(5, 0.22, 2.4, cream, 0, 2, 0);
    for (const x of [-2.05, 2.05])
      for (const z of [-0.83, 0.83]) cylinder(0.1, 0.14, 1.8, wood, x, 1.04, z);
    box(1.1, 1.35, 1.5, cream, 1.65, 1.22, 0);
    for (const y of [0.88, 1.28, 1.67]) {
      box(0.98, 0.02, 0.01, wood, 1.65, y, 0.76);
      box(0.27, 0.04, 0.04, navy, 1.65, y + 0.15, 0.79);
    }
    const monitor = new THREE.Group();
    monitor.position.set(-0.6, 2.14, -0.53);
    desk.add(monitor);
    box(0.74, 0.07, 0.45, navy, 0, 0.02, 0, monitor);
    box(0.1, 0.43, 0.1, navy, 0, 0.23, -0.05, monitor);
    box(2.15, 1.32, 0.14, navy, 0, 1, -0.02, monitor);
    const monitorScreen = mesh(
      new THREE.PlaneGeometry(1.97, 1.13),
      screenMaterial(
        screenTexture(
          [
            "const build = {",
            "  frontend: 'React',",
            "  backend: 'Node.js',",
            "  intelligence: 'AI'",
            "};",
          ],
          "#16262d",
        ),
      ),
      0,
      1,
      0.06,
      monitor,
    );
    link(monitorScreen, "projects");
    const laptop = new THREE.Group();
    laptop.position.set(1, 2.18, 0.36);
    laptop.rotation.y = -0.25;
    desk.add(laptop);
    box(1.28, 0.07, 0.85, navy, 0, 0, 0, laptop);
    const lid = box(1.28, 0.83, 0.06, navy, 0, 0.44, -0.36, laptop);
    lid.rotation.x = -0.12;
    const laptopPanel = mesh(
      new THREE.PlaneGeometry(1.13, 0.68),
      screenMaterial(
        screenTexture(
          [LANGUAGE_THEMES[theme].shortName, "Build something useful."],
          "#273e4a",
        ),
      ),
      0,
      0.44,
      -0.318,
      laptop,
    );
    laptopPanel.rotation.x = -0.12;
    link(laptopPanel, "projects");
    const logoKey = theme === "golang" ? "go" : theme;
    const logoTexture = new THREE.TextureLoader().load(
      `/technology/${logoKey}.svg`,
    );
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    textures.add(logoTexture);
    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      color: "#f3d68f",
    });
    materials.add(logoMat);
    const logoTile = mesh(
      new THREE.PlaneGeometry(0.31, 0.31),
      paper,
      0.4,
      0.55,
      -0.299,
      laptop,
    );
    logoTile.rotation.x = -0.12;
    const logo = mesh(
      new THREE.PlaneGeometry(0.23, 0.23),
      logoMat,
      0.4,
      0.55,
      -0.29,
      laptop,
    );
    logo.rotation.x = -0.12;
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 10; col++)
        box(
          0.07,
          0.01,
          0.05,
          cream,
          -0.44 + col * 0.095,
          0.045,
          -0.21 + row * 0.09,
          laptop,
        );
    box(0.5, 0.035, 0.25, navy, -0.57, 2.14, 0.64);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 9; col++)
        box(
          0.035,
          0.015,
          0.025,
          paper,
          -0.75 + col * 0.045,
          2.163,
          0.56 + row * 0.06,
        );
    // Notebook and cup are scene navigation shortcuts, with HTML equivalents below.
    const notebook = box(0.58, 0.08, 0.7, clay, -1.65, 2.17, 0.39);
    notebook.rotation.y = 0.15;
    link(notebook, "experience");
    box(0.52, 0.025, 0.64, paper, -1.65, 2.22, 0.39);
    for (let i = 0; i < 5; i++)
      box(0.32, 0.006, 0.01, wood, -1.64, 2.237, 0.22 + i * 0.07);
    const cup = cylinder(0.17, 0.13, 0.34, paper, -1.9, 2.31, -0.43);
    link(cup, "contact");
    cylinder(0.139, 0.139, 0.012, dark, -1.9, 2.485, -0.43);
    const handle = mesh(
      new THREE.TorusGeometry(0.13, 0.035, 10, 24),
      paper,
      -2.06,
      2.33,
      -0.43,
    );
    handle.rotation.y = Math.PI / 2;
    // Desk lamp.
    cylinder(0.32, 0.32, 0.07, navy, 1.94, 2.18, -0.74);
    box(0.055, 1.4, 0.055, navy, 1.94, 2.86, -0.74);
    const arm = box(0.65, 0.055, 0.055, navy, 1.65, 3.53, -0.74);
    arm.rotation.z = -0.17;
    const shade = cylinder(0.16, 0.3, 0.28, clay, 1.32, 3.43, -0.74);
    shade.rotation.z = 0.2;
    // Seated developer with glasses and a gently waving hand.
    const developer = new THREE.Group();
    developer.position.set(-0.27, 0, 1.33);
    desk.add(developer);
    cylinder(0.6, 0.6, 0.12, navy, 0, 1.11, 0, developer);
    box(0.92, 1.16, 0.14, cream, 0, 1.49, 0.45, developer);
    cylinder(0.07, 0.07, 0.83, navy, 0, 0.64, 0, developer);
    for (let i = 0; i < 5; i++) {
      const leg = box(0.78, 0.06, 0.07, navy, 0, 0.24, 0, developer);
      leg.rotation.y = (i * Math.PI * 2) / 5;
      leg.position.x = Math.cos((i * Math.PI * 2) / 5) * 0.3;
      leg.position.z = Math.sin((i * Math.PI * 2) / 5) * 0.3;
    }
    // Rotate the person, not the chair: monitors are along negative Z.
    const seated = new THREE.Group();
    seated.rotation.y = Math.PI;
    developer.add(seated);
    const torso = ball(0.48, accent, 0, 1.72, 0, seated);
    torso.scale.set(1, 0.95, 0.65);
    cylinder(0.15, 0.15, 0.27, skin, 0, 2.14, -0.02, seated);
    const head = ball(0.39, skin, 0, 2.49, -0.03, seated);
    head.scale.set(0.92, 1.05, 0.9);
    const hairCap = ball(0.4, hair, 0, 2.67, -0.02, seated);
    hairCap.scale.set(0.95, 0.65, 0.92);
    ball(0.08, skin, -0.36, 2.48, -0.02, seated);
    ball(0.08, skin, 0.36, 2.48, -0.02, seated);
    // The body faces the screens; the independent chair back stays behind it.
    const specs = material("#213c40");
    for (const x of [-0.16, 0.16]) {
      const frame = mesh(
        new THREE.TorusGeometry(0.125, 0.023, 8, 24),
        specs,
        x,
        2.52,
        0.293,
        seated,
      );
      frame.scale.y = 0.82;
      ball(0.026, hair, x, 2.52, 0.327, seated);
    }
    box(0.08, 0.025, 0.025, specs, 0, 2.52, 0.31, seated);
    const smile = mesh(
      new THREE.TorusGeometry(0.09, 0.012, 6, 16, Math.PI),
      clay,
      0,
      2.35,
      0.32,
      seated,
    );
    smile.rotation.z = Math.PI;
    const leftArm = box(0.18, 0.52, 0.19, accent, 0.4, 1.96, 0.28, seated);
    leftArm.rotation.x = 1;
    ball(0.12, skin, 0.4, 2.13, 0.57, seated);
    const wave = new THREE.Group();
    wave.position.set(-0.44, 1.93, 0);
    seated.add(wave);
    const forearm = box(0.17, 0.5, 0.18, accent, 0.09, 0.21, 0, wave);
    forearm.rotation.z = -0.3;
    ball(0.125, skin, 0.16, 0.53, 0, wave);
    for (let i = 0; i < 4; i++)
      cylinder(0.026, 0.027, 0.17, skin, 0.08 + i * 0.05, 0.65, 0, wave);
    for (const x of [-0.22, 0.22]) {
      box(0.23, 0.5, 0.28, navy, x, 0.91, 0.08, seated);
      const shoe = ball(0.2, paper, x, 0.63, 0.28, seated);
      shoe.scale.set(0.7, 0.5, 1.3);
    }
    // Plant, books and a small server tower give this engineer’s desk its own identity.
    cylinder(0.34, 0.24, 0.58, cream, 2.65, 0.5, 0.8);
    cylinder(0.29, 0.29, 0.025, wood, 2.65, 0.8, 0.8);
    for (let i = 0; i < 7; i++) {
      const l = ball(
        0.22,
        leaf,
        2.65 + Math.cos(i) * 0.17,
        1.05 + (i % 3) * 0.13,
        0.8 + Math.sin(i) * 0.17,
      );
      l.scale.set(0.55, 2.4, 0.35);
      l.rotation.z = Math.sin(i) * 0.55;
      l.rotation.y = i;
    }
    box(0.63, 1.05, 0.55, navy, -2.55, 0.69, -0.3);
    for (let i = 0; i < 3; i++) {
      box(0.49, 0.22, 0.02, dark, -2.55, 0.4 + i * 0.29, -0.015);
      ball(0.027, accent, -2.39, 0.4 + i * 0.29, 0.01);
    }
    for (let i = 0; i < 3; i++)
      box(
        0.18,
        0.55 + i * 0.08,
        0.5,
        [pink, wood, accent][i],
        -1.3 + i * 0.21,
        2.43,
        -0.8,
      );
    scene.add(new THREE.HemisphereLight("#fffaf2", "#789b9c", 2.3));
    const sun = new THREE.DirectionalLight("#ffedda", 4);
    sun.position.set(-3, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill = new THREE.DirectionalLight("#c6e7ee", 2);
    fill.position.set(5, 4, -4);
    scene.add(fill);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    materials.add(groundMat);
    const ground = mesh(
      new THREE.PlaneGeometry(100, 100),
      groundMat,
      0,
      -0.06,
      0,
      scene,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.castShadow = false;
    let targetRotation = 0,
      dragStart: number | null = null,
      dragOrigin = 0,
      moved = 0,
      visible = true,
      frame = 0,
      disposed = false,
      lost = false;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const down = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      autoRotateRef.current = false;
      setAutoRotate(false);
      dragStart = event.clientX;
      dragOrigin = targetRotation;
      moved = 0;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (dragStart !== null) {
        moved = Math.max(moved, Math.abs(event.clientX - dragStart));
        targetRotation = dragOrigin + (event.clientX - dragStart) * 0.008;
        canvas.style.cursor = "grabbing";
      } else if (event.pointerType === "mouse") {
        const rect = canvas.getBoundingClientRect();
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        canvas.style.cursor = raycaster.intersectObjects(targets).length
          ? "pointer"
          : "grab";
      }
    };
    const up = (event: PointerEvent) => {
      const wasDrag = moved > 6;
      moved = 0;
      dragStart = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      if (wasDrag) return;
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(targets)[0];
      if (hit)
        onExploreRef.current(
          hit.object.userData.destination as DeskDestination,
        );
    };
    const cancel = () => {
      dragStart = null;
      moved = 0;
    };
    const lostContext = (event: Event) => {
      event.preventDefault();
      lost = true;
      element.dataset.ready = "false";
    };
    const restored = () => {
      lost = false;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("webglcontextlost", lostContext);
    canvas.addEventListener("webglcontextrestored", restored);
    const resize = () => {
      const width = element.clientWidth,
        height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      const aspect = width / height;
      camera.left = -4.1 * aspect;
      camera.right = 4.1 * aspect;
      camera.top = 4.1;
      camera.bottom = -4.1;
      camera.updateProjectionMatrix();
    };
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(element);
    resize();
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(element);
    let last = 0,
      elapsed = 0;
    const draw = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(draw);
      if (now - last < 32) return;
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden || lost) return;
      elapsed += delta;
      if (motionRef.current && autoRotateRef.current && dragStart === null)
        targetRotation += delta * 0.12;
      desk.rotation.y += (targetRotation - desk.rotation.y) * 0.12;
      wave.rotation.z = motionRef.current
        ? -0.12 + Math.sin(elapsed * 2) * 0.12
        : 0;
      renderer.render(scene, camera);
      element.dataset.ready = "true";
    };
    frame = requestAnimationFrame(draw);
    runtime.current = {
      rotate: (step) => {
        targetRotation += step;
      },
      reset: () => {
        targetRotation = 0;
      },
    };
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      observer.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("webglcontextlost", lostContext);
      canvas.removeEventListener("webglcontextrestored", restored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      canvas.remove();
      runtime.current = null;
      delete element.dataset.ready;
    };
  }, [theme, mode]);
  return (
    <div className="v3-desk-scene">
      <div className="v3-canvas-host" ref={host}>
        <svg
          className="v3-desk-fallback"
          viewBox="0 0 640 500"
          role="img"
          aria-label="Illustration of Prakash’s engineering desk. The project, experience and contact shortcuts work without 3D."
        >
          <ellipse cx="335" cy="402" rx="240" ry="60" fill="#a8bca4" />
          <path d="M140 275 386 180 558 270 320 372Z" fill="#faf7ec" />
          <path d="M140 275v17l180 97 238-103v-16L320 372Z" fill="#c6b390" />
          <path
            d="M170 300v90m350-100v90M340 370v70"
            stroke="#ab8d65"
            strokeWidth="17"
          />
          <path
            d="m240 248 116-48v-93l-116 45Z"
            fill="#263e48"
            stroke="#47616c"
            strokeWidth="8"
          />
          <text
            x="257"
            y="207"
            fill="#bedab9"
            fontSize="27"
            transform="rotate(-22 257 207)"
          >
            {"{ }"}
          </text>
          <path d="m365 280 90-37-35-33-87 35Z" fill="#92aaa4" />
          <path d="m365 280 90-37v-67l-90 36Z" fill="#283e49" />
          <circle cx="293" cy="291" r="39" fill="#e9b88c" />
          <path
            d="M251 287q-1-65 64-44 24 8 18 44-22-12-50-11Z"
            fill="#293630"
          />
          <path d="M252 332q44-23 79 0l18 61h-111Z" fill="#82a88a" />
          <path
            d="m341 346 36-50"
            stroke="#e9b88c"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path d="m478 326 11 45h36l10-45Z" fill="#eee6d4" />
          <path
            d="m504 326-28-53 29 23 20-46 1 62 21-18-21 38Z"
            fill="#689174"
          />
        </svg>
      </div>
      <div className="v3-scene-controls" aria-label="3D desk controls">
        <span>Make yourself at home.</span>
        <div>
          <button
            onClick={() => {
              pauseRotation();
              runtime.current?.rotate(-0.3);
            }}
            aria-label="Rotate desk left"
          >
            <RotateCcw size={17} />
          </button>
          <button
            onClick={() => {
              pauseRotation();
              runtime.current?.rotate(0.3);
            }}
            aria-label="Rotate desk right"
          >
            <RotateCw size={17} />
          </button>
          <button
            type="button"
            aria-label="Auto-rotate desk"
            aria-pressed={enabled && autoRotate}
            disabled={!enabled}
            title={
              enabled
                ? "Toggle automatic desk rotation"
                : "Enable site animations to use auto-rotation"
            }
            onClick={() => setAutoRotate((value) => !value)}
          >
            {enabled && autoRotate ? <Pause size={15} /> : <Play size={15} />}
            Auto-rotate
          </button>
          <button
            onClick={() => {
              pauseRotation();
              runtime.current?.reset();
            }}
          >
            Reset view
          </button>
        </div>
      </div>
      <div className="v3-desk-shortcuts" aria-label="Explore from the desk">
        <button onClick={() => onExplore("projects")}>
          <Code2 size={16} />
          {mode === "tools" ? "Browse tools" : "The work"}
        </button>
        <button onClick={() => onExplore("experience")}>
          <BookOpen size={16} />
          {mode === "tools" ? "JSON studio" : "The journey"}
        </button>
        <button onClick={() => onExplore("contact")}>
          <MessageCircle size={16} />
          {mode === "tools" ? "Meet the builder" : "Say hello"}
        </button>
      </div>
    </div>
  );
}
