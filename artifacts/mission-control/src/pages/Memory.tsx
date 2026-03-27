import React, { useState } from "react";
import { useGetMemory, useCreateMemory, useDeleteMemory } from "@workspace/api-client-react";
import type { CreateMemoryRequest } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Database, Plus, Trash2, Cpu, BrainCircuit } from "lucide-react";
import { format } from "date-fns";

export default function Memory() {
  const { data: memoryItems, isLoading } = useGetMemory();
  const { mutate: createMemory, isPending: isCreating } = useCreateMemory();
  const { mutate: deleteMemory } = useDeleteMemory();

  const [isModalOpen, setModalOpen] = useState(false);
  const [newMemory, setNewMemory] = useState<Partial<CreateMemoryRequest>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.key || !newMemory.value) return;
    createMemory(
      { data: newMemory as CreateMemoryRequest },
      { onSuccess: () => { setModalOpen(false); setNewMemory({}); } }
    );
  };

  // Group memory items by category
  const groupedMemory = memoryItems?.reduce((acc, item) => {
    const cat = item.category || 'uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof memoryItems>) || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-widest uppercase flex items-center">
            <BrainCircuit className="w-8 h-8 mr-3 text-primary" />
            Memory Bank
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-2">Manage persistent contextual knowledge</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Data Block
        </Button>
      </div>

      {isLoading && <div className="text-primary font-mono animate-pulse p-4">Accessing memory sectors...</div>}

      {Object.keys(groupedMemory).length === 0 && !isLoading && (
        <Card className="p-16 text-center border-dashed border-2 border-border/50 bg-transparent">
          <Database className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-xl font-display text-muted-foreground">Memory bank is empty</p>
          <p className="text-sm font-mono text-muted-foreground/60 mt-2">No persistent contextual data found.</p>
        </Card>
      )}

      {Object.entries(groupedMemory).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <h3 className="font-mono text-sm tracking-[0.2em] text-primary/80 uppercase flex items-center before:content-[''] before:flex-1 before:h-[1px] before:bg-border/50 before:mr-4 after:content-[''] after:flex-1 after:h-[1px] after:bg-border/50 after:ml-4">
            Sector: {category}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="group hover:border-primary/40 transition-all duration-300">
                <CardHeader className="p-4 pb-2 border-b border-border/30 flex flex-row items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-mono mb-1">ID_{item.id.toString().padStart(6, '0')}</span>
                    <CardTitle className="text-base text-foreground break-all font-mono">{item.key}</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" 
                    onClick={() => deleteMemory({ id: item.id })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  <div className="bg-black/30 p-3 rounded border border-white/5 font-mono text-sm text-primary/90 whitespace-pre-wrap break-words max-h-[150px] overflow-y-auto">
                    {item.value}
                  </div>
                  <div className="mt-3 text-[10px] text-muted-foreground/60 font-mono text-right">
                    Stored: {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Inject Data Block">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-primary mb-1 uppercase">Memory Key / Identifier</label>
            <Input 
              autoFocus
              value={newMemory.key || ""} 
              onChange={e => setNewMemory({...newMemory, key: e.target.value})} 
              placeholder="e.g. user_preferences, API_URL"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-primary mb-1 uppercase">Data Payload (Value)</label>
            <Textarea 
              className="min-h-[120px]"
              value={newMemory.value || ""} 
              onChange={e => setNewMemory({...newMemory, value: e.target.value})} 
              placeholder="Enter context, JSON, or text..."
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-primary mb-1 uppercase">Sector / Category (Optional)</label>
            <Input 
              value={newMemory.category || ""} 
              onChange={e => setNewMemory({...newMemory, category: e.target.value})} 
              placeholder="e.g. system, users, credentials"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Abort</Button>
            <Button type="submit" disabled={!newMemory.key || !newMemory.value || isCreating}>
              Inject to Memory
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
