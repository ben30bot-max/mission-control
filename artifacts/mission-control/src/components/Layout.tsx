import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ListTodo, Database, Terminal, Cpu, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/logs", label: "Logs", icon: Terminal },
  { href: "/memory", label: "Memory", icon: Database },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 border-r border-border flex flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-border">
          <Cpu className="w-4 h-4 text-primary mr-2.5 shrink-0" />
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
            Mission <span className="text-primary">Control</span>
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded text-sm font-mono transition-colors",
                  isActive
                    ? "text-foreground bg-white/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/3"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
