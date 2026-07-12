import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Info } from "lucide-react";

const COLS = 12;
const ROWS = 8;
const CELL = 52;

type BuildingType = "empty" | "grass" | "tree" | "solar" | "wind" | "recycle" | "farm" | "water" | "house" | "road" | "factory" | "park";

type Building = {
  type: BuildingType;
  emoji: string;
  label: string;
  color: string;
  sdgImpact: Partial<Record<number, number>>;
  cost: number;
};

const BUILDINGS: Record<BuildingType, Building> = {
  empty:   { type: "empty",   emoji: "🟫", label: "Empty",          color: "#c8a96e", sdgImpact: {},                                      cost: 0  },
  grass:   { type: "grass",   emoji: "🟩", label: "Grass",          color: "#5cb85c", sdgImpact: { 15: 2 },                               cost: 5  },
  tree:    { type: "tree",    emoji: "🌳", label: "Tree",           color: "#2d7a2d", sdgImpact: { 13: 5, 15: 8, 3: 3 },                  cost: 20 },
  solar:   { type: "solar",   emoji: "☀️", label: "Solar Panel",    color: "#f5c518", sdgImpact: { 7: 10, 13: 8, 9: 4 },                  cost: 40 },
  wind:    { type: "wind",    emoji: "💨", label: "Wind Turbine",   color: "#b0d0e8", sdgImpact: { 7: 12, 13: 9, 9: 5 },                  cost: 45 },
  recycle: { type: "recycle", emoji: "♻️", label: "Recycle Center", color: "#00aabb", sdgImpact: { 12: 12, 14: 6, 11: 4 },                cost: 35 },
  farm:    { type: "farm",    emoji: "🌾", label: "Eco Farm",       color: "#c8e06c", sdgImpact: { 2: 10, 12: 5, 15: 4 },                 cost: 30 },
  water:   { type: "water",   emoji: "💧", label: "Water Plant",    color: "#1e90ff", sdgImpact: { 6: 15, 3: 5, 11: 3 },                  cost: 50 },
  house:   { type: "house",   emoji: "🏠", label: "Green House",    color: "#d4a456", sdgImpact: { 11: 6, 1: 4, 3: 3 },                   cost: 25 },
  road:    { type: "road",    emoji: "🛣️", label: "Road",           color: "#888888", sdgImpact: { 9: 2, 11: 3 },                         cost: 10 },
  factory: { type: "factory", emoji: "🏭", label: "Factory (Bad!)", color: "#cc4444", sdgImpact: { 13: -10, 3: -8, 15: -6, 12: -8 },      cost: 0  },
  park:    { type: "park",    emoji: "🌳", label: "City Park",      color: "#3db84e", sdgImpact: { 11: 8, 3: 6, 15: 4, 13: 3 },           cost: 30 },
};

const SDG_GOALS: Record<number, { label: string; color: string; emoji: string }> = {
  2:  { label: "Zero Hunger",      color: "#DDA63A", emoji: "🌾" },
  3:  { label: "Good Health",      color: "#4C9F38", emoji: "💚" },
  6:  { label: "Clean Water",      color: "#26BDE2", emoji: "💧" },
  7:  { label: "Clean Energy",     color: "#FCC30B", emoji: "⚡" },
  9:  { label: "Innovation",       color: "#FD6925", emoji: "🏭" },
  11: { label: "Sustainable City", color: "#FD9D24", emoji: "🏙️" },
  12: { label: "Responsible Cons.", color: "#BF8B2E", emoji: "♻️" },
  13: { label: "Climate Action",   color: "#3F7E44", emoji: "🌡️" },
  14: { label: "Life Below Water", color: "#0A97D9", emoji: "🐠" },
  15: { label: "Life on Land",     color: "#56C02B", emoji: "🌳" },
  1:  { label: "No Poverty",       color: "#E5243B", emoji: "🚫" },
};

const PALETTE: BuildingType[] = ["tree", "solar", "wind", "recycle", "farm", "water", "house", "park", "road", "grass"];

function makeInitialGrid(): BuildingType[][] {
  const grid: BuildingType[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (r === 0 || r === ROWS - 1) return "empty";
      if (c === 0 || c === COLS - 1) return "empty";
      if (r === 3 && c >= 2 && c <= 9) return "factory";
      if (r === 5 && c >= 2 && c <= 9) return "factory";
      return "empty";
    })
  );
  return grid;
}

function computeSDGScores(grid: BuildingType[][]): Record<number, number> {
  const scores: Record<number, number> = {};
  Object.keys(SDG_GOALS).forEach(k => { scores[Number(k)] = 0; });
  grid.forEach(row => row.forEach(cell => {
    const b = BUILDINGS[cell];
    Object.entries(b.sdgImpact).forEach(([sdg, val]) => {
      scores[Number(sdg)] = (scores[Number(sdg)] || 0) + (val as number);
    });
  }));
  Object.keys(scores).forEach(k => {
    scores[Number(k)] = Math.max(0, Math.min(100, scores[Number(k)]));
  });
  return scores;
}

