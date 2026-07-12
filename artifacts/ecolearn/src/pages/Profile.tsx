import { useGetUserProfile, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Trophy, Calendar, Medal, Flame, Star, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const CATEGORY_LABELS: Record<string, string> = {
  tree_planting: "Tree Planting",
  waste_cleaning: "Waste Cleaning",
  recycling: "Recycling",
  composting: "Composting",
  energy_saving: "Energy Saving"
};

export default function Profile() {
  const { data: profile, isLoading } = useGetUserProfile({
    query: { queryKey: getGetUserProfileQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="col-span-1 space-y-6">
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="col-span-2 space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 border-4 border-background shadow-lg">
            <User className="w-10 h-10" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{profile.user.name}</h1>
            <p className="text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-2">
              <Calendar className="w-4 h-4" /> 
              Joined {format(new Date(profile.user.createdAt), 'MMMM yyyy')}
            </p>
          </div>
          <div className="flex gap-6 text-center md:text-right shrink-0">
            <div>
              <div className="text-3xl font-bold text-primary flex items-center justify-center md:justify-end gap-1">
                <Star className="w-6 h-6" /> {profile.user.points}
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Total Points</p>
            </div>
            {profile.rank && (
              <div>
                <div className="text-3xl font-bold text-accent flex items-center justify-center md:justify-end gap-1">
                  <Trophy className="w-6 h-6" /> #{profile.rank}
                </div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Global Rank</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Impact Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 text-accent rounded-md"><Flame className="w-4 h-4" /></div>
                  <div>
                    <p className="font-medium leading-none">Current Streak</p>
                  </div>
                </div>
                <div className="font-bold text-lg">{profile.user.streak} days</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                  <div>
                    <p className="font-medium leading-none">Valid Activities</p>
                  </div>
                </div>
                <div className="font-bold text-lg">{profile.stats.validActivities}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted text-muted-foreground rounded-md"><Medal className="w-4 h-4" /></div>
                  <div>
                    <p className="font-medium leading-none">Badges Earned</p>
                  </div>
                </div>
                <div className="font-bold text-lg">
                  {profile.badges.filter(b => b.earned).length} / {profile.badges.length}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(profile.stats.categoryCounts).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(profile.stats.categoryCounts).sort((a,b) => b[1]-a[1]).map(([cat, count]) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{CATEGORY_LABELS[cat] || cat}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary/60 rounded-full" 
                          style={{ width: `${(count / profile.stats.totalActivities) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No activities logged yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-primary" /> Badge Collection
              </CardTitle>
              <CardDescription>Earn badges by completing verified activities and maintaining streaks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {profile.badges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`relative p-4 rounded-xl border text-center transition-all ${
                      badge.earned 
                        ? "bg-card border-primary/20 shadow-sm" 
                        : "bg-muted/30 border-dashed opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                    }`}
                  >
                    <div className="text-4xl mb-3">{badge.icon}</div>
                    <h3 className="font-semibold text-sm leading-tight mb-1">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground leading-tight">{badge.description}</p>
                    
                    {badge.earned && badge.earnedAt && (
                      <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground font-medium">
                        Earned {format(new Date(badge.earnedAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
