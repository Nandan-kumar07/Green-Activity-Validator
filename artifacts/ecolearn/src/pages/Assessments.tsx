import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ClipboardList, CheckCircle2, Clock, Calendar, Loader2, Plus, Trophy, BookOpen, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Question = { question: string; options: string[]; answer: number };
type Assessment = {
  id: number; title: string; description: string | null; type: string;
  questions: Question[]; creatorName: string; submitted: boolean;
  classId: number | null; dueDate: string | null; timeLimit: number | null; isActive: number;
  createdAt: string;
};
type SubmissionResult = { score: number; maxScore: number; pointsEarned: number; percentage: number };

export default function Assessments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/assessments`, { credentials: "include" })
      .then(r => r.json()).then(data => {
        setAssessments(Array.isArray(data) ? data : []);
      }).finally(() => setLoading(false));
  }, []);

  const startAssessment = (a: Assessment) => {
    setTaking(a);
    setAnswers(new Array(a.questions.length).fill(null));
    setCurrentQ(0);
    setResult(null);
    if (a.timeLimit) {
      setTimeLeft(a.timeLimit * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t === null || t <= 1) { clearInterval(timerRef.current!); submitAssessment(a, answers); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  };

  const submitAssessment = async (assessment?: Assessment, currentAnswers?: (number | null)[]) => {
    const a = assessment ?? taking;
    const ans = currentAnswers ?? answers;
    if (!a) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const res = await fetch(`${BASE}/api/assessments/${a.id}/submit`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans.map(a => a ?? -1) }),
      });
      if (res.status === 409) { toast({ title: "Already submitted" }); setTaking(null); return; }
      const data = await res.json();
      setResult(data);
      setAssessments(prev => prev.map(item => item.id === a.id ? { ...item, submitted: true } : item));
      toast({ title: `Assessment submitted! Score: ${data.score}/${data.maxScore} (+${data.pointsEarned} pts)` });
    } catch {
      toast({ variant: "destructive", title: "Submission failed" });
    } finally { setSubmitting(false); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const TYPE_COLORS: Record<string, string> = { weekly: "bg-blue-100 text-blue-700", monthly: "bg-purple-100 text-purple-700", online: "bg-green-100 text-green-700" };

  if (taking && !result) {
    const q = taking.questions[currentQ];
    const progress = ((currentQ + 1) / taking.questions.length) * 100;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{taking.title}</CardTitle>
              {timeLeft !== null && (
                <Badge className={`font-mono text-sm ${timeLeft < 60 ? "bg-red-500" : "bg-blue-600"} text-white`}>
                  <Clock className="w-3 h-3 mr-1" />{formatTime(timeLeft)}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {currentQ + 1} of {taking.questions.length}</span>
              <span>{answers.filter(a => a !== null).length} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-lg font-semibold leading-snug">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnswers(prev => { const n = [...prev]; n[currentQ] = idx; return n; })}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                    answers[currentQ] === idx
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-gray-300 hover:bg-muted/50"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}>← Previous</Button>
              <div className="flex gap-2">
                {currentQ < taking.questions.length - 1 ? (
                  <Button onClick={() => setCurrentQ(q => q + 1)}>Next →</Button>
                ) : (
                  <Button onClick={() => submitAssessment()} disabled={submitting} className="bg-green-600 hover:bg-green-500">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Assessment
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {taking.questions.map((_, i) => (
                <button key={i} onClick={() => setCurrentQ(i)}
                  className={`w-7 h-7 rounded text-xs font-bold border ${i === currentQ ? "border-primary bg-primary text-white" : answers[i] !== null ? "border-green-500 bg-green-100 text-green-700" : "border-muted bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result && taking) {
    const pct = result.percentage;
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 py-8">
        <div className="text-7xl">{pct >= 80 ? "🏆" : pct >= 60 ? "🌟" : pct >= 40 ? "💪" : "📚"}</div>
        <div>
          <h2 className="text-2xl font-bold">{pct >= 80 ? "Excellent!" : pct >= 60 ? "Good Job!" : pct >= 40 ? "Keep Learning!" : "Study More!"}</h2>
          <p className="text-muted-foreground">{taking.title}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary/10 rounded-xl p-4"><div className="text-3xl font-bold text-primary">{result.score}/{result.maxScore}</div><div className="text-xs text-muted-foreground">Correct</div></div>
          <div className="bg-yellow-50 rounded-xl p-4"><div className="text-3xl font-bold text-yellow-600">{pct}%</div><div className="text-xs text-muted-foreground">Score</div></div>
          <div className="bg-green-50 rounded-xl p-4"><div className="text-3xl font-bold text-green-600">+{result.pointsEarned}</div><div className="text-xs text-muted-foreground">Points Earned</div></div>
        </div>
        <Button onClick={() => { setTaking(null); setResult(null); }} className="gap-2">
          <ClipboardList className="w-4 h-4" /> Back to Assessments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><ClipboardList className="w-8 h-8 text-primary" />Assessments</h1>
          <p className="text-muted-foreground">{user?.role === "student" ? "Take assessments to earn points and test your SDG knowledge." : "Manage and review assessments."}</p>
        </div>
        {(user?.role === "faculty" || user?.role === "admin") && (
          <Button onClick={() => setLocation("/create-assessment")} className="gap-2"><Plus className="w-4 h-4" />Create Assessment</Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />Loading assessments...
        </div>
      ) : assessments.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p className="text-muted-foreground">No assessments available yet.</p>
          {(user?.role === "faculty" || user?.role === "admin") && (
            <Button className="mt-4" onClick={() => setLocation("/create-assessment")}>Create First Assessment</Button>
          )}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assessments.map(a => (
            <Card key={a.id} className={`hover:shadow-lg transition-shadow ${a.submitted ? "opacity-80" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{a.title}</CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className={TYPE_COLORS[a.type] ?? "bg-gray-100 text-gray-700"}>{a.type}</Badge>
                    {a.submitted && <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Done</Badge>}
                  </div>
                </div>
                {a.description && <CardDescription>{a.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{a.questions.length} questions</span>
                  {a.timeLimit && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.timeLimit} min</span>}
                  {a.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Due {new Date(a.dueDate).toLocaleDateString()}</span>}
                  <span className="text-xs">by {a.creatorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">+{a.questions.length * 15} pts possible</span>
                  </div>
                  {user?.role === "student" && !a.submitted && (
                    <Button onClick={() => startAssessment(a)} size="sm" className="gap-2">
                      <BookOpen className="w-4 h-4" />Start
                    </Button>
                  )}
                  {user?.role === "student" && a.submitted && (
                    <Badge className="bg-green-50 text-green-700 border-green-200 border">✅ Completed</Badge>
                  )}
                  {(user?.role === "faculty" || user?.role === "admin") && (
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/assessment-results/${a.id}`)}>View Results</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
