import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function SpatialScene({
  variant = "workspace",
}: {
  variant?: "workspace" | "portfolio";
}) {
  const host = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const running = useRef(true);
  const [paused, setPaused] = useState(false);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      // The renderer reports initialization failure to the fallback UI.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFallback(true);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    running.current = !reduced.matches;
    setPaused(reduced.matches);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D sculpture. Drag to rotate.",
    );
    renderer.domElement.setAttribute("role", "img");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 8.7);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    const group = new THREE.Group();
    scene.add(group);
    const material = new THREE.MeshStandardMaterial({
      color: variant === "portfolio" ? "#b9a2e8" : "#c7e8b4",
      metalness: 0.94,
      roughness: 0.24,
    });
    const geometry = new THREE.TorusKnotGeometry(1.15, 0.39, 180, 32, 2, 3);
    const sculpture = new THREE.Mesh(geometry, material);
    sculpture.rotation.set(0.4, 0.2, -0.3);
    group.add(sculpture);
    const ringGeometry = new THREE.TorusGeometry(2.12, 0.009, 8, 120);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: "#8d9c88",
      transparent: true,
      opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.set(1.13, -0.5, 0);
    group.add(ring);
    const satelliteGeometry = new THREE.IcosahedronGeometry(0.17, 0);
    const satellite = new THREE.Mesh(satelliteGeometry, material);
    satellite.position.set(1.9, 0.7, 0.5);
    group.add(satellite);
    const light = new THREE.DirectionalLight("#e8ffd7", 5);
    light.position.set(3, 4, 4);
    scene.add(light, new THREE.AmbientLight("#ffffff", 1));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controlsRef.current = controls;
    const resize = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const clock = new THREE.Clock();
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const delta = Math.min(clock.getDelta(), 0.05);
      if (!visible || document.hidden) return;
      if (running.current) {
        sculpture.rotation.y += delta * 0.19;
        sculpture.rotation.z += delta * 0.045;
        satellite.rotation.y += delta * 0.6;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    draw();
    const motionChanged = () => {
      running.current = !reduced.matches;
      setPaused(reduced.matches);
    };
    reduced.addEventListener("change", motionChanged);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      reduced.removeEventListener("change", motionChanged);
      controls.dispose();
      controlsRef.current = null;
      geometry.dispose();
      material.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      satelliteGeometry.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [variant]);
  return (
    <div className={`spatial-stage ${fallback ? "spatial-fallback" : ""}`}>
      <div ref={host} className="spatial-canvas" />
      {fallback && (
        <div
          className="fallback-sculpture"
          aria-label="Decorative sculptural loop"
        />
      )}
      <div className="spatial-caption">
        <span className="live-dot" /> A little space to play
      </div>
      <div className="spatial-controls">
        <span>{fallback ? "SCULPTURAL VIEW" : "DRAG TO ROTATE"}</span>
        {!fallback && (
          <>
            <button
              aria-label={paused ? "Play animation" : "Pause animation"}
              onClick={() => {
                running.current = !running.current;
                setPaused(!running.current);
              }}
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
            </button>
            <button
              aria-label="Reset 3D view"
              onClick={() => controlsRef.current?.reset()}
            >
              <RotateCcw size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
