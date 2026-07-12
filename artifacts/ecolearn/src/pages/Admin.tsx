import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { 
  useAdminGetStats, getAdminGetStatsQueryKey,
  useAdminListActivities, getAdminListActivitiesQueryKey,
  useAdminOverrideActivity
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Users, Activity as ActivityIcon, CheckCircle2, XCircle, AlertCircle, ShieldAlert, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [overrideId, setOverrideId] = useState<number | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<"valid" | "invalid">("valid");
  const [overrideNotes, setOverrideNotes] = useState("");

  const activitiesParams = { 
    page, 
    limit: 20, 
    ...(statusFilter !== "all" && { status: statusFilter }) 
  };

  const { data: stats } = useAdminGetStats({
    query: { queryKey: getAdminGetStatsQueryKey(), enabled: user?.role === "admin" }
  });
  
  const { data: activitiesData } = useAdminListActivities(activitiesParams, {
    query: { queryKey: getAdminListActivitiesQueryKey(activitiesParams), enabled: user?.role === "admin" }
  });

  const overrideMutation = useAdminOverrideActivity();

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (user && user.role !== "admin") return null;

  const handleOverride = () => {
    if (!overrideId) return;
    
    overrideMutation.mutate(
      { id: overrideId, data: { status: overrideStatus, notes: overrideNotes } },
      {
        onSuccess: () => {
          toast({ title: "Activity overridden successfully" });
          queryClient.invalidateQueries({ queryKey: getAdminListActivitiesQueryKey(activitiesParams) });
          queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
          setOverrideId(null);
          setOverrideNotes("");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Override failed" });
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
          <p className="text-muted-foreground mt-1">Platform overview and manual moderation.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalActivities || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats?.pendingActivities || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalPointsAwarded || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Activity Submissions</CardTitle>
            <CardDescription>Review and override AI verification results.</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="invalid">Invalid</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Category / Date</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>AI Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activitiesData?.activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.userName || `User #${activity.userId}`}</TableCell>
                    <TableCell>
                      <div className="font-medium">{activity.category}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(activity.createdAt), 'MMM d, yyyy HH:mm')}</div>
                      {activity.predictedLabel && (
                        <div className="text-xs text-muted-foreground mt-1">AI saw: {activity.predictedLabel} ({(activity.confidence! * 100).toFixed(0)}%)</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.imageUrl ? (
                        <a href={activity.imageUrl} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded border overflow-hidden hover:opacity-80 transition-opacity">
                          <img src={activity.imageUrl} alt="Activity" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">No image</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.status === 'valid' && <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Valid</Badge>}
                      {activity.status === 'invalid' && <Badge variant="destructive" className="bg-destructive/20 text-destructive hover:bg-destructive/20">Invalid</Badge>}
                      {activity.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={overrideId === activity.id} onOpenChange={(open) => !open && setOverrideId(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setOverrideId(activity.id)}>
                            Override
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Override Verification</DialogTitle>
                            <DialogDescription>
                              Manually set the status for activity #{activity.id}. This will override the AI's decision and adjust points accordingly.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="py-4 space-y-4">
                            <div className="flex gap-2">
                              <Button 
                                type="button"
                                variant={overrideStatus === 'valid' ? 'default' : 'outline'} 
                                className={overrideStatus === 'valid' ? 'bg-primary' : ''}
                                onClick={() => setOverrideStatus('valid')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Valid
                              </Button>
                              <Button 
                                type="button"
                                variant={overrideStatus === 'invalid' ? 'destructive' : 'outline'} 
                                onClick={() => setOverrideStatus('invalid')}
                              >
                                <XCircle className="w-4 h-4 mr-2" /> Mark Invalid
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Admin Notes (Optional)</label>
                              <Textarea 
                                placeholder="Reason for override..." 
                                value={overrideNotes}
                                onChange={(e) => setOverrideNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setOverrideId(null)}>Cancel</Button>
                            <Button onClick={handleOverride} disabled={overrideMutation.isPending}>
                              Save Override
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                
                {activitiesData?.activities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No activities found matching criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <Button variant="outline" size="sm" disabled={!activitiesData || activitiesData.activities.length < 20} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
