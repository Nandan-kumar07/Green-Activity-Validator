import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Star, Flame, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 }, {
    query: { queryKey: getGetLeaderboardQueryKey({ limit: 50 }) }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <Card>
          <CardContent className="p-0">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="p-4 border-b flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="flex-1 h-6" />
                <Skeleton className="w-24 h-6" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-accent/10 text-accent rounded-full mb-2">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Global Leaderboard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The top environmental advocates making a real difference. Log valid activities to climb the ranks.
        </p>
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {leaderboard?.map((entry, index) => {
              const isTop3 = entry.rank <= 3;
              
              return (
                <div 
                  key={entry.userId} 
                  className={`p-4 sm:p-6 flex items-center gap-4 sm:gap-6 transition-colors hover:bg-muted/50 ${
                    entry.rank === 1 ? 'bg-accent/5' : 
                    entry.rank === 2 ? 'bg-primary/5' : 
                    entry.rank === 3 ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 sm:w-12 text-center font-bold text-lg sm:text-2xl text-muted-foreground flex justify-center">
                    {entry.rank === 1 ? <Medal className="w-8 h-8 text-yellow-500 fill-yellow-500/20" /> :
                     entry.rank === 2 ? <Medal className="w-8 h-8 text-gray-400 fill-gray-400/20" /> :
                     entry.rank === 3 ? <Medal className="w-8 h-8 text-amber-700 fill-amber-700/20" /> :
                     `#${entry.rank}`}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${isTop3 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                      {entry.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {entry.validActivities} valid
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Medal className="w-3.5 h-3.5" />
                        {entry.badges} badges
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 text-right sm:text-left flex-shrink-0">
                    {entry.streak > 2 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 gap-1 hidden sm:flex">
                        <Flame className="w-3.5 h-3.5" /> {entry.streak} days
                      </Badge>
                    )}
                    <div className="flex flex-col items-end">
                      <div className={`font-bold flex items-center gap-1 ${isTop3 ? 'text-xl sm:text-2xl text-primary' : 'text-lg sm:text-xl'}`}>
                        {entry.points.toLocaleString()} <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Points</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {leaderboard?.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                No users found. Be the first to join the leaderboard!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
