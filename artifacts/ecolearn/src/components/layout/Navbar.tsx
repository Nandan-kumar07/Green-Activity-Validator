import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useLogout } from "@workspace/api-client-react";
import { Leaf, LogOut, LayoutDashboard, Upload, User, Trophy, ShieldCheck, Menu, Globe, BookOpen, GraduationCap, ClipboardList, Swords } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logoutUser } = useAuth();
  const logout = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const finishLogout = () => {
    logoutUser();
    setIsOpen(false);
    setLocation("/");
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        finishLogout();
      },
      onError: () => {
        finishLogout();
        toast({
          title: "Logged out locally",
          description: "Your session was cleared on this device.",
        });
      },
    });
  };

  const dashboardHref = (user?.role === "faculty" || user?.role === "admin") ? "/faculty-dashboard" : "/dashboard";
  const dashboardLabel = user?.role === "faculty" ? "My Classes" : user?.role === "admin" ? "Overview" : "Dashboard";

  const navItems = [
    { href: dashboardHref, label: dashboardLabel, icon: user?.role === "faculty" ? GraduationCap : LayoutDashboard },
    { href: "/sdgs", label: "SDGs", icon: Globe },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/sdg-games", label: "SDG Games", icon: Swords },
    { href: "/assessments", label: "Assessments", icon: ClipboardList },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  if (user?.role === "student") {
    navItems.splice(5, 0, { href: "/upload", label: "Submit Activity", icon: Upload });
    navItems.splice(6, 0, { href: "/join-class", label: "My Class", icon: GraduationCap });
  }

  if (user?.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin Panel", icon: ShieldCheck });
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <span
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={user ? "/dashboard" : "/"}>
            <span className="flex items-center gap-2 font-bold text-lg text-primary cursor-pointer">
              <Leaf className="w-5 h-5" />
              EcoLearn
            </span>
          </Link>
          
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLinks />
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {user.points} pts
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  {logout.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>

              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                  <div className="flex flex-col gap-6 mt-6">
                    <div className="px-3 pb-4 border-b">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.points} points • {user.streak} day streak</p>
                    </div>
                    <nav className="flex flex-col gap-2">
                      <NavLinks />
                    </nav>
                    <div className="mt-auto pt-4 border-t">
                      <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout} disabled={logout.isPending}>
                        <LogOut className="w-4 h-4 mr-2" />
                        {logout.isPending ? "Logging out..." : "Logout"}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
