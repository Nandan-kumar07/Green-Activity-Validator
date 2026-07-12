import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ChevronLeft, Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Question = { question: string; options: string[]; answer: number };

const SDG_TEMPLATES: Question[] = [
  { question: "How many UN Sustainable Development Goals are there?", options: ["12", "15", "17", "21"], answer: 2 },
  { question: "Which year is the SDG deadline?", options: ["2025", "2030", "2035", "2040"], answer: 1 },
  { question: "Which SDG focuses on Climate Action?", options: ["SDG 11", "SDG 12", "SDG 13", "SDG 14"], answer: 2 },
  { question: "What % of Earth's surface is covered by oceans?", options: ["50%", "60%", "71%", "85%"], answer: 2 },
  { question: "How many people lack access to clean water?", options: ["500 million", "1 billion", "2.2 billion", "4 billion"], answer: 2 },
];

export default function CreateAssessment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("online");
  const [timeLimit, setTimeLimit] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], answer: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (user?.role !== "faculty" && user?.role !== "admin") {
    setLocation("/assessments");
    return null;
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question: "", options: ["", "", "", ""], answer: 0 }]);
  };

  const updateQuestion = (i: number, field: keyof Question, value: string | number | string[]) => {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = [...q.options]; opts[oi] = value; return { ...q, options: opts };
    }));
  };

  const removeQuestion = (i: number) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== i));
  };

  const loadTemplate = () => {
    setQuestions(SDG_TEMPLATES.map(q => ({ ...q })));
    toast({ title: "SDG template questions loaded!" });
  };

  const handleSave = async () => {
    if (!title.trim()) { toast({ variant: "destructive", title: "Title required" }); return; }
    const validQuestions = questions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    if (validQuestions.length === 0) { toast({ variant: "destructive", title: "At least one complete question required" }); return; }

    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/assessments`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description: description || null, type,
          questions: validQuestions,
          timeLimit: timeLimit ? parseInt(timeLimit) : null,
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      toast({ title: "Assessment created successfully!" });
      setTimeout(() => setLocation("/assessments"), 1500);
    } catch {
      toast({ variant: "destructive", title: "Failed to create assessment" });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/assessments")}><ChevronLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-7 h-7 text-primary" />Create Assessment</h1>
          <p className="text-muted-foreground text-sm">Build a quiz for your students to test SDG knowledge</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Assessment Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Assessment title" value={title} onChange={e => setTitle(e.target.value)} className="text-base" />
          <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Time limit (minutes)</label>
              <Input type="number" placeholder="No limit" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Due date</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          Questions <Badge variant="secondary">{questions.length}</Badge>
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTemplate}>📋 Load SDG Template</Button>
          <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1"><Plus className="w-4 h-4" />Add Question</Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <Card key={qi}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1 shrink-0">Q{qi + 1}</Badge>
                <Input
                  placeholder={`Question ${qi + 1}`}
                  value={q.question}
                  onChange={e => updateQuestion(qi, "question", e.target.value)}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeQuestion(qi)} disabled={questions.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-10">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(qi, "answer", oi)}
                      className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${q.answer === oi ? "border-green-500 bg-green-500" : "border-gray-300"}`}
                    >
                      {q.answer === oi && <span className="w-2 h-2 bg-white rounded-full" />}
                    </button>
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      className={`text-sm ${q.answer === oi ? "border-green-400" : ""}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pl-10">Click the circle next to the correct answer</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pb-8">
        <Button variant="outline" onClick={addQuestion} className="gap-2"><Plus className="w-4 h-4" />Add Another Question</Button>
        <Button onClick={handleSave} disabled={saving || saved} className="gap-2 min-w-36">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Assessment"}
        </Button>
      </div>
    </div>
  );
}
