import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Loader2, CheckCircle2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type ClassInfo = { id: number; name: string; subject: string | null; code: string; studentCount: number };

export default function JoinClass() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [myClass, setMyClass] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "student") {
      setLocation("/dashboard");
      return;
    }
    fetch(`${BASE}/api/classes`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setMyClass(Array.isArray(data) && data.length > 0 ? data[0] : null))
      .finally(() => setLoading(false));
  }, [user, setLocation]);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setJoining(true);
    try {
      const res = await fetch(`${BASE}/api/classes/join`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ variant: "destructive", title: data.error ?? "Failed to join class" }); return; }
      setMyClass({ ...data.class, studentCount: 0 });
      toast({ title: `Joined "${data.class.name}" successfully!` });
      setCode("");
    } catch {
      toast({ variant: "destructive", title: "Failed to join class" });
    } finally { setJoining(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary" /> My Class
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Join your class using the code from your teacher.</p>
      </div>

      {myClass ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-lg">{myClass.name}</h2>
                  <Badge className="bg-green-100 text-green-700 border-green-300 border"><CheckCircle2 className="w-3 h-3 mr-1" />Enrolled</Badge>
                </div>
                {myClass.subject && <p className="text-muted-foreground text-sm">{myClass.subject}</p>}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3" /> {myClass.studentCount} students enrolled
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200 text-center">
              <p className="text-xs text-muted-foreground">Class Code</p>
              <p className="font-mono font-bold text-xl tracking-widest text-green-700">{myClass.code}</p>
            </div>
            <Button variant="outline" className="w-full mt-3" onClick={() => setLocation("/assessments")}>
              View Assessments →
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Join a Class</CardTitle>
            <CardDescription>Ask your teacher for the class code to get started with assessments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter class code (e.g. ABC123)"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                maxLength={8}
                className="font-mono text-center text-lg tracking-widest"
              />
              <Button onClick={handleJoin} disabled={joining || !code.trim()} className="shrink-0">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Your teacher will share a unique code to join their class.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
