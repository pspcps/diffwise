import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useMotion } from "../Motion/MotionContext";

interface SceneProps {
  kind: string;
  fraction: number;
  shape?: string;
  dimensions?: Record<string, number>;
  plot?: [number, number][];
  description: string;
}
/** Procedural, locally rendered objects. No models, textures, or hosted 3D services. */
export default function MeasurementScene({
  kind,
  fraction,
  shape,
  dimensions,
  plot,
  description,
}: SceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const values = useRef({ fraction, shape, dimensions, plot });
  const redraw = useRef<(() => void) | null>(null);
  const { enabled } = useMotion();
  useEffect(() => {
    values.current = { fraction, shape, dimensions, plot };
    redraw.current?.();
  }, [fraction, shape, dimensions, plot]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      element.dataset.unavailable = "true";
      return;
    }
    delete element.dataset.unavailable;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", description);
    renderer.domElement.setAttribute("role", "img");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(5, 3.5, 7);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.2, 0);
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.enableDamping = false;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x45675c, 2.4));
    const key = new THREE.DirectionalLight(0xffe3b8, 3);
    key.position.set(3, 7, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8fcbff, 2);
    fill.position.set(-4, 3, -3);
    scene.add(fill);
    const group = new THREE.Group();
    scene.add(group);
    const materials: THREE.Material[] = [];
    const mat = (
      color: THREE.ColorRepresentation,
      extra: THREE.MeshStandardMaterialParameters = {},
    ) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.38,
        metalness: 0.15,
        ...extra,
      });
      materials.push(m);
      return m;
    };
    const mint = mat("#a8dfc5"),
      dark = mat("#263b3b"),
      water = mat("#4bbcf0", { transparent: true, opacity: 0.75 }),
      sugar = mat("#fff3ce"),
      skin = mat("#eeb88b"),
      rose = mat("#eaa0ad"),
      glass = mat("#cce4dc", {
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    const mesh = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      parent: THREE.Object3D = group,
    ) => {
      const m = new THREE.Mesh(geometry, material);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const box = (
      w: number,
      h: number,
      d: number,
      m: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      parent: THREE.Object3D = group,
    ) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent);
    const ball = (
      r: number,
      m: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      parent: THREE.Object3D = group,
    ) => mesh(new THREE.SphereGeometry(r, 24, 16), m, x, y, z, parent);
    const cyl = (
      r: number,
      h: number,
      m: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      parent: THREE.Object3D = group,
    ) => mesh(new THREE.CylinderGeometry(r, r, h, 48), m, x, y, z, parent);
    const platform = cyl(2.25, 0.12, dark, 0, -1.52);
    platform.material = mat("#233431");
    const grid = new THREE.GridHelper(4, 16, 0x597868, 0x344c43);
    grid.position.y = -1.45;
    scene.add(grid);
    const curveMaterial = new THREE.LineBasicMaterial({ color: 0xf4cb86 });
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xe4fff2 });
    materials.push(curveMaterial, edgeMaterial);
    const dynamic = new THREE.Group();
    group.add(dynamic);
    const updaters: ((p: number, t: number) => void)[] = [];
    let geometrySignature = "";
    const disposeObject = (root: THREE.Object3D) => {
      root.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line)
          child.geometry.dispose();
      });
    };
    const clearDynamic = () => {
      disposeObject(dynamic);
      dynamic.clear();
    };
    function buildGeometry() {
      const {
        shape = "cube",
        dimensions: d = { a: 2, b: 2, h: 3, r: 1, c: 2 },
      } = values.current;
      const signature = JSON.stringify([shape, d]);
      if (signature === geometrySignature) return;
      geometrySignature = signature;
      clearDynamic();
      const maximum = Math.max(...Object.values(d));
      const scaled = (key: string) =>
        Math.max(1e-6, ((d[key] || 1) / maximum) * 2);
      const a = scaled("a"),
        b = scaled("b"),
        h = scaled("h"),
        r = scaled("r"),
        c = scaled("c");
      let geometry: THREE.BufferGeometry;
      switch (shape) {
        case "sphere":
          geometry = new THREE.SphereGeometry(r, 48, 32);
          break;
        case "cylinder":
          geometry = new THREE.CylinderGeometry(r, r, h, 48);
          break;
        case "cone":
          geometry = new THREE.ConeGeometry(r, h, 48);
          break;
        case "pyramid":
          geometry = new THREE.ConeGeometry(a / Math.sqrt(2), h, 4);
          geometry.rotateY(Math.PI / 4);
          break;
        case "circle":
          geometry = new THREE.CylinderGeometry(r, r, 0.03, 64);
          break;
        case "ellipse":
          geometry = new THREE.CylinderGeometry(1, 1, 0.03, 64);
          geometry.scale(a, 1, b);
          break;
        case "triangle":
        case "right-triangle":
        case "triangular-prism":
        case "trapezoid":
        case "parallelogram": {
          const outline = new THREE.Shape();
          outline.moveTo(0, 0);
          if (shape === "trapezoid") {
            outline.lineTo(a, 0);
            outline.lineTo((a + b) / 2, h);
            outline.lineTo((a - b) / 2, h);
          } else if (shape === "parallelogram") {
            outline.lineTo(a, 0);
            outline.lineTo(a + h * 0.3, h);
            outline.lineTo(h * 0.3, h);
          } else if (shape === "triangle") {
            const x = (a * a + b * b - c * c) / (2 * a);
            outline.lineTo(a, 0);
            outline.lineTo(x, Math.sqrt(Math.max(0, b * b - x * x)));
          } else {
            outline.lineTo(a, 0);
            outline.lineTo(0, b);
          }
          outline.closePath();
          geometry = new THREE.ExtrudeGeometry(outline, {
            depth: shape === "triangular-prism" ? h : 0.04,
            bevelEnabled: false,
          });
          geometry.center();
          break;
        }
        default:
          geometry = new THREE.BoxGeometry(
            a,
            shape === "rectangle" || shape === "square"
              ? 0.03
              : shape === "cube"
                ? a
                : h,
            shape === "square" || shape === "cube" ? a : b,
          );
      }
      geometry.computeBoundingBox();
      const size = new THREE.Vector3();
      geometry.boundingBox!.getSize(size);
      const scale = 2.6 / Math.max(size.x, size.y, size.z, 0.001);
      geometry.scale(scale, scale, scale);
      geometry.computeBoundingBox();
      const minY = geometry.boundingBox!.min.y;
      mesh(geometry, mint, 0, -1.4 - minY, 0, dynamic);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        edgeMaterial,
      );

      edges.position.y = -1.4 - minY;
      dynamic.add(edges);
    }
    if (kind === "geometry") buildGeometry();
    else if (kind === "algebra") {
      box(3.8, 0.025, 0.025, mint, 0, 0, 0);
      box(0.025, 2.8, 0.025, mint, 0, 0, 0);
      updaters.push(() => {
        const signature = JSON.stringify(values.current.plot);
        if (signature === geometrySignature) return;
        geometrySignature = signature;
        clearDynamic();
        const p = values.current.plot || [];
        if (!p.length) return;
        const maxX = Math.max(1, ...p.map((p) => Math.abs(p[0]))),
          maxY = Math.max(1, ...p.map((p) => Math.abs(p[1])));
        const points = p.map(
          ([x, y]) => new THREE.Vector3((x / maxX) * 1.8, (y / maxY) * 1.25, 0),
        );
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          curveMaterial,
        );

        dynamic.add(line);
      });
    } else if (kind === "height") {
      const person = new THREE.Group();
      person.position.set(-0.4, -1.4, 0);
      group.add(person);
      box(0.22, 0.85, 0.28, dark, -0.18, 0.43, 0, person);
      box(0.22, 0.85, 0.28, dark, 0.18, 0.43, 0, person);
      const torso = mesh(
        new THREE.CapsuleGeometry(0.36, 0.48, 8, 20),
        mint,
        0,
        1.23,
        0,
        person,
      );
      torso.scale.z = 0.6;
      ball(0.29, skin, 0, 1.98, 0, person);
      const hair = ball(0.3, dark, 0, 2.07, -0.03, person);
      hair.scale.y = 0.55;
      box(0.12, 0.7, 0.16, skin, -0.46, 1.15, 0, person);
      box(0.12, 0.7, 0.16, skin, 0.46, 1.15, 0, person);
      box(0.12, 3, 0.12, sugar, 1.1, 0.1, 0);
      for (let i = 0; i <= 10; i++)
        box(
          i % 2 === 0 ? 0.24 : 0.13,
          0.02,
          0.04,
          dark,
          1.05,
          -1.4 + i * 0.28,
          0.09,
        );
      const pointer = box(0.5, 0.035, 0.16, rose, 0.95, 1, 0);
      updaters.push((p) => {
        person.scale.setScalar(Math.max(0.015, p) * (2.8 / 2.27));
        pointer.position.y = -1.4 + p * 2.8;
      });
    } else if (
      kind === "mass" ||
      kind === "liquid" ||
      kind === "density" ||
      kind === "pressure"
    ) {
      const vessel = cyl(0.85, 2.5, glass, 0, -0.15, 0);
      vessel.renderOrder = 2;
      cyl(0.88, 0.1, dark, 0, -1.42);
      const rim = mesh(
        new THREE.TorusGeometry(0.85, 0.035, 10, 64),
        mint,
        0,
        1.1,
      );
      rim.rotation.x = Math.PI / 2;
      if (kind === "liquid") {
        const fluid = cyl(0.81, 1, water);
        const stream = cyl(0.055, 0.6, water, 0, 1.45);
        const drainDrops = Array.from({ length: 5 }, () => ball(0.055, water));
        stream.visible = false;
        updaters.push((p, t) => {
          fluid.scale.y = Math.max(0.001, p * 2.45);
          fluid.position.y = -1.36 + p * 1.225;
          const target = Math.min(1, Math.max(0, values.current.fraction));
          stream.visible = enabled && target - p > 0.002;
          stream.scale.x = stream.scale.z = 0.8 + Math.sin(t * 5) * 0.2;
          drainDrops.forEach((drop, i) => {
            drop.visible = enabled && p - target > 0.002;
            const progress = (t * 1.5 + i / 5) % 1;
            drop.position.set(0.85 + progress * 0.5, -1.2 - progress * 1.4, 0);
          });
        });
      } else if (kind === "pressure") {
        const piston = cyl(0.82, 0.15, rose);
        const shaft = cyl(0.08, 1.4, dark);
        updaters.push((p) => {
          piston.position.y = 0.9 - p * 1.8;
          shaft.position.y = piston.position.y + 0.7;
        });
      } else {
        const grains: THREE.Mesh[] = [];
        for (let i = 0; i < 160; i++) {
          const angle = i * 2.399963,
            rad = 0.72 * Math.sqrt(((i * 37) % 160) / 160);
          grains.push(
            box(
              0.12,
              0.12,
              0.12,
              kind === "mass" ? sugar : mint,
              Math.cos(angle) * rad,
              -1.28 + Math.floor(i / 16) * 0.23,
              Math.sin(angle) * rad,
            ),
          );
        }
        updaters.push((p) =>
          grains.forEach((m, i) => {
            m.visible = i < Math.round(p * 160);
          }),
        );
      }
      for (let i = 0; i < 6; i++)
        box(0.15, 0.025, 0.04, mint, 0.82, -1.3 + i * 0.45, 0.15);
    } else if (kind === "area" || kind === "data") {
      for (let i = 0; i < 25; i++) {
        const tile = box(
          0.58,
          kind === "area" ? 0.07 : 0.5,
          0.58,
          mint,
          ((i % 5) - 2) * 0.62,
          kind === "area" ? -1.35 : -1.15 + Math.floor(i / 5) * 0.54,
          kind === "area" ? (Math.floor(i / 5) - 2) * 0.62 : 0,
        );
        updaters.push((p) => {
          tile.visible = i < Math.ceil(p * 25);
        });
      }
    } else if (
      kind === "temperature" ||
      kind === "voltage" ||
      kind === "energy"
    ) {
      const shell = box(1, 2.7, 0.6, glass, 0, -0.05);
      shell.renderOrder = 2;
      box(1.1, 0.12, 0.7, dark, 0, -1.4);
      const charge = box(0.88, 1, 0.48, kind === "temperature" ? rose : mint);
      if (kind === "temperature") ball(0.4, rose, 0, -1.2);
      else box(0.4, 0.15, 0.4, mint, 0, 1.4);
      updaters.push((p) => {
        charge.scale.y = Math.max(0.001, p * 2.6);
        charge.position.y = -1.35 + p * 1.3;
      });
    } else if (kind === "time" || kind === "angle") {
      const ring = mesh(
        new THREE.TorusGeometry(1.25, 0.06, 12, 64),
        mint,
        0,
        0,
        0,
      );
      ring.position.y = 0;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        box(0.06, 0.17, 0.08, sugar, Math.sin(a) * 1.15, Math.cos(a) * 1.15);
      }
      const arm = new THREE.Group();
      group.add(arm);
      box(0.07, 1.1, 0.1, rose, 0, 0.55, 0, arm);
      ball(0.12, sugar);
      updaters.push((p) => {
        arm.rotation.z = -p * Math.PI * 2;
      });
    } else if (kind === "speed") {
      box(4, 0.05, 1.1, dark, 0, -1.2);
      for (let i = 0; i < 8; i++)
        box(0.24, 0.02, 0.06, sugar, -1.8 + i * 0.5, -1.16);
      const car = new THREE.Group();
      group.add(car);
      box(1.2, 0.35, 0.65, mint, 0, -0.8, 0, car);
      box(0.6, 0.3, 0.56, glass, 0, -0.5, 0, car);
      for (const x of [-0.4, 0.4])
        for (const z of [-0.35, 0.35]) {
          const wheel = cyl(0.18, 0.14, dark, x, -1, z, car);
          wheel.rotation.x = Math.PI / 2;
        }
      updaters.push((p, t) => {
        car.position.x = enabled && p > 0 ? Math.sin(t * p * 3) * 1.2 : 0;
      });
    } else if (kind === "power") {
      cyl(0.4, 0.6, dark, 0, -1.1);
      const bulb = ball(0.85, sugar, 0, 0.1);
      const glow = mat("#fff1ae", {
        emissive: "#ffcc55",
        emissiveIntensity: 0,
      });
      bulb.material = glow;
      updaters.push((p) => {
        glow.emissiveIntensity = p * 3;
        bulb.scale.setScalar(0.8 + p * 0.2);
      });
    } else if (kind === "force") {
      box(1.5, 0.12, 0.6, dark, 0, 1.25);
      const springGroup = new THREE.Group();
      springGroup.position.y = 1.1;
      group.add(springGroup);
      const points = Array.from(
        { length: 161 },
        (_, i) =>
          new THREE.Vector3(
            Math.cos((i / 160) * Math.PI * 16) * 0.25,
            (-i / 160) * 1.2,
            Math.sin((i / 160) * Math.PI * 16) * 0.25,
          ),
      );
      mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          160,
          0.035,
          8,
          false,
        ),
        mint,
        0,
        0,
        0,
        springGroup,
      );
      const load = box(0.65, 0.4, 0.65, rose);
      updaters.push((p) => {
        springGroup.scale.y = 0.5 + p;
        load.position.y = 1.1 - 1.2 * springGroup.scale.y - 0.2;
      });
    } else if (kind === "current") {
      const ring = mesh(new THREE.TorusGeometry(1.15, 0.06, 12, 80), mint);
      ring.rotation.x = Math.PI / 2;
      const charges = Array.from({ length: 16 }, () => ball(0.09, sugar));
      updaters.push((p, t) =>
        charges.forEach((charge, i) => {
          charge.visible = i < Math.ceil(p * 16);
          const a = (i / 16) * Math.PI * 2 + (enabled ? t * p : 0);
          charge.position.set(Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15);
        }),
      );
    } else if (kind === "frequency") {
      let prev = -1;
      updaters.push((p) => {
        if (prev === p) return;
        prev = p;
        clearDynamic();
        const points = Array.from(
          { length: 161 },
          (_, i) =>
            new THREE.Vector3(
              -1.8 + (i / 160) * 3.6,
              Math.sin((i / 160) * Math.PI * 2 * p * 10),
              0,
            ),
        );
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          curveMaterial,
        );

        dynamic.add(line);
      });
    }
    let frame = 0,
      visible = true,
      disposed = false;
    const startedAt = performance.now();
    let displayedFraction = Math.min(
      1,
      Math.max(kind === "angle" ? -1 : 0, values.current.fraction),
    );
    let lastTime = 0;
    const draw = () => {
      if (disposed) return;
      const target = Math.min(
        1,
        Math.max(kind === "angle" ? -1 : 0, values.current.fraction),
      );
      const time = (performance.now() - startedAt) / 1000;
      const delta = Math.min(0.1, time - lastTime);
      lastTime = time;
      displayedFraction = enabled
        ? displayedFraction +
          (target - displayedFraction) * (1 - Math.exp(-delta * 9))
        : target;
      if (Math.abs(displayedFraction - target) < 0.0001)
        displayedFraction = target;
      if (kind === "geometry") buildGeometry();
      updaters.forEach((update) => update(displayedFraction, time));
      renderer.render(scene, camera);
    };
    const tick = () => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      draw();
      const target = Math.min(
        1,
        Math.max(kind === "angle" ? -1 : 0, values.current.fraction),
      );
      if (
        enabled &&
        (kind === "speed" ||
          kind === "current" ||
          Math.abs(displayedFraction - target) > 0.0001)
      )
        frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      draw();
      if (enabled && !frame && visible && !document.hidden)
        frame = requestAnimationFrame(tick);
    };
    redraw.current = wake;
    controls.addEventListener("change", wake);
    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      wake();
    });
    resize.observe(element);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) wake();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    intersection.observe(element);
    document.addEventListener("visibilitychange", wake);
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      redraw.current = null;
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", wake);
      controls.dispose();
      disposeObject(scene);
      grid.material.dispose();
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [kind, enabled, description]);
  return (
    <div className="measurement-scene" ref={host}>
      <p className="scene-fallback">
        3D is unavailable in this browser. All calculations and formulas remain
        available below.
      </p>
    </div>
  );
}
