import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useGetActivityStats, getGetActivityStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Star, Target, Zap, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<string, string> = {
  tree_planting: "Tree Planting",
  waste_cleaning: "Waste Cleaning",
  recycling: "Recycling",
  composting: "Composting",
  energy_saving: "Energy Saving"
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = useGetActivityStats({
    query: { queryKey: getGetActivityStatsQueryKey() }
  });

  useEffect(() => {
    if (user && (user.role === "faculty" || user.role === "admin")) {
      setLocation("/faculty-dashboard");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">Here is your impact overview.</p>
        </div>
        <Link href="/upload" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2">
            <Target className="w-4 h-4" />
            Log Activity
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Points</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{user?.points || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.totalPoints || 0} earned this month
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/10 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground">{user?.streak || 0} Days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep it up!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Activities</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.validActivities || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {stats?.totalActivities || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {stats?.categoryCounts && Object.keys(stats.categoryCounts).length > 0 
                ? CATEGORY_LABELS[Object.entries(stats.categoryCounts).sort((a,b) => b[1]-a[1])[0][0]] 
                : "None yet"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Most frequent action
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest submissions</CardDescription>
            </div>
            <Link href="/activities">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="divide-y border-t">
                {stats.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {activity.imageUrl ? (
                        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted border">
                          <img src={activity.imageUrl} alt={activity.category} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted border flex items-center justify-center text-muted-foreground flex-shrink-0">
                          <Target className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{CATEGORY_LABELS[activity.category] || activity.category}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(activity.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {activity.status === 'valid' && <Badge variant="default" className="bg-primary hover:bg-primary text-[10px]">+{activity.pointsAwarded} pts</Badge>}
                      {activity.status === 'invalid' && <Badge variant="destructive" className="text-[10px]">Invalid</Badge>}
                      {activity.status === 'pending' && <Badge variant="secondary" className="text-[10px]">Pending</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-t">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                  <Target className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">No activities yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Upload your first activity to start earning points.</p>
                <Link href="/upload">
                  <Button size="sm">Submit Activity</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Impact Breakdown</CardTitle>
            <CardDescription>Your activities by category</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.categoryCounts && Object.keys(stats.categoryCounts).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.categoryCounts).sort((a,b) => b[1]-a[1]).map(([cat, count]) => (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="text-muted-foreground">{count} activities</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(count / stats.totalActivities) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Start tracking activities to see your breakdown.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
