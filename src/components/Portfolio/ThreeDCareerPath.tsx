import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { type LanguageTheme } from './LanguageThemes';
import { RESUME } from '../../data/resumeData';
import { soundFX } from './SoundFX';
import { Briefcase, Calendar, ChevronRight, Award } from 'lucide-react';

interface ThreeDCareerPathProps {
  theme: LanguageTheme;
}

export const ThreeDCareerPath: React.FC<ThreeDCareerPathProps> = ({ theme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const selectedExp = RESUME.experience[selectedIdx] || RESUME.experience[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060818, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 16;
    controls.minDistance = 4;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(theme.primaryThree, 3, 20);
    pointLight.position.set(0, 4, 4);
    scene.add(pointLight);

    // Career Spline Path in 3D
    // Reverse experience array so it starts from earliest to latest
    const milestones = [...RESUME.experience].reverse();
    const milestoneCount = milestones.length;

    const curvePoints: THREE.Vector3[] = [];
    const nodePositions: THREE.Vector3[] = [];

    milestones.forEach((_, i) => {
      const t = i / (milestoneCount - 1);
      const x = (t - 0.5) * 8;
      const y = Math.sin(t * Math.PI) * 1.5 - 0.5;
      const z = Math.cos(t * Math.PI * 2) * 1.5;
      const pos = new THREE.Vector3(x, y, z);
      nodePositions.push(pos);
      curvePoints.push(pos);
    });

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.08, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8,
      emissive: theme.primaryThree,
      emissiveIntensity: 0.25,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tubeMesh);

    // Milestone Spheres & Rings
    const interactiveMeshes: THREE.Mesh[] = [];
    const milestoneGroups: THREE.Group[] = [];

    nodePositions.forEach((pos, idx) => {
      const origIdx = milestoneCount - 1 - idx; // map back to RESUME.experience
      const exp = RESUME.experience[origIdx];

      const grp = new THREE.Group();
      grp.position.copy(pos);

      // Sphere
      const sphereGeo = new THREE.SphereGeometry(0.38, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: exp.color,
        emissive: exp.color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.9,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.userData = { expIdx: origIdx };
      grp.add(sphere);
      interactiveMeshes.push(sphere);

      // Glowing outer ring
      const ringGeo = new THREE.TorusGeometry(0.6, 0.03, 16, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: exp.color,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.userData = { isRing: true };
      grp.add(ring);

      scene.add(grp);
      milestoneGroups.push(grp);
    });

    // Traveling Energy Photons along Career Path
    const photonCount = 5;
    const photonGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const photonMat = new THREE.MeshBasicMaterial({
      color: theme.primaryThree,
    });

    const photons = Array.from({ length: photonCount }).map((_, i) => {
      const mesh = new THREE.Mesh(photonGeo, photonMat);
      scene.add(mesh);
      return {
        mesh,
        prog: i / photonCount,
        speed: 0.0025,
      };
    });

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes);

      if (hits.length > 0) {
        container.style.cursor = 'pointer';
        setHoveredIdx(hits[0].object.userData.expIdx);
      } else {
        container.style.cursor = 'grab';
        setHoveredIdx(null);
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes);

      if (hits.length > 0) {
        const idx = hits[0].object.userData.expIdx;
        soundFX.playKeyClick();
        setSelectedIdx(idx);
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onPointerDown);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Spin rings & pulse selected node
      milestoneGroups.forEach((grp, idx) => {
        const origIdx = milestoneCount - 1 - idx;
        const isSelected = origIdx === selectedIdx;
        const isHovered = origIdx === hoveredIdx;

        grp.children.forEach(child => {
          if (child.userData.isRing) {
            child.rotation.z += 0.02;
            child.scale.setScalar(isSelected ? 1.3 : isHovered ? 1.2 : 1.0);
          }
        });

        // Levitation
        grp.position.y = nodePositions[idx].y + Math.sin(elapsed * 2 + idx) * 0.05;
      });

      // Move photons
      photons.forEach(p => {
        p.prog = (p.prog + p.speed) % 1;
        p.mesh.position.copy(curve.getPointAt(p.prog));
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onPointerDown);

      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [theme, selectedIdx, hoveredIdx]);

  return (
    <div className="w-full bg-[#0a0e27]/80 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-[#89b4fa] mb-2">
            <Award size={12} />
            <span>Interactive 3D Timeline Path</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white">
            Career Milestone Trajectory
          </h3>
          <p className="text-xs text-[#9399b2] mt-0.5">
            Drag to rotate the 3D spline. Click any glowing milestone node to reveal project highlights.
          </p>
        </div>

        {/* Milestone Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {RESUME.experience.map((exp, idx) => (
            <button
              key={exp.company}
              onClick={() => {
                soundFX.playHoverBlip();
                setSelectedIdx(idx);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedIdx === idx
                  ? 'bg-white text-[#060814] font-bold shadow-lg scale-105'
                  : 'bg-white/5 text-[#9399b2] hover:text-white hover:bg-white/10'
              }`}
            >
              {exp.company}
            </button>
          ))}
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="relative h-[260px] md:h-[320px] rounded-2xl overflow-hidden border border-white/10 bg-[#050716]">
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
        <div className="absolute top-3 left-3 text-[10px] font-mono text-[#6c7086] bg-[#0c1024]/80 px-2.5 py-1 rounded-lg border border-white/5 pointer-events-none">
          3D Spline Path • 9+ Years Continuous Evolution
        </div>
      </div>

      {/* Selected Milestone Inspection Card */}
      {selectedExp && (
        <div
          className="p-5 md:p-6 rounded-2xl bg-[#0d1230] border border-white/10 space-y-4 animate-in fade-in duration-300 relative overflow-hidden"
          style={{ borderLeft: `4px solid ${selectedExp.color}` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1"
                style={{
                  backgroundColor: `${selectedExp.color}15`,
                  color: selectedExp.color,
                  border: `1px solid ${selectedExp.color}35`,
                }}
              >
                {selectedExp.role}
              </span>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase size={16} style={{ color: selectedExp.color }} />
                <span>{selectedExp.company}</span>
              </h4>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-[#9399b2] bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Calendar size={13} />
              <span>{selectedExp.period}</span>
            </div>
          </div>

          <ul className="space-y-2">
            {selectedExp.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-[#cdd6f4] leading-relaxed">
                <ChevronRight size={13} className="shrink-0 mt-0.5" style={{ color: selectedExp.color }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
