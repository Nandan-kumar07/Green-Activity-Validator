import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, ChevronLeft, Star, Zap, Trophy } from "lucide-react";

/* ───────────────────────────── SDG CONFIG ───────────────────────────── */
const SDGS = [
  { id: 1,  color: "#E5243B", emoji: "🚫", title: "No Poverty",          game: "distribute", fact: "736 million people live in extreme poverty." },
  { id: 2,  color: "#DDA63A", emoji: "🌾", title: "Zero Hunger",         game: "harvest",    fact: "821 million people go to bed hungry every night." },
  { id: 3,  color: "#4C9F38", emoji: "💚", title: "Good Health",         game: "defend",     fact: "Air pollution kills 7 million people per year." },
  { id: 4,  color: "#C5192D", emoji: "📚", title: "Quality Education",   game: "memory",     fact: "617 million children lack basic literacy." },
  { id: 5,  color: "#FF3A21", emoji: "⚧️", title: "Gender Equality",     game: "balance",    fact: "Women earn 20% less than men globally." },
  { id: 6,  color: "#26BDE2", emoji: "💧", title: "Clean Water",         game: "pipes",      fact: "2.2 billion people lack safe drinking water." },
  { id: 7,  color: "#FCC30B", emoji: "⚡", title: "Clean Energy",        game: "power",      fact: "759 million people lack electricity access." },
  { id: 8,  color: "#A21942", emoji: "💼", title: "Decent Work",         game: "match",      fact: "190 million people are unemployed globally." },
  { id: 9,  color: "#FD6925", emoji: "🏭", title: "Industry & Innovation",game: "connect",   fact: "2.6 billion lack basic sanitation infrastructure." },
  { id: 10, color: "#DD1367", emoji: "⚖️", title: "Reduced Inequalities",game: "distribute", fact: "26 richest own as much as poorest 50%." },
  { id: 11, color: "#FD9D24", emoji: "🏙️", title: "Sustainable Cities",  game: "build",      fact: "55% of the world population lives in cities." },
  { id: 12, color: "#BF8B2E", emoji: "♻️", title: "Responsible Consumption",game:"sort",    fact: "Only 9% of plastic waste is ever recycled." },
  { id: 13, color: "#3F7E44", emoji: "🌡️", title: "Climate Action",      game: "plant",      fact: "CO₂ is at its highest in 3 million years." },
  { id: 14, color: "#0A97D9", emoji: "🐠", title: "Life Below Water",    game: "cleanup",    fact: "8 million tonnes of plastic enter oceans annually." },
  { id: 15, color: "#56C02B", emoji: "🌳", title: "Life on Land",        game: "forest",     fact: "13 million hectares of forests lost annually." },
  { id: 16, color: "#00689D", emoji: "☮️", title: "Peace & Justice",     game: "mediate",    fact: "1 billion people live in fragile, conflict-affected states." },
  { id: 17, color: "#19486A", emoji: "🤝", title: "Partnerships",        game: "connect",    fact: "SDGs need $4 trillion/year in additional investment." },
];

/* ───────────────────────────── CANVAS CLICK GAME ───────────────────────────── */
type ClickItem = { id: number; x: number; y: number; r: number; emoji: string; alive: boolean; opacity: number };

