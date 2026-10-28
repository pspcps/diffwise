import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { type LanguageTheme } from './LanguageThemes';
import { soundFX } from './SoundFX';
import {
  RotateCcw,
  Zap,
  Activity,
  Layers,
  Database,
  Cpu,
  Server,
  Cloud,
  Terminal,
} from 'lucide-react';

interface ArchitectureNode {
  id: string;
  label: string;
  sublabel: string;
  category: 'core' | 'ai' | 'backend' | 'database' | 'frontend' | 'infra';
  pos: [number, number, number];
  color: number;
  specs: {
    metric: string;
    throughput: string;
    protocol: string;
  };
  connectedTo: string[];
}

const ARCH_NODES: ArchitectureNode[] = [
  {
    id: 'kafka',
    label: 'Apache Kafka Cluster',
    sublabel: 'Distributed Event Streaming Engine',
    category: 'core',
    pos: [0, 0, 0],
    color: 0xef4444,
    specs: {
      metric: '99.999% Reliability',
      throughput: '1.2M events/sec',
      protocol: 'Kafka TCP / Zero-Copy',
    },
    connectedTo: ['nodejs', 'vertex', 'postgres', 'redis', 'k8s'],
  },
  {
    id: 'nodejs',
    label: 'Node.js Microservices',
    sublabel: 'Event Consumer & Producer Mesh',
    category: 'backend',
    pos: [-4.2, 1.8, 1.5],
    color: 0x22c55e,
    specs: {
      metric: 'Sub-15ms Latency',
      throughput: '45k req/sec',
      protocol: 'Async I/O / Fastify',
    },
    connectedTo: ['kafka', 'react', 'redis'],
  },
  {
    id: 'vertex',
    label: 'Vertex AI & Gemini LLM',
    sublabel: 'Agentic Vision & Reasoning Pipeline',
    category: 'ai',
    pos: [4.2, 2.0, -1.2],
    color: 0x8b5cf6,
    specs: {
      metric: 'Multimodal RAG',
      throughput: 'Streamed Tokens',
      protocol: 'gRPC / SSE Streaming',
    },
    connectedTo: ['kafka', 'redis', 'react'],
  },
  {
    id: 'postgres',
    label: 'PostgreSQL Distributed DB',
    sublabel: 'ACID Relational & Financial Ledgers',
    category: 'database',
    pos: [-3.8, -2.2, -1.8],
    color: 0x38bdf8,
    specs: {
      metric: 'Transactional Integrity',
      throughput: '12k write IOPS',
      protocol: 'pgpool / Drizzle ORM',
    },
    connectedTo: ['kafka', 'nodejs'],
  },
  {
    id: 'redis',
    label: 'Redis Cache & Vector Search',
    sublabel: 'Sub-millisecond In-Memory Store',
    category: 'database',
    pos: [3.6, -1.8, 2.2],
    color: 0xf59e0b,
    specs: {
      metric: '< 1ms Retrieval',
      throughput: '120k ops/sec',
      protocol: 'RESP3 / Vector Index',
    },
    connectedTo: ['kafka', 'nodejs', 'vertex'],
  },
  {
    id: 'react',
    label: 'React SPA Client Mesh',
    sublabel: 'Vite & High-Density Monaco Diff Studio',
    category: 'frontend',
    pos: [0.2, 4.0, 0.8],
    color: 0x06b6d4,
    specs: {
      metric: 'Zero Cumulative Layout Shift',
      throughput: '60 FPS Canvas',
      protocol: 'WebSockets / WSS',
    },
    connectedTo: ['nodejs', 'vertex'],
  },
  {
    id: 'k8s',
    label: 'Docker & Kubernetes Core',
    sublabel: 'Cloud-Native Container Orchestration',
    category: 'infra',
    pos: [-0.5, -3.8, 0.5],
    color: 0x3b82f6,
    specs: {
      metric: 'Self-Healing Nodes',
      throughput: 'Auto-Scaling Pods',
      protocol: 'K8s Ingress / Envoy',
    },
    connectedTo: ['kafka', 'nodejs', 'postgres'],
  },
];

interface ThreeDArchitectureNexusProps {
  theme: LanguageTheme;
}