export default function EcoCityBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<BuildingType[][]>(makeInitialGrid);
  const [selected, setSelected] = useState<BuildingType>("tree");
  const [budget, setBudget] = useState(500);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);

  const sdgScores = useMemo(() => computeSDGScores(grid), [grid]);
  const overallScore = useMemo(() => {
    const vals = Object.values(sdgScores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [sdgScores]);

  useEffect(() => {
    if (overallScore >= 60 && !won) setWon(true);
  }, [overallScore, won]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const type = grid[r][c];
        const b = BUILDINGS[type];
        const isHover = hover?.r === r && hover?.c === c;
        ctx.fillStyle = isHover ? "#fff3" : b.color + "cc";
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = isHover ? "#ffffff" : "#33333366";
        ctx.lineWidth = isHover ? 2 : 1;
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.font = `${CELL * 0.52}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.emoji, x + CELL / 2, y + CELL / 2);
      }
    }
  }, [grid, hover]);

  useEffect(() => { draw(); }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = (COLS * CELL) / rect.width;
    const scaleY = (ROWS * CELL) / rect.height;
    const c = Math.floor((e.clientX - rect.left) * scaleX / CELL);
    const r = Math.floor((e.clientY - rect.top) * scaleY / CELL);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    const current = grid[r][c];
    if (current === selected) return;
    const cost = BUILDINGS[selected].cost;
    if (budget < cost) { setTooltip(`Not enough budget! Need $${cost}`); setTimeout(() => setTooltip(null), 2000); return; }
    setBudget(b => b - cost + (current !== "empty" ? Math.floor(BUILDINGS[current].cost * 0.5) : 0));
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = selected;
      return next;
    });
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = (COLS * CELL) / rect.width;
    const scaleY = (ROWS * CELL) / rect.height;
    const c = Math.floor((e.clientX - rect.left) * scaleX / CELL);
    const r = Math.floor((e.clientY - rect.top) * scaleY / CELL);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) setHover({ r, c });
    else setHover(null);
  };

  const reset = () => { setGrid(makeInitialGrid()); setBudget(500); setWon(false); setStarted(true); };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-center bg-green-950 rounded-2xl text-white p-8" style={{ minHeight: 400 }}>
        <div className="text-6xl">🏙️</div>
        <h2 className="text-2xl font-bold">Eco City Builder</h2>
        <p className="text-green-200 max-w-sm">Your city is full of factories and pollution! Replace them with eco-friendly buildings to raise your SDG scores. Reach an overall score of 60+ to save the city!</p>
        <div className="grid grid-cols-2 gap-3 text-sm text-green-300 max-w-xs">
          <span>🌳 Trees → Climate Action</span>
          <span>☀️ Solar → Clean Energy</span>
          <span>♻️ Recycle → SDG 12</span>
          <span>💧 Water → SDG 6</span>
        </div>
        <Button onClick={() => setStarted(true)} className="bg-green-600 hover:bg-green-500 text-white px-8">Build Your City</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-700 text-white text-sm px-3">💰 Budget: ${budget}</Badge>
          <Badge className={`text-sm px-3 ${overallScore >= 60 ? "bg-green-500" : "bg-orange-500"} text-white`}>
            🌍 SDG Score: {overallScore}/100
          </Badge>
          {won && <Badge className="bg-yellow-500 text-black text-sm px-3 animate-bounce">🏆 City Saved!</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="gap-2"><RefreshCw className="w-4 h-4" />Reset</Button>
      </div>

      {tooltip && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm font-medium">{tooltip}</div>
      )}

      <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-xl">
        {PALETTE.map(bType => {
          const b = BUILDINGS[bType];
          return (
            <button
              key={bType}
              onClick={() => setSelected(bType)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${selected === bType ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-white hover:border-gray-300"}`}
              title={`${b.label} - $${b.cost}`}
            >
              <span className="text-lg">{b.emoji}</span>
              <span className="hidden sm:inline">{b.label}</span>
              <span className="text-xs text-muted-foreground">${b.cost}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full overflow-x-auto rounded-xl border-2 border-gray-700 bg-gray-800" style={{ cursor: "pointer" }}>
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          style={{ display: "block", width: "100%", imageRendering: "pixelated" }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => setHover(null)}
        />
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Info className="w-4 h-4" />SDG Impact of Your City</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(SDG_GOALS).map(([sdgKey, sdgInfo]) => {
            const sdgNum = Number(sdgKey);
            const score = sdgScores[sdgNum] || 0;
            return (
              <div key={sdgKey} className="flex items-center gap-2 text-xs">
                <span className="shrink-0 w-5 text-center">{sdgInfo.emoji}</span>
                <span className="w-28 shrink-0 truncate text-gray-600">{sdgInfo.label}</span>
                <div className="flex-1">
                  <Progress value={score} className="h-2" style={{ "--progress-bg": sdgInfo.color } as React.CSSProperties} />
                </div>
                <span className="w-8 text-right font-mono text-gray-500">{score}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