function useClickGame(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: { emoji: string; spawnInterval: number; lifetime: number; goal: number; bg: string; bgEmoji: string; title: string; instruction: string }
) {
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const items = useRef<ClickItem[]>([]);
  const nextId = useRef(0);
  const rafId = useRef(0);
  const spawnTimer = useRef(0);
  const lastTime = useRef(0);

  const drawFrame = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dt = Math.min((ts - lastTime.current) / 1000, 0.1);
    lastTime.current = ts;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = config.bg + "22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    spawnTimer.current += dt;
    if (spawnTimer.current > config.spawnInterval) {
      spawnTimer.current = 0;
      const margin = 40;
      items.current.push({
        id: nextId.current++,
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        r: 28 + Math.random() * 10,
        emoji: config.emoji,
        alive: true,
        opacity: 1,
      });
    }

    items.current = items.current.map(item => ({ ...item, opacity: item.opacity - dt / config.lifetime }))
      .filter(item => item.opacity > 0);

    for (const item of items.current) {
      ctx.save();
      ctx.globalAlpha = item.opacity;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = config.bg;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.font = `${item.r}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.emoji, item.x, item.y);
      ctx.restore();
    }

    rafId.current = requestAnimationFrame(drawFrame);
  }, [canvasRef, config]);

  const start = useCallback(() => {
    setScore(0); setDone(false); setStarted(true);
    items.current = []; nextId.current = 0; spawnTimer.current = 0; lastTime.current = 0;
    rafId.current = requestAnimationFrame(drawFrame);
  }, [drawFrame]);

  useEffect(() => () => { if (rafId.current) cancelAnimationFrame(rafId.current); }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX, my = (e.clientY - rect.top) * scaleY;
    let hit = false;
    items.current = items.current.map(item => {
      if (!hit && Math.hypot(item.x - mx, item.y - my) < item.r + 10) {
        hit = true;
        setScore(s => {
          const ns = s + 1;
          if (ns >= config.goal) { setDone(true); cancelAnimationFrame(rafId.current); }
          return ns;
        });
        return { ...item, alive: false, opacity: 0 };
      }
      return item;
    }).filter(i => i.opacity > 0);
  }, [canvasRef, config.goal]);

  return { score, done, started, start, handleClick };
}

/* ───────────────────────────── INDIVIDUAL MINI GAME COMPONENTS ───────────────────────────── */

function ClickGame({ sdg, goal = 15 }: { sdg: typeof SDGS[0]; goal?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configs: Record<string, { spawnInterval: number; lifetime: number; instruction: string }> = {
    harvest:  { spawnInterval: 0.9,  lifetime: 3.5, instruction: "Click crops before they wilt!" },
    defend:   { spawnInterval: 0.7,  lifetime: 2.5, instruction: "Click virus bubbles to stop infections!" },
    cleanup:  { spawnInterval: 0.8,  lifetime: 3.0, instruction: "Click ocean trash before it sinks!" },
    forest:   { spawnInterval: 1.0,  lifetime: 4.0, instruction: "Click bare patches to plant trees!" },
    mediate:  { spawnInterval: 1.1,  lifetime: 3.5, instruction: "Click conflict zones to bring peace!" },
    plant:    { spawnInterval: 1.0,  lifetime: 4.0, instruction: "Click to plant trees and reduce CO₂!" },
  };
  const cfg = configs[sdg.game] ?? { spawnInterval: 1.0, lifetime: 3.5, instruction: "Click to help!" };

  const { score, done, started, start, handleClick } = useClickGame(canvasRef, {
    emoji: sdg.emoji, bg: sdg.color, bgEmoji: sdg.emoji,
    title: sdg.title, goal,
    spawnInterval: cfg.spawnInterval, lifetime: cfg.lifetime, instruction: cfg.instruction,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{cfg.instruction}</p>
        <Badge style={{ backgroundColor: sdg.color }} className="text-white">{score}/{goal}</Badge>
      </div>
      <Progress value={(score / goal) * 100} className="h-2" />
      <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: sdg.color + "66" }}>
        <canvas ref={canvasRef} width={600} height={320} className="w-full cursor-pointer"
          style={{ background: sdg.color + "11" }} onClick={handleClick} />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center p-4 gap-4">
            <div className="text-6xl">{sdg.emoji}</div>
            <p className="font-bold text-lg">{cfg.instruction}</p>
            <Button onClick={start} style={{ backgroundColor: sdg.color }} className="text-white">Start Game</Button>
          </div>
        )}
        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white text-center p-4 gap-3">
            <div className="text-5xl">🏆</div>
            <p className="font-bold text-xl">Mission Complete!</p>
            <p className="text-sm opacity-80">You helped SDG {sdg.id}!</p>
            <Button onClick={start} variant="outline" className="text-white border-white gap-2"><RefreshCw className="w-4 h-4" />Play Again</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryGame({ sdg }: { sdg: typeof SDGS[0] }) {
  const PAIRS = [
    { q: "SDG 13", a: "Climate Action" }, { q: "SDG 6", a: "Clean Water" },
    { q: "SDG 4", a: "Education" }, { q: "SDG 7", a: "Clean Energy" },
    { q: "SDG 15", a: "Life on Land" }, { q: "SDG 2", a: "Zero Hunger" },
  ];
  const [cards] = useState(() => {
    const all = PAIRS.flatMap(p => [
      { id: Math.random(), text: p.q, pairKey: p.q + p.a, type: "q" },
      { id: Math.random(), text: p.a, pairKey: p.q + p.a, type: "a" },
    ]);
    return all.sort(() => Math.random() - 0.5);
  });
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const flip = (idx: number) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(cards[idx].pairKey)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      if (cards[next[0]].pairKey === cards[next[1]].pairKey) {
        const nm = [...matched, cards[next[0]].pairKey];
        setMatched(nm);
        if (nm.length === PAIRS.length) setDone(true);
        setTimeout(() => setFlipped([]), 300);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Match the SDG numbers to their names!</span>
        <div className="flex gap-3"><Badge variant="outline">{matched.length}/{PAIRS.length} matched</Badge><Badge variant="secondary">{moves} moves</Badge></div>
      </div>
      {done && <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 font-bold">🏆 All matched! {moves} moves!</div>}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx);
          const isMatched = matched.includes(card.pairKey);
          return (
            <button key={card.id} onClick={() => flip(idx)}
              className={`h-16 rounded-xl font-medium text-sm transition-all border-2 ${isMatched ? "border-green-400 bg-green-50 text-green-700" : isFlipped ? "text-white border-transparent" : "border-muted bg-muted text-transparent hover:border-gray-300"}`}
              style={isFlipped && !isMatched ? { backgroundColor: sdg.color } : {}}
            >
              {(isFlipped || isMatched) ? card.text : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SortSDGGame({ sdg }: { sdg: typeof SDGS[0] }) {
  const ITEMS = [
    { text: "Plastic bottle", cat: "Recycle" }, { text: "Apple core", cat: "Compost" },
    { text: "Old phone", cat: "E-waste" }, { text: "Newspaper", cat: "Recycle" },
    { text: "Food scraps", cat: "Compost" }, { text: "Battery", cat: "E-waste" },
    { text: "Glass jar", cat: "Recycle" }, { text: "Grass clippings", cat: "Compost" },
    { text: "Broken cable", cat: "E-waste" }, { text: "Cardboard", cat: "Recycle" },
  ];
  const [items] = useState(() => [...ITEMS].sort(() => Math.random() - 0.5));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pick = (cat: string) => {
    if (chosen) return;
    setChosen(cat);
    const correct = cat === items[current].cat;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      const next = current + 1;
      if (next >= items.length) setDone(true);
      else { setCurrent(next); setChosen(null); }
    }, 800);
  };

  if (done) return (
    <div className="text-center py-8 space-y-4">
      <div className="text-5xl">♻️</div>
      <h3 className="text-xl font-bold">{score}/{items.length} correct!</h3>
      <p className="text-sm text-muted-foreground">Great job sorting! SDG 12 is about responsible consumption.</p>
    </div>
  );

  const item = items[current];
  return (
    <div className="space-y-5">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Sort the item into the correct bin</span>
        <Badge variant="outline">{current + 1}/{items.length}</Badge>
      </div>
      <Progress value={(current / items.length) * 100} className="h-2" />
      <div className="text-center py-8 bg-muted/30 rounded-xl">
        <div className="text-5xl mb-3">🗑️</div>
        <p className="text-xl font-bold">{item.text}</p>
        <p className="text-sm text-muted-foreground mt-1">Where does this go?</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["Recycle", "Compost", "E-waste"].map(cat => {
          let cls = "flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-medium text-sm transition-all cursor-pointer ";
          if (chosen === cat) cls += item.cat === cat ? "border-green-500 bg-green-50 text-green-700 scale-105" : "border-red-400 bg-red-50 text-red-600 opacity-70";
          else if (chosen) cls += "opacity-40 cursor-default border-muted";
          else cls += "border-muted hover:scale-105 hover:shadow-md hover:border-primary";
          const icons: Record<string, string> = { Recycle: "♻️", Compost: "🌱", "E-waste": "⚡" };
          return (
            <button key={cat} className={cls} onClick={() => pick(cat)} disabled={!!chosen}>
              <span className="text-3xl">{icons[cat]}</span>{cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PowerGame({ sdg }: { sdg: typeof SDGS[0] }) {
  const COLS = 5, ROWS = 3;
  const [grid, setGrid] = useState(() => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "coal")));
  const total = COLS * ROWS;
  const solar = grid.flat().filter(c => c === "solar").length;
  const pct = Math.round((solar / total) * 100);
  const done = solar === total;

  const toggle = (r: number, c: number) => {
    setGrid(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? (cell === "coal" ? "solar" : "coal") : cell)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Click coal plants to switch them to solar! ☀️</span>
        <Badge style={{ backgroundColor: sdg.color }} className="text-white">{pct}% clean</Badge>
      </div>
      <Progress value={pct} className="h-3" />
      {done && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center text-yellow-700 font-bold">🌟 100% Clean Energy City!</div>}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => toggle(r, c)}
            className={`aspect-square rounded-xl text-3xl flex items-center justify-center border-2 transition-all hover:scale-105 ${cell === "solar" ? "bg-yellow-50 border-yellow-400" : "bg-gray-100 border-gray-300"}`}>
            {cell === "solar" ? "☀️" : "🏭"}
          </button>
        )))}
      </div>
    </div>
  );
}

function BalanceGame({ sdg }: { sdg: typeof SDGS[0] }) {
  const ITEMS = ["Education 📚", "Jobs 💼", "Healthcare 💊", "Safety 🛡️", "Vote 🗳️", "Pay 💰", "Land 🌍", "Justice ⚖️"];
  const [left, setLeft] = useState<string[]>([]);
  const [right, setRight] = useState<string[]>([]);
  const [pool, setPool] = useState(ITEMS);
  const [selected, setSelected] = useState<string | null>(null);
  const balanced = left.length === right.length && left.length > 0;
  const done = pool.length === 0 && balanced;

  const placeItem = (side: "left" | "right") => {
    if (!selected) return;
    if (side === "left") setLeft(prev => [...prev, selected]);
    else setRight(prev => [...prev, selected]);
    setPool(prev => prev.filter(i => i !== selected));
    setSelected(null);
  };

  const tilt = left.length - right.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Distribute opportunities equally between both sides!</p>
      <div className="flex items-end justify-center gap-6 h-40">
        <button onClick={() => placeItem("left")}
          className={`w-28 min-h-20 rounded-xl border-2 p-2 flex flex-col gap-1 items-center transition-all ${selected ? "border-primary cursor-pointer hover:bg-primary/5" : "border-muted"}`}
          style={{ transform: `rotate(${Math.min(tilt * 5, 20)}deg)`, background: "#f0fdf4" }}>
          <p className="text-xs font-bold text-green-700">Women 👩</p>
          {left.map((item, i) => <span key={i} className="text-xs">{item}</span>)}
        </button>
        <div className="flex flex-col items-center">
          <div className="w-1 h-16 bg-gray-400 rounded" />
          <div className={`text-2xl ${balanced ? "text-green-500" : "text-gray-400"}`}>⚖️</div>
        </div>
        <button onClick={() => placeItem("right")}
          className={`w-28 min-h-20 rounded-xl border-2 p-2 flex flex-col gap-1 items-center transition-all ${selected ? "border-primary cursor-pointer hover:bg-primary/5" : "border-muted"}`}
          style={{ transform: `rotate(${Math.min(-tilt * 5, 20)}deg)`, background: "#eff6ff" }}>
          <p className="text-xs font-bold text-blue-700">Men 👨</p>
          {right.map((item, i) => <span key={i} className="text-xs">{item}</span>)}
        </button>
      </div>
      {done ? (
        <div className="text-center py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-bold">🏆 Perfect Balance! SDG 5 Achieved!</div>
      ) : (
        <div className="flex flex-wrap gap-2 justify-center">
          {pool.map(item => (
            <button key={item} onClick={() => setSelected(item === selected ? null : item)}
              className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${selected === item ? "border-primary bg-primary/10 text-primary scale-105" : "border-muted hover:border-gray-400"}`}>
              {item}
            </button>
          ))}
        </div>
      )}
      {selected && <p className="text-xs text-center text-muted-foreground">Click a side of the scale to place: <strong>{selected}</strong></p>}
    </div>
  );
}

