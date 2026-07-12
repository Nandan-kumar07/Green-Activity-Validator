import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, BookOpen, Download, Plus, Search, Star, Flame, Eye, ChevronRight, GraduationCap, BarChart3, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Student = {
  id: number; name: string; email: string; points: number; streak: number;
  className: string | null; classId: number | null; totalActivities: number;
  validActivities: number; totalAssessments: number; avgAssessmentScore: number | null;
  createdAt: string;
};
type ClassInfo = { id: number; name: string; subject: string | null; code: string; studentCount: number; description: string | null };

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "faculty" && user.role !== "admin") setLocation("/dashboard");
  }, [user, setLocation]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetch(`${BASE}/api/faculty/students`, { credentials: "include" }).then(r => r.json()),
      fetch(`${BASE}/api/classes`, { credentials: "include" }).then(r => r.json()),
    ]).then(([s, c]) => {
      setStudents(Array.isArray(s) ? s : []);
      setClasses(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, [user]);

  const createClass = async () => {
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    try {
      const res = await fetch(`${BASE}/api/classes`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName, subject: newClassSubject }),
      });
      const cls = await res.json();
      setClasses(prev => [...prev, { ...cls, studentCount: 0 }]);
      setNewClassName(""); setNewClassSubject(""); setClassDialogOpen(false);
      toast({ title: `Class "${cls.name}" created! Code: ${cls.code}` });
    } catch {
      toast({ variant: "destructive", title: "Failed to create class" });
    } finally { setCreatingClass(false); }
  };

  const exportCSV = async () => {
    const res = await fetch(`${BASE}/api/faculty/export`, { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.className ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPoints = students.reduce((s, st) => s + st.points, 0);
  const avgPoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;
  const topStudent = students[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" /> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            Faculty Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Manage your classes and track student progress.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => setLocation("/create-assessment")} className="gap-2">
            <Plus className="w-4 h-4" /> New Assessment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-blue-600" /><div><div className="text-2xl font-bold">{students.length}</div><div className="text-sm text-muted-foreground">Students</div></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><BookOpen className="w-8 h-8 text-green-600" /><div><div className="text-2xl font-bold">{classes.length}</div><div className="text-sm text-muted-foreground">Classes</div></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Trophy className="w-8 h-8 text-yellow-600" /><div><div className="text-2xl font-bold">{avgPoints}</div><div className="text-sm text-muted-foreground">Avg Points</div></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><BarChart3 className="w-8 h-8 text-purple-600" /><div><div className="text-2xl font-bold">{students.filter(s => s.streak > 0).length}</div><div className="text-sm text-muted-foreground">Active Streaks</div></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="outline">{filtered.length} students</Badge>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{students.length === 0 ? "No students yet. Create a class and share the code!" : "No students match your search."}</p>
              </CardContent></Card>
            )}
            {filtered.map((s, i) => (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{s.name}</p>
                        {s.streak > 3 && <Badge className="bg-orange-500 text-white text-xs">{s.streak}🔥</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{s.email} {s.className ? `• ${s.className}` : ""}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{s.points}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" />{s.validActivities}/{s.totalActivities}</span>
                      {s.avgAssessmentScore !== null && (
                        <div className="w-20">
                          <div className="text-xs mb-0.5">{s.avgAssessmentScore}% avg</div>
                          <Progress value={s.avgAssessmentScore} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setLocation(`/student/${s.id}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">My Classes</CardTitle>
                <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1"><Plus className="w-3 h-3" />Add</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create New Class</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-3">
                      <Input placeholder="Class name (e.g. Environmental Science 101)" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                      <Input placeholder="Subject (optional)" value={newClassSubject} onChange={e => setNewClassSubject(e.target.value)} />
                      <Button onClick={createClass} disabled={creatingClass || !newClassName.trim()} className="w-full">
                        {creatingClass ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Class
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No classes yet. Create your first class!</p>
              ) : (
                <div className="space-y-2">
                  {classes.map(cls => (
                    <div key={cls.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{cls.name}</p>
                          {cls.subject && <p className="text-xs text-muted-foreground">{cls.subject}</p>}
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">{cls.code}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />{cls.studentCount} students
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {topStudent && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-600" />Top Student</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold">{topStudent.name}</p>
                <p className="text-sm text-muted-foreground">{topStudent.points} points · {topStudent.streak}🔥 streak</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {topStudent.validActivities} valid activities · {topStudent.totalAssessments} assessments
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" />Streak Leaders</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {students.filter(s => s.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                  <span className="truncate">{s.name}</span>
                  <Badge className="bg-orange-500 text-white">{s.streak}🔥</Badge>
                </div>
              ))}
              {students.filter(s => s.streak > 0).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No active streaks yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
