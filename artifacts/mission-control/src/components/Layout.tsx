import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, ListTodo, Database, Terminal, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetAgentStatus } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Task Queue", icon: ListTodo },
  { href: "/logs", label: "Activity Logs", icon: Terminal },
  { href: "/memory", label: "Memory Bank", icon: Database },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: agent, isLoading } = useGetAgentStatus({ query: { refetchInterval: 3000 } });

  const getStatusColor = (state?: string) => {
    switch (state) {
      case "active": return "bg-success shadow-[0_0_10px_rgba(0,255,100,0.8)]";
      case "paused": return "bg-warning shadow-[0_0_10px_rgba(255,200,0,0.8)]";
      case "error": return "bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.8)]";
      default: return "bg-primary shadow-[0_0_10px_rgba(0,229,255,0.8)]";
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Cpu className="w-6 h-6 text-primary mr-3" />
          <h1 className="font-display font-bold text-lg tracking-widest text-foreground uppercase">
            Mission <span className="text-primary">Control</span>
          </h1>
        </div>

        {/* Agent Quick Status */}
        <div className="p-6 border-b border-border/50 bg-background/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Agent Status</span>
            <div className="flex items-center">
              <span className={cn("w-2 h-2 rounded-full mr-2 animate-pulse", getStatusColor(agent?.state))} />
              <span className="text-xs font-display font-bold uppercase text-foreground">{isLoading ? "SYNCING" : agent?.state || "OFFLINE"}</span>
            </div>
          </div>
          <div className="text-sm font-mono truncate text-primary/80">
            {agent?.currentTask ? `> ${agent.currentTask}` : "> Awaiting instructions"}
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg font-display text-sm tracking-widest uppercase transition-all duration-300 group relative",
                  isActive 
                    ? "text-primary bg-primary/10 border border-primary/30 shadow-[inset_0_0_20px_rgba(0,229,255,0.1)]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
              >
                <item.icon className={cn("w-4 h-4 mr-3 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 text-xs font-mono text-muted-foreground/50 border-t border-border/50 text-center">
          SYSTEM_OS_v0.1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center text-sm font-mono text-muted-foreground">
            <Activity className="w-4 h-4 mr-2 text-primary/70 animate-pulse" />
            LIVE CONNECTION ESTABLISHED
          </div>
          <div className="font-mono text-sm text-primary/70">
            {new Date().toISOString().replace('T', ' ').slice(0, 19)}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto relative z-0 p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