function ConnectGame({ sdg }: { sdg: typeof SDGS[0] }) {
  const NODES = [
    { id: 0, x: 80,  y: 80,  label: sdg.id === 17 ? "🇺🇳 UN" : "🏭 Factory", connected: false },
    { id: 1, x: 240, y: 50,  label: sdg.id === 17 ? "🌍 Africa" : "♻️ Recycling", connected: false },
    { id: 2, x: 400, y: 80,  label: sdg.id === 17 ? "🌏 Asia" : "🌱 Green Tech", connected: false },
    { id: 3, x: 100, y: 200, label: sdg.id === 17 ? "🌎 Americas" : "☀️ Solar", connected: false },
    { id: 4, x: 280, y: 220, label: sdg.id === 17 ? "🇪🇺 Europe" : "💧 Clean Water", connected: false },
    { id: 5, x: 420, y: 190, label: sdg.id === 17 ? "🌐 Oceania" : "🏥 Health", connected: false },
  ];
  const TARGET_CONNECTIONS = [[0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [2, 5]];
  const [connections, setConnections] = useState<[number, number][]>([]);
  const [from, setFrom] = useState<number | null>(null);
  const done = connections.length >= TARGET_CONNECTIONS.length;

  const handleNodeClick = (id: number) => {
    if (from === null) { setFrom(id); return; }
    if (from === id) { setFrom(null); return; }
    const exists = connections.some(([a, b]) => (a === from && b === id) || (a === id && b === from));
    if (!exists) setConnections(prev => [...prev, [from, id]]);
    setFrom(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {sdg.id === 17 ? "Click two regions to build global partnerships!" : "Click nodes to connect green innovations!"}
      </p>
      <div className="relative rounded-xl border-2 border-dashed overflow-hidden" style={{ height: 280, borderColor: sdg.color + "44", background: sdg.color + "08" }}>
        <svg className="absolute inset-0 w-full h-full" style={{ width: 500, height: 280 }}>
          {connections.map(([a, b], i) => (
            <line key={i}
              x1={NODES[a].x} y1={NODES[a].y}
              x2={NODES[b].x} y2={NODES[b].y}
              stroke={sdg.color} strokeWidth="2" opacity="0.7" />
          ))}
          {from !== null && (
            <circle cx={NODES[from].x} cy={NODES[from].y} r="35" fill="none" stroke={sdg.color} strokeWidth="2" strokeDasharray="5,3" />
          )}
        </svg>
        {NODES.map(node => (
          <button key={node.id} onClick={() => handleNodeClick(node.id)}
            style={{ left: node.x - 32, top: node.y - 22, borderColor: from === node.id ? sdg.color : "" }}
            className={`absolute w-16 h-10 rounded-lg text-xs font-bold flex items-center justify-center border-2 transition-all hover:scale-110 bg-white shadow ${from === node.id ? "scale-110 shadow-lg" : ""}`}>
            {node.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{connections.length} connections made</span>
        {done && <Badge className="bg-green-100 text-green-700 border-green-300 border">🏆 Network built!</Badge>}
      </div>
    </div>
  );
}

function DistributeGame({ sdg }: { sdg: typeof SDGS[0] }) {
  const COUNT = 5;
  const TOTAL = 20;
  const [dist, setDist] = useState<number[]>(Array(COUNT).fill(0));
  const [pool, setPool] = useState(TOTAL);
  const labels = sdg.id === 1
    ? ["Family A 🏚️", "Family B 🏠", "Family C 🏘️", "Family D 🏗️", "Family E 🏡"]
    : ["Region 1 🌍", "Region 2 🌏", "Region 3 🌎", "Region 4 🗺️", "Region 5 🌐"];
  const give = (i: number) => {
    if (pool <= 0) return;
    setDist(prev => { const n = [...prev]; n[i]++; return n; });
    setPool(p => p - 1);
  };
  const even = dist.every(d => d === dist[0]) && pool === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Distribute resources equally! Click to give {sdg.id === 1 ? "💰" : "🎯"}</span>
        <Badge style={{ backgroundColor: sdg.color }} className="text-white">Pool: {pool}</Badge>
      </div>
      <div className="space-y-2">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm w-28 shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div className="h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-bold transition-all"
                style={{ width: `${(dist[i] / TOTAL) * 100}%`, backgroundColor: sdg.color, minWidth: dist[i] > 0 ? "1.5rem" : 0 }}>
                {dist[i] > 0 && dist[i]}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => give(i)} disabled={pool === 0} className="shrink-0 w-10 h-8 text-base">
              {sdg.id === 1 ? "💰" : "🎯"}
            </Button>
          </div>
        ))}
      </div>
      {even && pool === 0 && <div className="text-center py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 font-bold">🏆 Equal Distribution! SDG {sdg.id} achieved!</div>}
      {pool === 0 && !even && <div className="text-center py-2 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm">Some have more than others — true equality matters!</div>}
    </div>
  );
}

function BuildCityGame({ sdg }: { sdg: typeof SDGS[0] }) {
  const COLS = 6, ROWS = 4;
  const types = ["🏭", "☀️", "🌳", "🚶", "🏥", "♻️"];
  const good = new Set(["☀️", "🌳", "🚶", "🏥", "♻️"]);
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "🏭"))
  );
  const [selected, setSelected] = useState("☀️");
  const score = grid.flat().filter(c => good.has(c)).length;
  const total = COLS * ROWS;

  const place = (r: number, c: number) => {
    setGrid(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? selected : cell)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Replace factories with eco-friendly buildings!</span>
        <Badge style={{ backgroundColor: sdg.color }} className="text-white">{Math.round((score / total) * 100)}% eco</Badge>
      </div>
      <Progress value={(score / total) * 100} className="h-2" />
      <div className="flex gap-2 flex-wrap">
        {types.slice(1).map(t => (
          <button key={t} onClick={() => setSelected(t)}
            className={`w-10 h-10 rounded-lg border-2 text-xl ${selected === t ? "border-primary scale-110" : "border-muted hover:border-gray-400"}`}>{t}</button>
        ))}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => place(r, c)}
            className={`aspect-square rounded text-xl flex items-center justify-center border transition-all hover:scale-105 ${good.has(cell) ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            {cell}
          </button>
        )))}
      </div>
      {score === total && <div className="text-center py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 font-bold">🏆 Sustainable City Built!</div>}
    </div>
  );
}

function MatchGame({ sdg }: { sdg: typeof SDGS[0] }) {
  const PAIRS = [
    { skill: "💻 Coding", job: "Tech Engineer", wage: "Fair" },
    { skill: "🌱 Farming", job: "Eco Farmer", wage: "Fair" },
    { skill: "📊 Data", job: "Analyst", wage: "Fair" },
    { skill: "🔬 Science", job: "Researcher", wage: "Fair" },
    { skill: "🎨 Design", job: "UX Designer", wage: "Fair" },
  ];
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const allMatched = Object.keys(matches).length === PAIRS.length;

  const handleSkill = (skill: string) => setSelected(skill);
  const handleJob = (job: string) => {
    if (!selected) return;
    setMatches(prev => ({ ...prev, [selected]: job }));
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Match skills to fair jobs! Click a skill, then click a job.</p>
      {allMatched && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-green-700 font-bold">🏆 All workers placed in decent jobs!</div>}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Skills</p>
          {PAIRS.map(p => {
            const isMatched = Object.keys(matches).includes(p.skill);
            return (
              <button key={p.skill} onClick={() => !isMatched && handleSkill(p.skill)}
                className={`w-full p-2.5 rounded-lg border-2 text-sm font-medium text-left transition-all ${isMatched ? "border-green-400 bg-green-50 opacity-60" : selected === p.skill ? "border-primary bg-primary/10 scale-105" : "border-muted hover:border-gray-400"}`}>
                {p.skill}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Jobs</p>
          {PAIRS.map(p => {
            const isMatched = Object.values(matches).includes(p.job);
            return (
              <button key={p.job} onClick={() => !isMatched && handleJob(p.job)}
                className={`w-full p-2.5 rounded-lg border-2 text-sm font-medium text-left transition-all ${isMatched ? "border-green-400 bg-green-50 opacity-60" : selected ? "border-primary/40 hover:border-primary hover:bg-primary/5 cursor-pointer" : "border-muted"}`}>
                {p.job}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── GAME ROUTER ───────────────────────────── */
function SDGGame({ sdg, onBack }: { sdg: typeof SDGS[0]; onBack: () => void }) {
  const gameComponents: Record<string, React.ReactNode> = {
    harvest:  <ClickGame sdg={sdg} goal={12} />,
    defend:   <ClickGame sdg={sdg} goal={15} />,
    cleanup:  <ClickGame sdg={sdg} goal={12} />,
    forest:   <ClickGame sdg={sdg} goal={10} />,
    mediate:  <ClickGame sdg={sdg} goal={10} />,
    plant:    <ClickGame sdg={sdg} goal={12} />,
    memory:   <MemoryGame sdg={sdg} />,
    sort:     <SortSDGGame sdg={sdg} />,
    power:    <PowerGame sdg={sdg} />,
    balance:  <BalanceGame sdg={sdg} />,
    connect:  <ConnectGame sdg={sdg} />,
    distribute:<DistributeGame sdg={sdg} />,
    build:    <BuildCityGame sdg={sdg} />,
    match:    <MatchGame sdg={sdg} />,
    pipes:    <ConnectGame sdg={sdg} />,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="w-5 h-5" /></Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: sdg.color }}>
            {sdg.emoji}
          </div>
          <div>
            <h2 className="font-bold text-lg">SDG {sdg.id}: {sdg.title}</h2>
            <p className="text-xs text-muted-foreground">Learn while you play!</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          {gameComponents[sdg.game] ?? <ClickGame sdg={sdg} />}
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
        <div className="text-2xl shrink-0">💡</div>
        <div>
          <p className="font-semibold text-sm">Did you know?</p>
          <p className="text-sm text-muted-foreground">{sdg.fact}</p>
          <p className="text-xs text-muted-foreground mt-1">SDG {sdg.id} addresses this challenge directly.</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── MAIN PAGE ───────────────────────────── */
export default function SDGGamesPage() {
  const [activeSDG, setActiveSDG] = useState<typeof SDGS[0] | null>(null);

  if (activeSDG) return <SDGGame sdg={activeSDG} onBack={() => setActiveSDG(null)} />;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <span className="text-4xl">🌍</span> SDG Learning Games
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Play interactive mini-games for each of the 17 UN Sustainable Development Goals. Learn by doing!
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" />17 SDG Games</span>
          <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-blue-500" />7 Game Types</span>
          <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-green-500" />Educational</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {SDGS.map(sdg => (
          <button
            key={sdg.id}
            onClick={() => setActiveSDG(sdg)}
            className="group rounded-2xl p-4 text-white flex flex-col items-center gap-2 transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 min-h-[110px]"
            style={{ backgroundColor: sdg.color }}
          >
            <span className="text-3xl">{sdg.emoji}</span>
            <span className="text-xs font-bold leading-tight text-center">{sdg.id}. {sdg.title}</span>
            <Badge className="bg-white/20 text-white text-xs border-0 group-hover:bg-white/40">Play →</Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
