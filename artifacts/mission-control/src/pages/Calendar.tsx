import React, { useState, useEffect } from "react";
import {
  useGetEvents, useCreateEvent, useDeleteEvent,
} from "@workspace/api-client-react";
import type { CalendarEvent } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, MapPin, Clock,
} from "lucide-react";
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  eachDayOfInterval, isToday, parseISO, differenceInMinutes,
  isPast, isFuture,
} from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = format(new Date(), "yyyy-MM-dd");

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function durationLabel(start: string, end: string): string {
  const mins = timeToMinutes(end) - timeToMinutes(start);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function nowTime(): string {
  return format(new Date(), "HH:mm");
}

function eventStatus(event: CalendarEvent, today: boolean): "past" | "now" | "soon" | "upcoming" {
  if (!today || !event.startTime) return "upcoming";
  const now = nowTime();
  if (event.endTime && event.endTime <= now) return "past";
  if (event.startTime <= now && (!event.endTime || event.endTime > now)) return "now";
  const minsAway = timeToMinutes(event.startTime) - timeToMinutes(now);
  if (minsAway <= 60) return "soon";
  return "upcoming";
}

function timeUntil(startTime: string): string {
  const mins = timeToMinutes(startTime) - timeToMinutes(nowTime());
  if (mins <= 0) return "";
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
}

function committedHours(events: CalendarEvent[]): string {
  let total = 0;
  for (const e of events) {
    if (e.startTime && e.endTime) {
      total += timeToMinutes(e.endTime) - timeToMinutes(e.startTime);
    }
  }
  if (total === 0) return "";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}m committed` : `${h}h committed`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const BLANK = { title: "", date: TODAY, startTime: "", endTime: "", location: "", description: "" };

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...BLANK, date: TODAY });
  const [tick, setTick] = useState(0);

  // Re-render every minute so "now" indicator stays current
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const { data: events = [] } = useGetEvents({ query: { refetchInterval: 30000 } });
  const { mutate: create, isPending: creating } = useCreateEvent();
  const { mutate: remove } = useDeleteEvent();

  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  function eventsOn(dateStr: string) {
    return events
      .filter(e => e.date === dateStr)
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  }

  const selectedEvents = eventsOn(selectedDate);
  const isSelectedToday = selectedDate === TODAY;

  // "Coming up" — events after today, within next 14 days
  const upcomingDates = Array.from({ length: 14 }, (_, i) =>
    format(addDays(new Date(), i + 1), "yyyy-MM-dd")
  );
  const comingUp = upcomingDates
    .flatMap(d => eventsOn(d).map(e => ({ ...e, _date: d })))
    .slice(0, 6);

  function set(k: keyof typeof BLANK) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    create(
      { data: { title: form.title, date: form.date || selectedDate, startTime: form.startTime || undefined, endTime: form.endTime || undefined, location: form.location || undefined, description: form.description || undefined } },
      { onSuccess: () => { setShowAdd(false); setForm({ ...BLANK, date: selectedDate }); } }
    );
  }

  function openAdd(date: string) {
    setSelectedDate(date);
    setForm({ ...BLANK, date });
    setShowAdd(true);
  }

  return (
    <div className="space-y-0">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-5 border-b border-border/40">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Calendar</h1>
          <span className="text-[10px] font-mono text-muted-foreground/50">{format(weekStart, "MMMM yyyy")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="p-1.5 rounded text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); setSelectedDate(TODAY); }}
            className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 hover:text-foreground border border-border/40 rounded hover:border-primary/40 transition-colors"
          >
            Today
          </button>
          <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-1.5 rounded text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => openAdd(selectedDate)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-primary/8 text-primary border border-primary/25 rounded hover:bg-primary/15 transition-colors ml-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add event
          </button>
        </div>
      </div>

      {/* ── Week strip ────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-1 pt-4 pb-5">
        {days.map(day => {
          const ds = format(day, "yyyy-MM-dd");
          const dayEvts = eventsOn(ds);
          const isSelected = ds === selectedDate;
          const isTodayDay = isToday(day);

          return (
            <button
              key={ds}
              onClick={() => { setSelectedDate(ds); setShowAdd(false); }}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2 px-1 rounded transition-colors",
                isSelected
                  ? "bg-primary/10 border border-primary/30"
                  : "border border-transparent hover:bg-white/[0.03] hover:border-border/40"
              )}
            >
              <span className={cn("text-[9px] font-mono uppercase tracking-wider", isTodayDay ? "text-primary" : "text-muted-foreground/40")}>
                {format(day, "EEE")}
              </span>
              <span className={cn(
                "text-sm font-mono font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                isTodayDay && isSelected ? "bg-primary text-background" :
                isTodayDay ? "text-primary" :
                isSelected ? "text-foreground" : "text-foreground/50"
              )}>
                {format(day, "d")}
              </span>
              {/* Event density dots */}
              <div className="flex items-center gap-0.5 h-2">
                {dayEvts.length === 0
                  ? <span className="w-1 h-1 rounded-full bg-transparent" />
                  : Array.from({ length: Math.min(dayEvts.length, 4) }).map((_, i) => (
                    <span key={i} className={cn(
                      "w-1 h-1 rounded-full",
                      isTodayDay ? "bg-primary/70" : "bg-muted-foreground/30"
                    )} />
                  ))
                }
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-border/30" />

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-10 pt-5">

        {/* Left: Day agenda ───────────────────────────────────────── */}
        <div className="col-span-3 space-y-4">

          {/* Day header */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
                {isSelectedToday ? "Today" : format(parseISO(selectedDate), "EEEE")}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/50">
                {format(parseISO(selectedDate), isSelectedToday ? "MMMM d" : "MMMM d, yyyy")}
              </span>
              {selectedEvents.length > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground/40">
                  {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}
                  {committedHours(selectedEvents) && ` · ${committedHours(selectedEvents)}`}
                </span>
              )}
            </div>
            <button
              onClick={() => { setForm({ ...BLANK, date: selectedDate }); setShowAdd(s => !s); }}
              className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {/* Inline add form */}
          {showAdd && (
            <form onSubmit={handleCreate} className="border border-border/50 rounded bg-card/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">New event</span>
                <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground/40 hover:text-foreground transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
              <input value={form.title} onChange={set("title")} placeholder="Event title" autoFocus className={F} />
              <div className="grid grid-cols-3 gap-2">
                <input type="date" value={form.date} onChange={set("date")} className={F} />
                <input type="time" value={form.startTime} onChange={set("startTime")} placeholder="Start" className={F} />
                <input type="time" value={form.endTime} onChange={set("endTime")} placeholder="End" className={F} />
              </div>
              <input value={form.location} onChange={set("location")} placeholder="Location (optional)" className={F} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="text-xs font-mono text-muted-foreground/40 hover:text-foreground px-3 py-1.5 transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={!form.title.trim() || creating}
                  className="text-xs font-mono px-4 py-1.5 bg-primary/10 text-primary border border-primary/25 rounded hover:bg-primary/20 transition-colors disabled:opacity-30"
                >
                  {creating ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          {/* Agenda */}
          {selectedEvents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs font-mono text-muted-foreground/25">Nothing scheduled.</p>
              <button onClick={() => { setForm({ ...BLANK, date: selectedDate }); setShowAdd(true); }} className="mt-2 text-[10px] font-mono text-primary/40 hover:text-primary transition-colors">
                Add an event →
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedEvents.map(e => (
                <AgendaRow
                  key={e.id}
                  event={e}
                  isToday={isSelectedToday}
                  onDelete={() => remove({ id: e.id })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Coming up ───────────────────────────────────────── */}
        <div className="col-span-2 space-y-5">

          {/* This week's remaining days */}
          <section>
            <div className="mb-3">
              <Label text="Coming up" />
            </div>
            {comingUp.length === 0 ? (
              <p className="text-[11px] font-mono text-muted-foreground/25">Nothing scheduled.</p>
            ) : (
              <div className="space-y-0.5">
                {comingUp.map(e => (
                  <div
                    key={`${e.id}-${e._date}`}
                    onClick={() => setSelectedDate(e._date)}
                    className="flex items-start gap-3 px-3 py-2 rounded hover:bg-white/[0.025] transition-colors cursor-pointer group"
                  >
                    <div className="w-14 shrink-0 text-right">
                      <span className="text-[10px] font-mono text-muted-foreground/40">
                        {format(parseISO(e._date), "EEE d")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-foreground/70 truncate group-hover:text-foreground transition-colors">
                        {e.title}
                      </div>
                      {e.startTime && (
                        <div className="text-[10px] font-mono text-muted-foreground/40 mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {e.startTime}{e.endTime && ` – ${e.endTime}`}
                          {e.location && <span className="ml-2 opacity-70"><MapPin className="w-2 h-2 inline mr-0.5" />{e.location}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick day nav — days with events this week */}
          <section>
            <div className="mb-3">
              <Label text="This week" />
            </div>
            <div className="space-y-px">
              {days.map(day => {
                const ds = format(day, "yyyy-MM-dd");
                const dayEvts = eventsOn(ds);
                if (dayEvts.length === 0) return null;
                const isTodayDay = isToday(day);
                const isSelected = ds === selectedDate;

                return (
                  <button
                    key={ds}
                    onClick={() => setSelectedDate(ds)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors",
                      isSelected ? "bg-primary/8 text-primary" : "hover:bg-white/[0.025] text-muted-foreground/60"
                    )}
                  >
                    <span className={cn("text-[10px] font-mono w-10 shrink-0", isTodayDay && "text-primary font-bold")}>
                      {isTodayDay ? "Today" : format(day, "EEE d")}
                    </span>
                    <span className="text-[11px] font-mono truncate flex-1">
                      {dayEvts.length === 1
                        ? dayEvts[0].title
                        : `${dayEvts.length} events`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Agenda row ───────────────────────────────────────────────────────────────

function AgendaRow({ event, isToday, onDelete }: { event: CalendarEvent; isToday: boolean; onDelete: () => void }) {
  const status = eventStatus(event, isToday);
  const isPastEvent = status === "past";
  const isNow = status === "now";
  const isSoon = status === "soon";

  return (
    <div
      className={cn(
        "group flex items-stretch gap-0 rounded overflow-hidden transition-colors",
        isNow
          ? "bg-primary/5 border border-primary/25"
          : isPastEvent
          ? "opacity-40 hover:opacity-60"
          : "hover:bg-white/[0.025] border border-transparent"
      )}
    >
      {/* Left accent bar */}
      <div className={cn(
        "w-0.5 shrink-0",
        isNow ? "bg-primary" : isSoon ? "bg-yellow-400/60" : "bg-transparent"
      )} />

      {/* Time column */}
      <div className="w-20 shrink-0 flex flex-col items-end justify-start pt-3 pr-3 gap-0.5">
        <span className={cn(
          "text-[11px] font-mono",
          isNow ? "text-primary font-bold" : "text-muted-foreground/50"
        )}>
          {event.startTime ?? "—"}
        </span>
        {event.endTime && (
          <span className="text-[9px] font-mono text-muted-foreground/30 leading-none">
            {event.endTime}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-3 pr-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "text-sm font-mono",
                isNow ? "text-foreground font-semibold" : "text-foreground/80"
              )}>
                {event.title}
              </span>

              {isNow && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                  now
                </span>
              )}
              {isSoon && event.startTime && (
                <span className="text-[9px] font-mono text-yellow-400/80">
                  {timeUntil(event.startTime)}
                </span>
              )}
              {!isNow && !isSoon && event.startTime && event.endTime && (
                <span className="text-[9px] font-mono text-muted-foreground/30">
                  {durationLabel(event.startTime, event.endTime)}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-1">
              {event.location && (
                <span className="text-[10px] font-mono text-muted-foreground/40 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />{event.location}
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-[11px] font-mono text-muted-foreground/40 mt-1 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/5 transition-all shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">{text}</span>;
}

const F = "w-full px-3 py-1.5 text-sm font-mono bg-background border border-border/50 rounded text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 transition-colors";
