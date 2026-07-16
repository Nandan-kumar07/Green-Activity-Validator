import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Trophy, Plus, Search, Star, Flame, GraduationCap, Loader2, Copy, Check, BookOpen } from "lucide-react";
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
  const [copiedClassId, setCopiedClassId] = useState<number | null>(null);

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

  const handleCopyCode = (cls: ClassInfo) => {
    navigator.clipboard.writeText(cls.code);
    setCopiedClassId(cls.id);
    toast({ title: "Class code copied to clipboard!" });
    setTimeout(() => setCopiedClassId(null), 2000);
  };

  // Filter students based on search input and sort them by points descending to create the Leaderboard
  const sortedAndFilteredStudents = students
    .filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.className ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.points - a.points);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" /> Loading Faculty Portal...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section with page title and new assessment action button */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary animate-pulse" />
            Faculty Portal
          </h1>
          <p className="text-muted-foreground mt-1">Welcome, {user?.name}. Oversee assessments, class structures, and review the student leaderboards.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setLocation("/create-assessment")} className="gap-2 shadow-sm font-semibold">
            <Plus className="w-4 h-4" /> Create Assessment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main section: Student Leaderboard */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Student Leaderboard
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>

          <div className="space-y-2.5">
            {sortedAndFilteredStudents.length === 0 ? (
              <Card className="border border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
                  <p className="text-sm font-medium">
                    {students.length === 0 
                      ? "No students enrolled yet. Create a class below and share the code!" 
                      : "No students match your search filter."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedAndFilteredStudents.map((s, idx) => {
                const rank = idx + 1;
                let rankBadgeColor = "bg-muted text-muted-foreground";
                if (rank === 1) rankBadgeColor = "bg-yellow-500 text-white font-extrabold shadow-sm";
                else if (rank === 2) rankBadgeColor = "bg-slate-300 text-slate-800 font-extrabold shadow-sm";
                else if (rank === 3) rankBadgeColor = "bg-amber-600 text-white font-extrabold shadow-sm";

                return (
                  <Card key={s.id} className="hover:shadow-md transition-all duration-200 border-muted-foreground/10 hover:border-primary/20">
                    <CardContent className="py-3.5 px-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank indicator */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${rankBadgeColor}`}>
                          {rank}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm sm:text-base text-foreground truncate">{s.name}</p>
                            {s.streak >= 3 && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] px-1.5 py-0.5">
                                {s.streak}🔥
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {s.email} {s.className ? `• ${s.className}` : "• Unassigned Class"}
                          </p>
                        </div>
                      </div>

                      {/* Score metrics */}
                      <div className="flex items-center gap-4 text-sm shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-primary flex items-center justify-end gap-1">
                            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                            {s.points} <span className="text-xs font-normal text-muted-foreground">pts</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {s.validActivities} of {s.totalActivities} verified activities
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar section: Class management */}
        <div className="space-y-6">
          <Card className="shadow-sm border-muted-foreground/20">
            <CardHeader className="pb-3.5 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    My Classes
                  </CardTitle>
                  <CardDescription className="text-xs">Create and manage your student groups</CardDescription>
                </div>
                
                {/* Create class dialog trigger */}
                <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 font-semibold">
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Class</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Class Name</label>
                        <Input 
                          placeholder="e.g. Environmental Science 101" 
                          value={newClassName} 
                          onChange={e => setNewClassName(e.target.value)} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Subject / Department (optional)</label>
                        <Input 
                          placeholder="e.g. Sustainability & Ecology" 
                          value={newClassSubject} 
                          onChange={e => setNewClassSubject(e.target.value)} 
                        />
                      </div>
                      <Button onClick={createClass} disabled={creatingClass || !newClassName.trim()} className="w-full mt-2 font-semibold">
                        {creatingClass ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Class
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No classes created yet. Setup your first class above!</p>
              ) : (
                <div className="space-y-2.5">
                  {classes.map(cls => (
                    <div key={cls.id} className="p-3 bg-muted/30 border border-muted-foreground/10 rounded-xl flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{cls.name}</p>
                        {cls.subject ? (
                          <p className="text-xs text-muted-foreground truncate">{cls.subject}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-muted-foreground/75" />
                          {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''} enrolled
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="outline" className="font-mono text-xs select-all px-2 py-0.5 bg-background shadow-xs">
                          {cls.code}
                        </Badge>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-muted-foreground hover:text-foreground" 
                          onClick={() => handleCopyCode(cls)}
                        >
                          {copiedClassId === cls.id ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
