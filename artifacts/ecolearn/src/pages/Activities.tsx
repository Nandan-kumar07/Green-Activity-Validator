import { useState } from "react";
import { useListActivities, getListActivitiesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Target, Leaf, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/lib/constants";

export default function Activities() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const queryParams = {
    page,
    limit: 10,
    ...(category !== "all" && { category }),
    ...(status !== "all" && { status }),
  };

  const { data, isLoading } = useListActivities(queryParams, {
    query: { queryKey: getListActivitiesQueryKey(queryParams) }
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
          <p className="text-muted-foreground mt-1">Review your past submissions and AI verifications.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="invalid">Invalid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : data?.activities.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <CardContent>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium">No activities found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or upload a new activity.</p>
            </CardContent>
          </Card>
        ) : (
          data?.activities.map((activity) => (
            <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0 flex flex-col sm:flex-row">
                {activity.imageUrl && (
                  <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-muted border-b sm:border-b-0 sm:border-r relative">
                    <img src={activity.imageUrl} alt={activity.category} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur text-foreground shadow-sm">
                        {CATEGORY_LABELS[activity.category] || activity.category}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {!activity.imageUrl && (
                        <Badge variant="outline" className="mb-2">
                          {CATEGORY_LABELS[activity.category] || activity.category}
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground">{format(new Date(activity.createdAt), 'MMMM d, yyyy h:mm a')}</p>
                      {activity.description && (
                        <p className="mt-2 text-foreground">{activity.description}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 text-right">
                      {activity.status === 'valid' && (
                        <Badge className="bg-primary hover:bg-primary gap-1 pl-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </Badge>
                      )}
                      {activity.status === 'invalid' && (
                        <Badge variant="destructive" className="gap-1 pl-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Invalid
                        </Badge>
                      )}
                      {activity.status === 'pending' && (
                        <Badge variant="secondary" className="gap-1 pl-1.5">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </Badge>
                      )}
                      
                      {activity.pointsAwarded > 0 && (
                        <span className="text-sm font-bold text-primary mt-1">+{activity.pointsAwarded} pts</span>
                      )}
                    </div>
                  </div>

                  {activity.confidence !== null && activity.confidence !== undefined && (
                    <div className="pt-4 mt-auto border-t space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          AI Confidence {activity.predictedLabel && `(${activity.predictedLabel})`}
                        </span>
                        <span>{Math.round(activity.confidence * 100)}%</span>
                      </div>
                      <Progress 
                        value={activity.confidence * 100} 
                        className={`h-1.5 ${
                          activity.confidence > 0.8 ? '[&>div]:bg-primary' : 
                          activity.confidence > 0.5 ? '[&>div]:bg-accent' : 
                          '[&>div]:bg-destructive'
                        }`} 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
