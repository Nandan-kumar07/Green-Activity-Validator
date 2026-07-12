import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import UploadActivity from "@/pages/UploadActivity";
import Activities from "@/pages/Activities";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Admin from "@/pages/Admin";
import SDGs from "@/pages/SDGs";
import Learn from "@/pages/Learn";
import Games from "@/pages/Games";
import SDGGamesPage from "@/pages/SDGGamesPage";
import FacultyDashboard from "@/pages/FacultyDashboard";
import Assessments from "@/pages/Assessments";
import CreateAssessment from "@/pages/CreateAssessment";
import AssessmentResults from "@/pages/AssessmentResults";
import JoinClass from "@/pages/JoinClass";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/upload" component={UploadActivity} />
        <Route path="/activities" component={Activities} />
        <Route path="/profile" component={Profile} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/admin" component={Admin} />
        <Route path="/sdgs" component={SDGs} />
        <Route path="/learn" component={Learn} />
        <Route path="/games" component={Games} />
        <Route path="/sdg-games" component={SDGGamesPage} />
        <Route path="/faculty-dashboard" component={FacultyDashboard} />
        <Route path="/assessments" component={Assessments} />
        <Route path="/create-assessment" component={CreateAssessment} />
        <Route path="/assessment-results/:id" component={AssessmentResults} />
        <Route path="/join-class" component={JoinClass} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
