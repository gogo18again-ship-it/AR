import { Link, useLocation } from "wouter";
import { 
  Users, 
  LayoutDashboard, 
  CalendarDays, 
  FileText, 
  Search,
  Menu,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { href: "/", label: "대시보드", icon: LayoutDashboard },
    { href: "/employees", label: "직원 관리", icon: Users },
    { href: "/schedules", label: "일정 관리", icon: CalendarDays },
    { href: "/documents", label: "문서 관리", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-shrink-0 z-20 hidden md:flex flex-col",
          isSidebarOpen ? "w-64" : "w-16 items-center"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="h-6 w-6 text-primary shrink-0" />
            {isSidebarOpen && (
              <span className="font-bold text-sidebar-foreground truncate whitespace-nowrap">
                명지피앤피 HR
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    !isSidebarOpen && "justify-center px-0"
                  )}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {isSidebarOpen && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b border-card-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Mobile Nav Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">명지피앤피 HR</span>
            </div>

            <div className="max-w-md w-full ml-auto md:ml-0 hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="직원 성명, 사번, 부서 검색..." 
                className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
             {/* User profile placeholder */}
             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                관리
             </div>
          </div>
        </header>

        {/* Mobile Nav (Bottom) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-card-border flex justify-around p-2 pb-safe z-50">
           {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
