import React from "react";
import { Link } from "wouter";
import { useGetAgentStatus, useControlAgent, useGetTasks, useGetLogs } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Play, Square, Pause, PlayCircle, Cpu, Clock, CheckCircle2, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: agent, isLoading: agentLoading } = useGetAgentStatus({ query: { refetchInterval: 3000 } });
  const { mutate: controlAgent, isPending: controlling } = useControlAgent();
  const { data: tasks } = useGetTasks();
  const { data: logs } = useGetLogs({ limit: 5 });

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleControl = (action: "start" | "stop" | "pause" | "resume") => {
    controlAgent({ data: { action } });
  };

  if (agentLoading && !agent) {
    return <div className="flex items-center justify-center h-full text-primary font-mono animate-pulse">INITIALIZING CORE...</div>;
  }

  const isRunning = agent?.state === 'active';
  const isPaused = agent?.state === 'paused';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Top Section: Visual Core & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Agent Core Visual */}
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-card to-background border-primary/20">
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
              className="absolute inset-0 rounded-full border-2 border-primary/20 border-dashed" 
            />
            <motion.div 
              animate={{ rotate: -360 }} 
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }} 
              className="absolute inset-4 rounded-full border border-primary/40 border-dotted opacity-50" 
            />
            <motion.div 
              animate={isRunning ? { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] } : {}} 
              transition={{ duration: 2, repeat: Infinity }} 
              className={`w-24 h-24 rounded-full blur-xl absolute ${isRunning ? 'bg-primary/30' : isPaused ? 'bg-warning/30' : 'bg-muted/30'}`} 
            />
            <Cpu className={`w-12 h-12 relative z-10 ${isRunning ? 'text-primary drop-shadow-[0_0_8px_rgba(0,229,255,1)]' : isPaused ? 'text-warning' : 'text-muted-foreground'}`} />
          </div>
          
          <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground mb-1">
            Agent {agent?.name || "BEN"}
          </h2>
          <Badge variant={isRunning ? "success" : isPaused ? "warning" : "secondary"} className="mb-6">
            {agent?.state || "UNKNOWN"}
          </Badge>

          <div className="grid grid-cols-2 gap-4 w-full">
            {!isRunning && !isPaused && (
              <Button onClick={() => handleControl("start")} disabled={controlling} className="col-span-2">
                <Play className="w-4 h-4 mr-2" /> Initialize
              </Button>
            )}
            {(isRunning || isPaused) && (
              <>
                {isRunning ? (
                  <Button variant="warning" className="bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" onClick={() => handleControl("pause")} disabled={controlling}>
                    <Pause className="w-4 h-4 mr-2" /> Pause
                  </Button>
                ) : (
                  <Button onClick={() => handleControl("resume")} disabled={controlling}>
                    <PlayCircle className="w-4 h-4 mr-2" /> Resume
                  </Button>
                )}
                <Button variant="destructive" onClick={() => handleControl("stop")} disabled={controlling}>
                  <Square className="w-4 h-4 mr-2" /> Terminate
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Telemetry Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Card className="flex flex-col justify-center border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center">
                <Clock className="w-4 h-4 mr-2" /> Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-mono text-primary font-light tracking-wider drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
                {formatUptime(agent?.uptime)}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-center border-success/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-mono text-success font-light tracking-wider drop-shadow-[0_0_8px_rgba(0,255,100,0.5)]">
                {agent?.completedCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 bg-secondary/50 border-border">
            <CardHeader className="pb-2 border-b border-border/50 mb-4">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center text-muted-foreground"><Activity className="w-4 h-4 mr-2" /> Current Objective</span>
                <Link href="/tasks" className="text-xs text-primary hover:underline flex items-center">View Queue <ArrowRight className="w-3 h-3 ml-1"/></Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agent?.currentTask ? (
                <div className="font-mono text-lg text-foreground border-l-2 border-primary pl-4 py-1 bg-primary/5 rounded-r-md">
                  {agent.currentTask}
                </div>
              ) : (
                <div className="font-mono text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-4 py-1">
                  Awaiting instructions...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Logs & Quick info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border">
          <CardHeader className="border-b border-border mb-4 flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/logs" className="text-xs text-primary font-mono hover:underline">VIEW_ALL</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 font-mono text-xs">
              {logs && logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="flex gap-3 pb-2 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground whitespace-nowrap opacity-60">
                    {format(new Date(log.createdAt), 'HH:mm:ss')}
                  </span>
                  <span className={cn(
                    "flex-1",
                    log.level === 'error' ? 'text-destructive' :
                    log.level === 'warning' ? 'text-warning' :
                    log.level === 'success' ? 'text-success' : 'text-primary/80'
                  )}>
                    {log.message}
                  </span>
                </div>
              )) : (
                <div className="text-muted-foreground text-center py-4">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="border-b border-border mb-4">
            <CardTitle>Queue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-mono border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Pending Tasks</span>
                <span className="text-primary text-lg">{tasks?.filter(t => t.status === 'pending').length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-mono border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Failed Operations</span>
                <span className="text-destructive text-lg">{agent?.errorCount || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-mono pb-2">
                <span className="text-muted-foreground">Total In Queue</span>
                <span className="text-foreground text-lg">{agent?.taskCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
