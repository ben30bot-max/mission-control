import React, { useState, useRef, useEffect } from "react";
import { useGetLogs } from "@workspace/api-client-react";
import type { GetLogsLevel } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Terminal as TerminalIcon, Filter, PlayCircle, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Logs() {
  const [level, setLevel] = useState<GetLogsLevel>("all");
  const [isFollowing, setIsFollowing] = useState(true);
  
  // Poll frequently for live logs effect
  const { data: logs, isLoading } = useGetLogs(
    { limit: 200, level }, 
    { query: { refetchInterval: isFollowing ? 2000 : false } }
  );

  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFollowing && endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isFollowing]);

  const getLogStyle = (logLevel: string) => {
    switch (logLevel) {
      case "error": return "text-destructive border-l-destructive/50 bg-destructive/5";
      case "warning": return "text-warning border-l-warning/50 bg-warning/5";
      case "success": return "text-success border-l-success/50";
      case "info": return "text-primary border-l-primary/30";
      default: return "text-foreground border-l-border";
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      
      {/* Log Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 bg-card/80 backdrop-blur-md p-4 rounded-t-xl border border-border shadow-lg">
        <div className="flex items-center mb-4 sm:mb-0">
          <TerminalIcon className="w-5 h-5 text-primary mr-3" />
          <h1 className="text-xl font-display font-bold text-foreground tracking-widest uppercase">System Console</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-background/50 rounded-md border border-border p-1">
            <Filter className="w-4 h-4 text-muted-foreground mx-2" />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as GetLogsLevel)}
              className="bg-transparent border-none text-xs font-mono text-foreground focus:ring-0 cursor-pointer outline-none uppercase"
            >
              <option value="all">ALL LEVELS</option>
              <option value="info">INFO</option>
              <option value="warning">WARNING</option>
              <option value="error">ERROR</option>
              <option value="success">SUCCESS</option>
            </select>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFollowing(!isFollowing)}
            className={`font-mono text-xs ${isFollowing ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}
          >
            {isFollowing ? <><PauseCircle className="w-3 h-3 mr-2" /> Auto-scroll ON</> : <><PlayCircle className="w-3 h-3 mr-2" /> Auto-scroll OFF</>}
          </Button>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="flex-1 overflow-hidden bg-[#050914] rounded-b-xl border border-t-0 border-border relative font-mono text-sm shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
        
        {isLoading && !logs && (
          <div className="absolute inset-0 flex items-center justify-center text-primary/50 animate-pulse">
            Establishing connection...
          </div>
        )}

        <div className="h-full overflow-y-auto p-4 space-y-1">
          {logs?.map((log) => (
            <div 
              key={log.id} 
              className={`px-3 py-1.5 border-l-2 flex flex-col sm:flex-row gap-2 sm:gap-6 hover:bg-white/5 transition-colors ${getLogStyle(log.level)}`}
            >
              <div className="opacity-60 shrink-0 w-32">
                [{format(new Date(log.createdAt), 'HH:mm:ss.SSS')}]
              </div>
              <div className="uppercase w-20 shrink-0 font-bold tracking-wider opacity-80">
                {log.level}
              </div>
              <div className="flex-1 break-words">
                {log.message}
                {log.source && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-muted-foreground border border-white/10">
                    {log.source}
                  </span>
                )}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <pre className="mt-2 p-2 bg-black/50 rounded text-xs opacity-70 border border-white/5 overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
          <div ref={endOfLogsRef} className="h-4" />
        </div>
        
        {/* Terminal Scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
      </div>
    </div>
  );
}