export const ThreeDArchitectureNexus: React.FC<ThreeDArchitectureNexusProps> = ({
  theme,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(ARCH_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<ArchitectureNode | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activePreset, setActivePreset] = useState<'orbit' | 'kafka' | 'ai'>('orbit');

  const controlsRef = useRef<OrbitControls | null>(null);
  const burstEventRef = useRef<(() => void) | null>(null);

  const triggerBurst = useCallback(() => {
    soundFX.playKeyClick();
    if (burstEventRef.current) {
      burstEventRef.current();
    }
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 22;
    controls.minDistance = 4;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const themeLight = new THREE.PointLight(theme.primaryThree, 4, 25);
    themeLight.position.set(0, 0, 0);
    scene.add(themeLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(theme.secondaryThree, 1.0);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // 4. Background Data Particle Field
    const particleCount = 650;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 6 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = radius * Math.cos(phi);
      pScales[i] = Math.random() * 2.5 + 0.5;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('scale', new THREE.BufferAttribute(pScales, 1));

    const pMat = new THREE.PointsMaterial({
      color: theme.primaryThree,
      size: 0.12,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(pGeo, pMat);
    scene.add(particleSystem);

    // 5. Build 3D Architecture Nodes & Meshes
    const nodeMeshes: THREE.Group[] = [];
    const interactiveMeshes: THREE.Mesh[] = [];

    // Helper to generate text billboard sprite for node labels
    const createNodeLabelSprite = (text: string, colorHex: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(12, 16, 36, 0.85)';
        ctx.roundRect(4, 4, 248, 56, 12);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = colorHex;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(2.4, 0.6, 1);
      return sprite;
    };

    ARCH_NODES.forEach(node => {
      const group = new THREE.Group();
      group.position.set(...node.pos);
      group.userData = { nodeData: node };

      const isCore = node.id === 'kafka';
      const nodeRadius = isCore ? 0.95 : 0.6;

      // Inner Core Mesh (Glowing Sphere/Icosahedron)
      const coreGeo = isCore
        ? new THREE.IcosahedronGeometry(nodeRadius, 2)
        : new THREE.SphereGeometry(nodeRadius, 24, 24);

      const coreMat = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: isCore ? 0.75 : 0.5,
        roughness: 0.25,
        metalness: 0.85,
        wireframe: false,
      });

      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.userData = { nodeData: node };
      group.add(coreMesh);
      interactiveMeshes.push(coreMesh);

      // Outer Wireframe Cage
      const cageGeo = new THREE.IcosahedronGeometry(nodeRadius * 1.35, 1);
      const cageMat = new THREE.MeshBasicMaterial({
        color: node.color,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const cageMesh = new THREE.Mesh(cageGeo, cageMat);
      cageMesh.userData = { isCage: true, spinSpeed: (Math.random() - 0.5) * 0.03 };
      group.add(cageMesh);

      // Concentric Orbit Rings for Core
      if (isCore) {
        const ringGeo = new THREE.TorusGeometry(nodeRadius * 1.8, 0.04, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: theme.primaryThree,
          transparent: true,
          opacity: 0.7,
        });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 3;
        ring1.userData = { isRing: true, rotAxis: 'x', speed: 0.02 };
        group.add(ring1);

        const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
        ring2.rotation.y = Math.PI / 4;
        ring2.userData = { isRing: true, rotAxis: 'y', speed: -0.015 };
        group.add(ring2);
      }

      // Floating billboard label above node
      const labelSprite = createNodeLabelSprite(node.label, '#' + node.color.toString(16).padStart(6, '0'));
      labelSprite.position.set(0, nodeRadius * 1.9, 0);
      group.add(labelSprite);

      scene.add(group);
      nodeMeshes.push(group);
    });

    // 6. Connecting Bezier Data Curves & Moving Packets
    interface DataCurveInfo {
      curve: THREE.CubicBezierCurve3;
      tubeMesh: THREE.Line;
      fromNode: ArchitectureNode;
      toNode: ArchitectureNode;
      packets: {
        mesh: THREE.Mesh;
        progress: number;
        speed: number;
      }[];
    }

    const dataCurves: DataCurveInfo[] = [];
    const packetGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({
      color: theme.primaryThree,
      wireframe: false,
    });

    // Connect nodes based on connectedTo list
    const addedConnections = new Set<string>();

    ARCH_NODES.forEach(fromNode => {
      fromNode.connectedTo.forEach(targetId => {
        const toNode = ARCH_NODES.find(n => n.id === targetId);
        if (!toNode) return;

        const connectionKey = [fromNode.id, toNode.id].sort().join('--');
        if (addedConnections.has(connectionKey)) return;
        addedConnections.add(connectionKey);

        const start = new THREE.Vector3(...fromNode.pos);
        const end = new THREE.Vector3(...toNode.pos);

        // Control points for a graceful curved arc in 3D
        const dist = start.distanceTo(end);
        const normal = new THREE.Vector3(0, 1, 0).cross(new THREE.Vector3().subVectors(end, start)).normalize();
        if (normal.length() === 0) normal.set(0, 1, 0);

        const arcOffset = normal.multiplyScalar(dist * 0.22);
        const cp1 = new THREE.Vector3().addVectors(start, arcOffset);
        const cp2 = new THREE.Vector3().addVectors(end, arcOffset);

        const bezier = new THREE.CubicBezierCurve3(start, cp1, cp2, end);
        const curvePoints = bezier.getPoints(40);
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);

        const curveMat = new THREE.LineBasicMaterial({
          color: 0x334155,
          transparent: true,
          opacity: 0.35,
          linewidth: 1,
        });
        const line = new THREE.Line(curveGeo, curveMat);
        scene.add(line);

        // Create 2-3 data packets traversing this line
        const packets = [0, 0.45].map(initialProg => {
          const pMesh = new THREE.Mesh(packetGeo, packetMat.clone());
          scene.add(pMesh);
          return {
            mesh: pMesh,
            progress: initialProg,
            speed: 0.003 + Math.random() * 0.004,
          };
        });

        dataCurves.push({
          curve: bezier,
          tubeMesh: line,
          fromNode,
          toNode,
          packets,
        });
      });
    });

    // 7. Raycasting for Interaction (Hover & Click)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hitNode = intersects[0].object.userData.nodeData as ArchitectureNode;
        container.style.cursor = 'pointer';
        setHoveredNode(hitNode);
      } else {
        container.style.cursor = 'grab';
        setHoveredNode(null);
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hitNode = intersects[0].object.userData.nodeData as ArchitectureNode;
        soundFX.playKeyClick();
        setSelectedNode(hitNode);

        // Pulse the clicked node
        const mesh = intersects[0].object as THREE.Mesh;
        const origScale = mesh.scale.clone();
        mesh.scale.set(1.4, 1.4, 1.4);
        setTimeout(() => mesh.scale.copy(origScale), 250);
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onPointerDown);

    // 8. Burst Event Trigger
    burstEventRef.current = () => {
      dataCurves.forEach(dc => {
        dc.packets.forEach(p => {
          p.speed *= 4.5;
          setTimeout(() => {
            p.speed = 0.003 + Math.random() * 0.004;
          }, 1200);
        });
      });

      // Flash theme light
      themeLight.intensity = 10;
      setTimeout(() => {
        themeLight.intensity = 4;
      }, 400);
    };

    // 9. Resize Handling
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 10. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotate particle stars gently
      particleSystem.rotation.y = elapsed * 0.02;

      // Animate node internal elements (cages & rings)
      nodeMeshes.forEach(g => {
        g.children.forEach(child => {
          if (child.userData.isCage) {
            child.rotation.x += child.userData.spinSpeed || 0.01;
            child.rotation.y += 0.01;
          }
          if (child.userData.isRing) {
            if (child.userData.rotAxis === 'x') child.rotation.x += child.userData.speed;
            if (child.userData.rotAxis === 'y') child.rotation.y += child.userData.speed;
          }
        });

        // Gentle levitation float
        const basePos = (g.userData.nodeData as ArchitectureNode).pos;
        g.position.y = basePos[1] + Math.sin(elapsed * 1.5 + basePos[0]) * 0.08;
      });

      // Animate data packets along Bezier curves
      dataCurves.forEach(dc => {
        dc.packets.forEach(p => {
          p.progress = (p.progress + p.speed) % 1;
          const pos = dc.curve.getPointAt(p.progress);
          p.mesh.position.copy(pos);
        });

        // Highlight curve if connected to selected/hovered node
        const activeHighlight =
          (hoveredNode && (dc.fromNode.id === hoveredNode.id || dc.toNode.id === hoveredNode.id)) ||
          (selectedNode && (dc.fromNode.id === selectedNode.id || dc.toNode.id === selectedNode.id));

        const mat = dc.tubeMesh.material as THREE.LineBasicMaterial;
        mat.color.setHex(activeHighlight ? theme.primaryThree : 0x334155);
        mat.opacity = activeHighlight ? 0.85 : 0.35;
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
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
  }, [theme, autoRotate]);

  // Camera presets
  const applyCameraPreset = (preset: 'orbit' | 'kafka' | 'ai') => {
    setActivePreset(preset);
    soundFX.playHoverBlip();
    if (!controlsRef.current) return;

    if (preset === 'orbit') {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 4.5, 12);
    } else if (preset === 'kafka') {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 1.5, 5.5);
      setSelectedNode(ARCH_NODES[0]);
    } else if (preset === 'ai') {
      controlsRef.current.target.set(4.2, 2.0, -1.2);
      controlsRef.current.object.position.set(6, 3.5, 4);
      setSelectedNode(ARCH_NODES[2]);
    }
  };

  return (
    <div className="relative w-full h-[500px] md:h-[580px] rounded-3xl overflow-hidden border border-white/10 bg-[#060814] shadow-2xl flex flex-col group">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top HUD Overlay: Active Node System Telemetry */}
      <div className="relative z-10 p-4 md:p-6 flex items-start justify-between pointer-events-none gap-4 flex-wrap">
        {/* Node Information Card */}
        {selectedNode && (
          <div className="pointer-events-auto bg-[#0a0f26]/90 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-2xl max-w-sm space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: `${theme.primaryHex}20`,
                  color: theme.primaryHex,
                  border: `1px solid ${theme.primaryHex}40`,
                }}
              >
                {selectedNode.category.toUpperCase()} NODE
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: theme.primaryHex }}
                />
                <span className="text-[10px] font-mono text-[#a6adc8]">LIVE SYNC</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {selectedNode.id === 'kafka' && <Layers size={14} className="text-[#ef4444]" />}
                {selectedNode.id === 'vertex' && <Cpu size={14} className="text-[#8b5cf6]" />}
                {selectedNode.id === 'nodejs' && <Terminal size={14} className="text-[#22c55e]" />}
                {selectedNode.id === 'postgres' && <Database size={14} className="text-[#38bdf8]" />}
                {selectedNode.id === 'redis' && <Server size={14} className="text-[#f59e0b]" />}
                {selectedNode.id === 'k8s' && <Cloud size={14} className="text-[#3b82f6]" />}
                <span>{selectedNode.label}</span>
              </h4>
              <p className="text-xs text-[#9399b2] mt-0.5">{selectedNode.sublabel}</p>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div className="bg-[#121838] p-2 rounded-xl">
                <div className="text-[10px] text-[#6c7086] uppercase font-mono">Throughput</div>
                <div className="font-mono font-bold text-white text-[11px] mt-0.5">
                  {selectedNode.specs.throughput}
                </div>
              </div>
              <div className="bg-[#121838] p-2 rounded-xl">
                <div className="text-[10px] text-[#6c7086] uppercase font-mono">Performance</div>
                <div className="font-mono font-bold text-[#10b981] text-[11px] mt-0.5">
                  {selectedNode.specs.metric}
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#6c7086] flex items-center justify-between pt-1">
              <span>PROTOCOL:</span>
              <span className="text-[#cdd6f4]">{selectedNode.specs.protocol}</span>
            </div>
          </div>
        )}

        {/* 3D Orbit & Theme Status Header */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#0a0f26]/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-xl">
          <Activity size={14} style={{ color: theme.primaryHex }} />
          <span className="text-xs font-bold text-white tracking-wide">
            3D Distributed Architecture
          </span>
          <span
            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg"
            style={{
              backgroundColor: `${theme.primaryHex}20`,
              color: theme.primaryHex,
            }}
          >
            {theme.name}
          </span>
        </div>
      </div>

      {/* Bottom Floating Control Dock */}
      <div className="mt-auto relative z-10 p-4 md:p-6 flex items-center justify-between pointer-events-none gap-3 flex-wrap">
        {/* Camera Perspective Presets */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#0a0f26]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6c7086] px-2 hidden sm:inline">
            Camera Focus:
          </span>
          {[
            { id: 'orbit', label: 'Full Nexus' },
            { id: 'kafka', label: 'Kafka Core' },
            { id: 'ai', label: 'Vertex AI' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyCameraPreset(p.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePreset === p.id
                  ? 'bg-white/15 text-white shadow-md'
                  : 'text-[#9399b2] hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Action Controls: Live Burst & Auto Rotate */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0a0f26]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
          {/* Trigger Burst Pulse */}
          <button
            onClick={triggerBurst}
            title="Inject real-time event impulse across all Bezier curves"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            style={{
              backgroundColor: `${theme.primaryHex}25`,
              color: theme.primaryHex,
              border: `1px solid ${theme.primaryHex}50`,
            }}
          >
            <Zap size={13} className="animate-bounce" />
            <span>Simulate Traffic Pulse</span>
          </button>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause 3D Orbit' : 'Enable 3D Orbit'}
            className={`p-2 rounded-xl transition-all ${
              autoRotate ? 'bg-white/10 text-white' : 'text-[#6c7086] hover:text-white'
            }`}
          >
            <RotateCcw size={14} className={autoRotate ? 'animate-spin-slow' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};
