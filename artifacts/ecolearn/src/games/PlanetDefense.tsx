import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, Ring, Html, Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Heart, Zap } from "lucide-react";

const SDG_THREATS = [
  { label: "CO2 Emissions", color: "#555555", sdg: 13, fact: "CO2 levels are at their highest in 3 million years." },
  { label: "Deforestation", color: "#8B4513", sdg: 15, fact: "13 million hectares of forests are lost every year." },
  { label: "Plastic Waste", color: "#9C27B0", sdg: 14, fact: "8 million tonnes of plastic enter oceans annually." },
  { label: "Air Pollution", color: "#607D8B", sdg: 3, fact: "Air pollution kills 7 million people per year." },
  { label: "Water Crisis", color: "#1565C0", sdg: 6, fact: "2.2 billion people lack safe drinking water." },
  { label: "Hunger", color: "#E65100", sdg: 2, fact: "821 million people go to bed hungry every night." },
  { label: "Fossil Fuels", color: "#4E342E", sdg: 7, fact: "Fossil fuels cause 75% of global greenhouse gases." },
  { label: "Inequality", color: "#880E4F", sdg: 10, fact: "The richest 1% own more than the bottom 50% combined." },
];

type Threat = {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  threat: typeof SDG_THREATS[0];
  scale: number;
  alive: boolean;
};

type LaserBeam = {
  id: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  opacity: number;
};

function Earth() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.1; });
  return (
    <group>
      <Sphere ref={ref} args={[1.5, 64, 64]}>
        <meshPhongMaterial color="#1a6b3c" emissive="#0a3d1a" shininess={40} />
      </Sphere>
      <Sphere args={[1.52, 32, 32]}>
        <meshPhongMaterial color="#2196F3" transparent opacity={0.25} wireframe={false} />
      </Sphere>
      <Sphere args={[1.65, 32, 32]}>
        <meshPhongMaterial color="#4FC3F7" transparent opacity={0.06} />
      </Sphere>
    </group>
  );
}

function ThreatMesh({ threat, onClick }: { threat: Threat; onClick: (t: Threat) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current || !threat.alive) return;
    ref.current.position.addScaledVector(threat.velocity, delta);
    ref.current.rotation.x += delta * 1.5;
    ref.current.rotation.y += delta * 2;
    threat.position.copy(ref.current.position);
  });
  if (!threat.alive) return null;
  return (
    <mesh ref={ref} position={threat.position.clone()} onClick={(e) => { e.stopPropagation(); onClick(threat); }}>
      <dodecahedronGeometry args={[threat.scale, 0]} />
      <meshPhongMaterial color={threat.threat.color} emissive={threat.threat.color} emissiveIntensity={0.3} />
      <Html distanceFactor={10} center style={{ pointerEvents: "none" }}>
        <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap border border-white/20 font-bold">
          ⚠️ {threat.threat.label}
        </div>
      </Html>
    </mesh>
  );
}

function LaserBeamMesh({ beam }: { beam: LaserBeam }) {
  const ref = useRef<THREE.Mesh>(null);
  const mid = beam.from.clone().lerp(beam.to, 0.5);
  const dir = beam.to.clone().sub(beam.from);
  const length = dir.length();
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh ref={ref} position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[0.02, 0.02, length, 8]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={beam.opacity} />
    </mesh>
  );
}

function ShieldRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.z += delta * 0.5; });
  return (
    <Ring ref={ref} args={[1.9, 2.0, 64]}>
      <meshBasicMaterial color="#00ff88" transparent opacity={0.3} side={THREE.DoubleSide} />
    </Ring>
  );
}

