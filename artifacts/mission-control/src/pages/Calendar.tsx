import React, { useState } from "react";
import {
  useGetEvents, useCreateEvent, useUpdateEvent, useDeleteEvent,
} from "@workspace/api-client-react";
import type { CalendarEvent, CreateEventRequest } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2,
  Clock, MapPin,
} from "lucide-react";
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks,
  eachDayOfInterval, isToday, parseISO, addDays,
} from "date-fns";
import { CreateEventBody } from "@workspace/api-zod";

const TODAY_STR = format(new Date(), "yyyy-MM-dd");

const BLANK_EVENT = { title: "", date: TODAY_STR, startTime: "", endTime: "", description: "", location: "" };

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK_EVENT });

  const { data: events } = useGetEvents({ query: { refetchInterval: 30000 } });
  const { mutate: create, isPending: creating } = useCreateEvent();
  const { mutate: remove } = useDeleteEvent();

  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  function setF(k: keyof typeof BLANK_EVENT) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  function eventsForDate(dateStr: string) {
    return (events ?? [])
      .filter(e => e.date === dateStr)
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  }

  function handleCreate(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.title.trim()) return;
    create(
      { data: { title: form.title, date: form.date || selectedDate, startTime: form.startTime || undefined, endTime: form.endTime || undefined, description: form.description || undefined, location: form.location || undefined } },
      { onSuccess: () => { setShowForm(false); setForm({ ...BLANK_EVENT, date: selectedDate }); } }
    );
  }

  const selectedDateEvents = eventsForDate(selectedDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground">Calendar</h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{format(weekStart, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border rounded hover:border-primary/40 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowForm(true); setForm({ ...BLANK_EVENT, date: selectedDate }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors ml-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add event
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayEvents = eventsForDate(dateStr);
          const isSelected = dateStr === selectedDate;
          const isTodayDay = isToday(day);

          return (
            <div
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={cn(
                "border rounded p-2 cursor-pointer min-h-[80px] transition-colors",
                isSelected ? "border-primary/50 bg-primary/5" : "border-border hover:border-border/80 hover:bg-white/2",
              )}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{format(day, "EEE")}</span>
                <span className={cn(
                  "text-xs font-mono font-bold",
                  isTodayDay ? "text-primary" : "text-foreground/70"
                )}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <div
                    key={e.id}
                    className="text-[9px] font-mono bg-primary/10 text-primary px-1 py-0.5 rounded truncate leading-tight"
                  >
                    {e.startTime && <span className="opacity-70 mr-1">{e.startTime}</span>}
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] font-mono text-muted-foreground/50">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Selected day events */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {isToday(parseISO(selectedDate)) ? "Today" : format(parseISO(selectedDate), "EEEE, MMMM d")}
              </span>
            </div>
            <button
              onClick={() => { setShowForm(true); setForm({ ...BLANK_EVENT, date: selectedDate }); }}
              className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs font-mono text-muted-foreground/40">No events. Click Add to schedule one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map(e => <EventDetail key={e.id} event={e} onDelete={() => remove({ id: e.id })} />)}
            </div>
          )}
        </div>

        {/* Add event form */}
        {showForm && (
          <div className="col-span-2">
            <form onSubmit={handleCreate} className="border border-border rounded p-4 space-y-3 bg-card/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">New Event</span>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Title *</label>
                <input value={form.title} onChange={setF("title")} placeholder="Event title" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Date</label>
                <input type="date" value={form.date} onChange={setF("date")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Start</label>
                  <input type="time" value={form.startTime} onChange={setF("startTime")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">End</label>
                  <input type="time" value={form.endTime} onChange={setF("endTime")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Location</label>
                <input value={form.location} onChange={setF("location")} placeholder="Optional" className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={!form.title.trim() || creating}
                  className="px-4 py-1.5 text-xs font-mono bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors disabled:opacity-40"
                >
                  {creating ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-1.5 text-sm bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono";

function EventDetail({ event, onDelete }: { event: CalendarEvent; onDelete: () => void }) {
  return (
    <div className="group flex items-start gap-3 px-3 py-3 rounded border border-border/50 bg-card/30 hover:bg-card/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono text-foreground">{event.title}</div>
        {(event.startTime || event.location) && (
          <div className="flex items-center gap-3 mt-1">
            {event.startTime && (
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {event.startTime}{event.endTime && ` – ${event.endTime}`}
              </span>
            )}
            {event.location && (
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />{event.location}
              </span>
            )}
          </div>
        )}
        {event.description && (
          <p className="text-xs text-muted-foreground/70 mt-1.5">{event.description}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-400 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
