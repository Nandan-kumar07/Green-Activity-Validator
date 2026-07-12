import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Trophy, Users, BookOpen, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Submission = {
  id: number; userId: number; score: number; maxScore: number;
  answers: number[]; submittedAt: string;
  studentName: string; studentEmail: string;
};

type Assessment = {
  id: number; title: string; description: string | null; type: string;
  questions: { question: string; options: string[]; answer: number }[];
};

export default function AssessmentResults() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/assessment-results/:id");
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    if (user && user.role !== "faculty" && user.role !== "admin") {
      setLocation("/assessments");
      return;
    }
    if (!params?.id) return;

    setLoading(true);
    Promise.all([
      fetch(`${BASE}/api/assessments/${params.id}`, { credentials: "include" }).then(r => r.json()),
      fetch(`${BASE}/api/assessments/${params.id}/results`, { credentials: "include" }).then(r => r.json()),
    ]).then(([a, s]) => {
      setAssessment(a);
      setSubmissions(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  }, [params?.id, user, setLocation]);

  const exportCSV = () => {
    if (!assessment || submissions.length === 0) return;
    const header = `"Student","Email","Score","Max Score","Percentage","Submitted"`;
    const rows = submissions.map(s =>
      `"${s.studentName}","${s.studentEmail}","${s.score}","${s.maxScore}","${Math.round((s.score/s.maxScore)*100)}%","${new Date(s.submittedAt).toLocaleDateString()}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${assessment.title}-results.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!match) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading results...
      </div>
    );
  }

  const avgScore = submissions.length > 0
    ? Math.round(submissions.reduce((s, sub) => s + (sub.score / sub.maxScore) * 100, 0) / submissions.length)
    : 0;
  const topScore = submissions.length > 0 ? Math.max(...submissions.map(s => s.score)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/assessments")}><ChevronLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{assessment?.title ?? "Assessment Results"}</h1>
          <p className="text-sm text-muted-foreground">{assessment?.type} assessment · {submissions.length} submissions</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="w-4 h-4" />Export CSV</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          <div><div className="text-2xl font-bold">{submissions.length}</div><div className="text-sm text-muted-foreground">Submissions</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div><div className="text-2xl font-bold">{avgScore}%</div><div className="text-sm text-muted-foreground">Class Average</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-green-500" />
          <div><div className="text-2xl font-bold">{topScore}/{assessment?.questions.length ?? 0}</div><div className="text-sm text-muted-foreground">Top Score</div></div>
        </CardContent></Card>
      </div>

      {submissions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No submissions yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {submissions.map(sub => {
            const pct = Math.round((sub.score / sub.maxScore) * 100);
            return (
              <Card key={sub.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(sub === selected ? null : sub)}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{sub.studentName}</p>
                        <Badge className={pct >= 80 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}>
                          {pct}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{sub.studentEmail} · {new Date(sub.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">{sub.score}/{sub.maxScore}</p>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5 mt-2" />

                  {selected === sub && assessment && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <p className="text-sm font-semibold">Answer Breakdown:</p>
                      {assessment.questions.map((q, qi) => {
                        const studentAns = sub.answers[qi];
                        const correct = studentAns === q.answer;
                        return (
                          <div key={qi} className={`p-3 rounded-lg text-sm ${correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                            <p className="font-medium mb-1">{qi + 1}. {q.question}</p>
                            <p className={correct ? "text-green-700" : "text-red-600"}>
                              Student: {q.options[studentAns] ?? "No answer"} {correct ? "✅" : "❌"}
                            </p>
                            {!correct && <p className="text-green-700">Correct: {q.options[q.answer]}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
