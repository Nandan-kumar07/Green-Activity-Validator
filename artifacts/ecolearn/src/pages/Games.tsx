import { useState, Suspense, lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gamepad2, Trophy, RefreshCw, CheckCircle2, XCircle, Zap, Target, Recycle, Globe, Building2, Loader2 } from "lucide-react";
import { useEffect, useRef, useCallback } from "react";

const PlanetDefense = lazy(() => import("@/games/PlanetDefense"));
const EcoCityBuilder = lazy(() => import("@/games/EcoCityBuilder"));

const QUIZ_QUESTIONS = [
  { q: "How many UN Sustainable Development Goals are there?", options: ["12", "15", "17", "20"], answer: 2, sdg: 17 },
  { q: "Which year is the deadline for achieving the SDGs?", options: ["2025", "2030", "2035", "2040"], answer: 1, sdg: 17 },
  { q: "What percentage of the world's plastic waste is recycled?", options: ["9%", "25%", "40%", "60%"], answer: 0, sdg: 12 },
  { q: "Which gas is the primary driver of climate change?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: 2, sdg: 13 },
  { q: "What fraction of Earth's surface is covered by oceans?", options: ["50%", "60%", "71%", "85%"], answer: 2, sdg: 14 },
  { q: "How much food is wasted globally each year?", options: ["10%", "33%", "50%", "66%"], answer: 1, sdg: 2 },
  { q: "Which energy source produces the most carbon emissions per kWh?", options: ["Solar", "Wind", "Natural Gas", "Coal"], answer: 3, sdg: 7 },
  { q: "How many people lack access to clean drinking water?", options: ["500 million", "1 billion", "2.2 billion", "4 billion"], answer: 2, sdg: 6 },
  { q: "What is the average rise in global temperature since pre-industrial times?", options: ["0.5°C", "1.2°C", "2.0°C", "3.5°C"], answer: 1, sdg: 13 },
  { q: "What percentage of species live in forests?", options: ["40%", "60%", "80%", "95%"], answer: 2, sdg: 15 },
  { q: "Which country produces the most solar energy?", options: ["USA", "Germany", "China", "India"], answer: 2, sdg: 7 },
  { q: "What is the main cause of ocean acidification?", options: ["Oil spills", "CO2 absorption", "Plastic pollution", "Overfishing"], answer: 1, sdg: 14 },
  { q: "How many people live on less than $1.90 per day?", options: ["100 million", "400 million", "736 million", "1.5 billion"], answer: 2, sdg: 1 },
  { q: "What % of global greenhouse gases come from food systems?", options: ["10%", "25%", "40%", "55%"], answer: 1, sdg: 2 },
  { q: "Deforestation accounts for what share of global CO2 emissions?", options: ["5%", "10%", "15%", "25%"], answer: 2, sdg: 15 },
];

const SORT_ITEMS = [
  { id: 1, label: "Plastic Bottle", emoji: "🍶", correct: "Recycling" },
  { id: 2, label: "Apple Core", emoji: "🍎", correct: "Compost" },
  { id: 3, label: "Newspaper", emoji: "📰", correct: "Recycling" },
  { id: 4, label: "Pizza Box (greasy)", emoji: "🍕", correct: "Landfill" },
  { id: 5, label: "Glass Jar", emoji: "🫙", correct: "Recycling" },
  { id: 6, label: "Banana Peel", emoji: "🍌", correct: "Compost" },
  { id: 7, label: "Styrofoam Cup", emoji: "☕", correct: "Landfill" },
  { id: 8, label: "Cardboard Box", emoji: "📦", correct: "Recycling" },
  { id: 9, label: "Coffee Grounds", emoji: "☕", correct: "Compost" },
  { id: 10, label: "Plastic Bag", emoji: "🛍️", correct: "Landfill" },
  { id: 11, label: "Aluminium Can", emoji: "🥫", correct: "Recycling" },
  { id: 12, label: "Eggshells", emoji: "🥚", correct: "Compost" },
  { id: 13, label: "Broken Mirror", emoji: "🪟", correct: "Landfill" },
  { id: 14, label: "Old Newspaper", emoji: "📄", correct: "Recycling" },
  { id: 15, label: "Yard Clippings", emoji: "🌿", correct: "Compost" },
];

const BINS = ["Recycling", "Compost", "Landfill"] as const;
type Bin = typeof BINS[number];
const BIN_COLORS: Record<Bin, string> = { Recycling: "text-blue-600 border-blue-400 bg-blue-50", Compost: "text-green-600 border-green-400 bg-green-50", Landfill: "text-gray-600 border-gray-400 bg-gray-50" };
const BIN_EMOJIS: Record<Bin, string> = { Recycling: "♻️", Compost: "🌱", Landfill: "🗑️" };

function QuizGame() {
  const [questions] = useState(() => [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === questions[current].answer;
    if (correct) {
      const ns = streak + 1;
      setScore(s => s + 10 + (ns > 1 ? (ns - 1) * 5 : 0));
      setStreak(ns);
      setMaxStreak(m => Math.max(m, ns));
    } else {
      setStreak(0);
    }
    setAnswered(a => [...a, correct]);
    setTimeout(() => {
      if (current + 1 >= questions.length) setDone(true);
      else { setCurrent(c => c + 1); setSelected(null); setTimeLeft(20); }
    }, 1200);
  }, [selected, current, questions, streak]);

  useEffect(() => {
    if (done || selected !== null) return;
    const t = setInterval(() => setTimeLeft(l => { if (l <= 1) { handleAnswer(-1); return 20; } return l - 1; }), 1000);
    return () => clearInterval(t);
  }, [done, selected, current, handleAnswer]);

  const reset = () => { setCurrent(0); setSelected(null); setScore(0); setStreak(0); setMaxStreak(0); setDone(false); setAnswered([]); setTimeLeft(20); };

  if (done) {
    const pct = Math.round((score / (questions.length * 25)) * 100);
    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">{pct >= 80 ? "🏆" : pct >= 50 ? "🌟" : "💪"}</div>
        <div>
          <h3 className="text-2xl font-bold">Quiz Complete!</h3>
          <p className="text-muted-foreground">{pct >= 80 ? "Sustainability expert!" : pct >= 50 ? "Great effort!" : "Keep learning!"}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          <div className="bg-primary/10 rounded-xl p-4"><div className="text-2xl font-bold text-primary">{score}</div><div className="text-xs text-muted-foreground">Points</div></div>
          <div className="bg-green-50 rounded-xl p-4"><div className="text-2xl font-bold text-green-600">{answered.filter(Boolean).length}/{questions.length}</div><div className="text-xs text-muted-foreground">Correct</div></div>
          <div className="bg-orange-50 rounded-xl p-4"><div className="text-2xl font-bold text-orange-600">{maxStreak}🔥</div><div className="text-xs text-muted-foreground">Best Streak</div></div>
        </div>
        <Button onClick={reset} className="gap-2"><RefreshCw className="w-4 h-4" />Play Again</Button>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge variant="outline">Question {current + 1} / {questions.length}</Badge>
        <div className="flex items-center gap-3">
          {streak > 1 && <Badge className="bg-orange-500">{streak}🔥 Streak</Badge>}
          <Badge variant="secondary" className="font-mono">{score} pts</Badge>
        </div>
      </div>
      <Progress value={(timeLeft / 20) * 100} className="h-2" />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>⏱️ {timeLeft}s</span>
        <span>SDG {q.sdg}</span>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-lg font-semibold leading-snug">{q.q}</p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, idx) => {
          let cls = "border-2 rounded-xl p-4 text-left font-medium transition-all cursor-pointer ";
          if (selected === null) cls += "hover:border-primary hover:bg-primary/5 border-muted";
          else if (idx === q.answer) cls += "border-green-500 bg-green-50 text-green-700";
          else if (idx === selected) cls += "border-red-400 bg-red-50 text-red-600";
          else cls += "border-muted opacity-50";
          return (
            <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={selected !== null}>
              <span className="flex items-center gap-2">
                {selected !== null && idx === q.answer && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                {selected !== null && idx === selected && idx !== q.answer && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                {String.fromCharCode(65 + idx)}. {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SortGame() {
  const [items] = useState(() => [...SORT_ITEMS].sort(() => Math.random() - 0.5));
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<{ item: typeof SORT_ITEMS[0]; chosen: Bin; correct: boolean }[]>([]);
  const [done, setDone] = useState(false);
  const [chosen, setChosen] = useState<Bin | null>(null);

  const handleSort = (bin: Bin) => {
    if (chosen) return;
    const item = items[current];
    const correct = bin === item.correct;
    setChosen(bin);
    setResults(r => [...r, { item, chosen: bin, correct }]);
    setTimeout(() => {
      if (current + 1 >= items.length) setDone(true);
      else { setCurrent(c => c + 1); setChosen(null); }
    }, 1000);
  };

  const reset = () => { setCurrent(0); setResults([]); setDone(false); setChosen(null); };

  if (done) {
    const correct = results.filter(r => r.correct).length;
    return (
      <div className="space-y-5">
        <div className="text-center py-4 space-y-2">
          <div className="text-5xl">{correct >= 12 ? "🏆" : correct >= 8 ? "🌟" : "💪"}</div>
          <h3 className="text-xl font-bold">Sorting Complete!</h3>
          <p className="text-muted-foreground">{correct}/{items.length} sorted correctly</p>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${r.correct ? "bg-green-50" : "bg-red-50"}`}>
              <span className="text-sm font-medium">{r.item.emoji} {r.item.label}</span>
              <div className="flex items-center gap-2 text-sm">
                {r.correct ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <span className={r.correct ? "text-green-700" : "text-red-600"}>{r.correct ? r.chosen : `${r.chosen} → ${r.item.correct}`}</span>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={reset} className="w-full gap-2"><RefreshCw className="w-4 h-4" />Play Again</Button>
      </div>
    );
  }

  const item = items[current];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline">{current + 1} / {items.length}</Badge>
        <Badge variant="secondary">{results.filter(r => r.correct).length} ✓ correct</Badge>
      </div>
      <Progress value={(current / items.length) * 100} className="h-2" />
      <div className="text-center py-8 bg-muted/30 rounded-2xl space-y-3">
        <div className="text-7xl">{item.emoji}</div>
        <div className="text-xl font-bold">{item.label}</div>
        <p className="text-muted-foreground text-sm">Where does this go?</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {BINS.map(bin => {
          let cls = `flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-medium text-sm transition-all cursor-pointer ${BIN_COLORS[bin]} `;
          if (chosen === bin) cls += item.correct === bin ? "ring-4 ring-green-400 scale-105" : "ring-4 ring-red-400 opacity-70";
          else if (chosen) cls += "opacity-40 cursor-default";
          else cls += "hover:scale-105 hover:shadow-md";
          return (
            <button key={bin} className={cls} onClick={() => handleSort(bin)} disabled={!!chosen}>
              <span className="text-3xl">{BIN_EMOJIS[bin]}</span>
              <span>{bin}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const GAMES = [
  {
    id: "planet",
    title: "Planet Defense",
    description: "Earth is under attack! Click pollution threats flying toward the planet to neutralize them with green energy beams. Learn which SDGs each threat relates to.",
    emoji: "🌍",
    badge: "3D Interactive",
    badgeColor: "bg-blue-600",
    color: "from-blue-950 to-slate-900",
    textColor: "text-blue-300",
    borderColor: "border-blue-700",
    icon: Globe,
    tag: "3D · SDGs 2–15",
    isNew: true,
  },
  {
    id: "city",
    title: "Eco City Builder",
    description: "Transform a polluted city into a sustainable paradise. Place solar panels, trees, water plants, and more to boost all 17 SDG scores on your city's impact dashboard.",
    emoji: "🏙️",
    badge: "2D Strategy",
    badgeColor: "bg-green-700",
    color: "from-green-950 to-emerald-900",
    textColor: "text-green-300",
    borderColor: "border-green-700",
    icon: Building2,
    tag: "2D · All SDGs",
    isNew: true,
  },
  {
    id: "quiz",
    title: "Sustainability Quiz",
    description: "Test your knowledge of climate, SDGs, and eco-facts. Beat the 20-second timer and build answer streaks to earn bonus points!",
    emoji: "🧠",
    badge: "10 Questions",
    badgeColor: "bg-purple-600",
    color: "from-purple-950 to-violet-900",
    textColor: "text-purple-300",
    borderColor: "border-purple-700",
    icon: Target,
    tag: "Trivia · SDG Knowledge",
    isNew: false,
  },
  {
    id: "sort",
    title: "Waste Sorting",
    description: "Sort 15 waste items into the correct bin — Recycling, Compost, or Landfill. Learn the rules of proper waste disposal for SDG 12.",
    emoji: "♻️",
    badge: "15 Items",
    badgeColor: "bg-teal-600",
    color: "from-teal-950 to-cyan-900",
    textColor: "text-teal-300",
    borderColor: "border-teal-700",
    icon: Recycle,
    tag: "Sorting · SDG 12",
    isNew: false,
  },
];

function GameLoader() {
  return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span>Loading game...</span>
    </div>
  );
}

export default function Games() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const game = GAMES.find(g => g.id === activeGame);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Eco Games</h1>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Learn about the UN's 17 Sustainable Development Goals through immersive 3D, 2D, and interactive games. Play, learn, and take action!
        </p>
      </div>

      {!activeGame && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {GAMES.map(g => {
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className={`relative rounded-2xl border-2 ${g.borderColor} bg-gradient-to-br ${g.color} p-6 cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group`}
                  onClick={() => setActiveGame(g.id)}
                >
                  {g.isNew && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-500 text-black text-xs font-bold">✨ NEW</Badge>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="text-5xl shrink-0">{g.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{g.title}</h3>
                        <Icon className={`w-5 h-5 ${g.textColor}`} />
                      </div>
                      <p className={`text-sm leading-relaxed mb-3 ${g.textColor}`}>{g.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${g.badgeColor} text-white text-xs`}>{g.badge}</Badge>
                          <span className={`text-xs ${g.textColor} opacity-70`}>{g.tag}</span>
                        </div>
                        <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30 border gap-2 group-hover:gap-3 transition-all">
                          <Zap className="w-3.5 h-3.5" />Play
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-green-500/10 rounded-2xl p-6 text-center space-y-2">
            <Trophy className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-bold text-lg">Games teach real SDG knowledge</h3>
            <p className="text-sm text-muted-foreground">Every game is designed around real UN Sustainable Development Goal data and targets. Play to learn, then take real-world action!</p>
          </div>
        </>
      )}

      {activeGame && game && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{game.emoji}</span>
              <div>
                <h2 className="text-xl font-bold">{game.title}</h2>
                <Badge className={`${game.badgeColor} text-white text-xs`}>{game.badge}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveGame(null)} className="gap-2">
              <Gamepad2 className="w-4 h-4" />All Games
            </Button>
          </div>

          {activeGame === "planet" && (
            <Suspense fallback={<GameLoader />}>
              <PlanetDefense key="planet" />
            </Suspense>
          )}
          {activeGame === "city" && (
            <Suspense fallback={<GameLoader />}>
              <EcoCityBuilder key="city" />
            </Suspense>
          )}
          {activeGame === "quiz" && (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <QuizGame key="quiz" />
              </CardContent>
            </Card>
          )}
          {activeGame === "sort" && (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <SortGame key="sort" />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