function Scene({ onHit, onMiss, gameOver }: { onHit: (t: typeof SDG_THREATS[0]) => void; onMiss: () => void; gameOver: boolean }) {
  const { camera } = useThree();
  const [threats, setThreats] = useState<Threat[]>([]);
  const [lasers, setLasers] = useState<LaserBeam[]>([]);
  const nextId = useRef(0);
  const laserNextId = useRef(0);
  const waveTimer = useRef(0);
  const wave = useRef(0);

  useEffect(() => {
    camera.position.set(0, 2, 7);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const spawnThreat = () => {
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI;
    const r = 8;
    const pos = new THREE.Vector3(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(theta)
    );
    const vel = pos.clone().negate().normalize().multiplyScalar(0.6 + wave.current * 0.08);
    const t: Threat = {
      id: nextId.current++,
      position: pos,
      velocity: vel,
      threat: SDG_THREATS[Math.floor(Math.random() * SDG_THREATS.length)],
      scale: 0.18 + Math.random() * 0.1,
      alive: true,
    };
    setThreats(prev => [...prev, t]);
  };

  useFrame((_, delta) => {
    if (gameOver) return;
    waveTimer.current += delta;
    const interval = Math.max(0.8, 2.5 - wave.current * 0.1);
    if (waveTimer.current > interval) {
      waveTimer.current = 0;
      wave.current++;
      const count = Math.min(1 + Math.floor(wave.current / 5), 3);
      for (let i = 0; i < count; i++) spawnThreat();
    }

    setThreats(prev => {
      const updated = prev.map(t => {
        if (!t.alive) return t;
        const dist = t.position.length();
        if (dist < 1.8) {
          onMiss();
          return { ...t, alive: false };
        }
        return t;
      }).filter(t => t.alive || t.position.length() > 0.1);
      return updated;
    });

    setLasers(prev => prev.map(l => ({ ...l, opacity: l.opacity - delta * 3 })).filter(l => l.opacity > 0));
  });

  const handleThreatClick = (t: Threat) => {
    if (!t.alive || gameOver) return;
    const laser: LaserBeam = {
      id: laserNextId.current++,
      from: new THREE.Vector3(0, 0, 0),
      to: t.position.clone(),
      opacity: 1,
    };
    setLasers(prev => [...prev, laser]);
    setThreats(prev => prev.map(th => th.id === t.id ? { ...th, alive: false } : th));
    onHit(t.threat);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#4FC3F7" />
      <Stars radius={80} depth={40} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <Earth />
      <ShieldRing />
      {threats.map(t => <ThreatMesh key={t.id} threat={t} onClick={handleThreatClick} />)}
      {lasers.map(l => <LaserBeamMesh key={l.id} beam={l} />)}
    </>
  );
}

export default function PlanetDefense() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [lastHit, setLastHit] = useState<typeof SDG_THREATS[0] | null>(null);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const factTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const onHit = (t: typeof SDG_THREATS[0]) => {
    setScore(s => s + 10);
    setLastHit(t);
    if (factTimer.current) clearTimeout(factTimer.current);
    factTimer.current = setTimeout(() => setLastHit(null), 3000);
  };

  const onMiss = () => {
    setLives(l => {
      if (l <= 1) { setGameOver(true); return 0; }
      return l - 1;
    });
  };

  const reset = () => { setScore(0); setLives(5); setLastHit(null); setGameOver(false); setStarted(true); };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 text-center bg-gray-950 rounded-2xl text-white p-8">
        <div className="text-6xl">🌍</div>
        <h2 className="text-2xl font-bold">Planet Defense</h2>
        <p className="text-gray-300 max-w-xs">Earth is under attack from pollution, deforestation, and climate threats! Click the threats before they reach Earth to neutralize them.</p>
        <div className="flex gap-4 text-sm text-gray-400">
          <span>🖱️ Click threats to destroy</span>
          <span>❤️ 5 lives</span>
        </div>
        <Button onClick={() => setStarted(true)} className="bg-green-600 hover:bg-green-500 text-white px-8">Launch Defense</Button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 text-center bg-gray-950 rounded-2xl text-white p-8">
        <div className="text-6xl">💥</div>
        <h2 className="text-2xl font-bold">Earth Needs You!</h2>
        <p className="text-gray-300">The planet was overwhelmed by threats. Keep learning and fighting for sustainability!</p>
        <div className="text-4xl font-bold text-green-400">{score} pts</div>
        <Button onClick={reset} className="bg-green-600 hover:bg-green-500 gap-2"><RefreshCw className="w-4 h-4" />Try Again</Button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-3">
        <Badge className="bg-black/80 text-white border-green-500 border gap-1.5 text-sm px-3">
          <Zap className="w-3.5 h-3.5 text-green-400" />{score} pts
        </Badge>
        <Badge className="bg-black/80 text-white border-red-500 border gap-1.5 text-sm px-3">
          {Array.from({ length: lives }).map((_, i) => <Heart key={i} className="w-3.5 h-3.5 text-red-400 fill-red-400 inline" />)}
        </Badge>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-black/80 text-gray-300 border-gray-600 border text-xs">Click threats to shoot!</Badge>
      </div>

      {lastHit && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-green-900/90 border border-green-500 text-white rounded-xl px-4 py-3 max-w-xs text-center text-sm shadow-xl">
          <div className="font-bold text-green-400 mb-1">✅ SDG {lastHit.sdg} — {lastHit.label} neutralized!</div>
          <div className="text-gray-300 text-xs">{lastHit.fact}</div>
        </div>
      )}

      <Canvas style={{ height: 480, background: "#060612" }}>
        <Scene onHit={onHit} onMiss={onMiss} gameOver={gameOver} />
      </Canvas>
    </div>
  );
}
