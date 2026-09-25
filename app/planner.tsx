"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Plus, Volume2, Clock, ArrowUpRight, Trash2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
type Entry = {
    id: string;
    title: string;
    kind: string;
    starts: string;
    minutes: number;
    sound: string;
    notes: string;
    done: number;
};
const key = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
const time = (d: string) => new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
function Choice({ label, value, onChange, items }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    items: string[];
}) { return <label className="field">{label}<Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="w-full h-11"><SelectValue /></SelectTrigger><SelectContent>{items.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></label>; }
export default function Home({accountName,accountId}: {accountName:string;accountId:string}) {
    const [now, setNow] = useState(new Date()), [month, setMonth] = useState(new Date()), [day, setDay] = useState(key(new Date())), [entries, setEntries] = useState<Entry[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [enabled, setEnabled] = useState(false), [notice, setNotice] = useState(""), [active, setActive] = useState<Entry[]>([]), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [filter, setFilter] = useState("all");
    const [editing, setEditing] = useState<Entry | null>(null), [title, setTitle] = useState(""), [kind, setKind] = useState("Event"), [date, setDate] = useState(day), [at, setAt] = useState("09:00"), [minutes, setMinutes] = useState(15), [sound, setSound] = useState("Chime"), [notes, setNotes] = useState("");
    const ringing=useRef<AudioBufferSourceNode|null>(null);
    const ringToken=useRef(0);
    const [installPrompt,setInstallPrompt]=useState<any>(null);
    const [alarmInfo,setAlarmInfo]=useState(false);
    const enabledAt=useRef(Date.now());
    const stopAudio=()=>{ringToken.current++;if(ringing.current){try{ringing.current.stop();}catch{}ringing.current.disconnect();ringing.current=null;}};
    async function startRinging(sound:string){
      if(sound==="Silent"||ringing.current)return;
      const token=++ringToken.current;
      try{
        audio.current??=new AudioContext();await audio.current.resume();
        if(token!==ringToken.current)return;
        const ctx=audio.current,rate=ctx.sampleRate,buffer=ctx.createBuffer(1,rate*3,rate),data=buffer.getChannelData(0);
        const tones=sound==="Bell"?[880,660,880]:sound==="Marimba"?[523,659,784,1046]:[659,880,1046];
        tones.forEach((f,j)=>{for(let i=0;i<rate*.7;i++){const t=i/rate,index=Math.floor(j*.25*rate)+i;const envelope=Math.min(1,t/.02)*Math.exp(-t*7);data[index]+=.2*Math.sin(2*Math.PI*f*t)*envelope;}});
        const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(ctx.destination);source.start();ringing.current=source;
        if(ctx.state!=="running")setNotice("Sound is blocked. Tap Enable alerts and check your sound settings.");
      }catch{setNotice("Sound could not start. Check your browser sound settings.");}
    }
    function stopRinging(){stopAudio();setActive([]);}
    useEffect(()=>{const audible=active.find(e=>e.sound!=="Silent");if(audible)void startRinging(audible.sound);return()=>{};},[active]);
    useEffect(()=>()=>{stopAudio();void audio.current?.close();},[]);
    useEffect(()=>{
      const listener=(event:Event)=>{event.preventDefault();setInstallPrompt(event);};
      window.addEventListener("beforeinstallprompt",listener);
      if("serviceWorker" in navigator)void navigator.serviceWorker.register("/sw.js").catch(()=>{});
      return()=>window.removeEventListener("beforeinstallprompt",listener);
    },[]);
    async function install(){
      if(installPrompt){await installPrompt.prompt();setInstallPrompt(null);}
      else setAlarmInfo(true);
    }
    const audio = useRef<AudioContext | null>(null), fired = useRef(new Set<string>());
    async function load() { try {
        const r = await fetch("/api/entries");
        if (r.status===401){setEntries([]);stopRinging();setEnabled(false);location.replace("/login");return;}
        if (!r.ok)
            throw Error();
        if(r.headers.get("X-Daybell-Account")!==accountId){setEntries([]);stopRinging();location.reload();return;}
        setEntries(await r.json());
        setError("");
    }
    catch {
        setError("Your planner couldn’t load. Retry to reconnect.");
    }
    finally {
        setLoading(false);
    } }
    useEffect(()=>{if((window as any).daybellDesktop?.backgroundWindow)void enable();},[]);
    useEffect(() => { void load(); const t = setInterval(() => { setNow(new Date()); void load(); }, 30000); return () => clearInterval(t); }, []);
    async function play(s: string) { if (s === "Silent")
        return; try {
        audio.current ??= new AudioContext();
        await audio.current.resume();
        const ctx = audio.current;
        const tones = s === "Bell" ? [880, 660, 880] : s === "Marimba" ? [523, 659, 784, 1046] : [659, 880, 1046];
        tones.forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = s === "Marimba" ? "sine" : "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0, ctx.currentTime + i * .25); g.gain.linearRampToValueAtTime(.18, ctx.currentTime + i * .25 + .02); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .25 + .7); o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + i * .25); o.stop(ctx.currentTime + i * .25 + .8); });
    }
    catch {
        setNotice("Sound could not play. Check your browser’s sound settings.");
    } }
    async function enable() { await play("Chime"); enabledAt.current=Date.now();setEnabled(true); if ("Notification" in window) {
        try {
            const p = await Notification.requestPermission();
            setNotice(p === "granted" ? "Alerts are on. Sound repeats until you press Stop ringing. Keep the app open and your computer awake." : "In-app alerts are on. Allow notifications in browser settings for desktop pop-ups.");
        }
        catch {
            setNotice("In-app alerts are on. Desktop notifications are unavailable here.");
        }
    }
    else
        setNotice("In-app alerts are on. Desktop notifications are unavailable in this browser."); }
    useEffect(() => { if (!enabled)
        return; const tick = () => { const n = Date.now(); const due = entries.filter(e => { const stamp = Date.parse(e.starts), token = e.id + e.starts + e.minutes; return !e.done && n >= stamp - e.minutes * 60000 && stamp >= enabledAt.current - 60000 && !fired.current.has(token); }); if (due.length) {
        due.forEach(e => { fired.current.add(e.id + e.starts + e.minutes); if ("Notification" in window && Notification.permission === "granted")
            try {
                new Notification(e.title, { body: time(e.starts) + " · " + (e.kind === "task" ? "To-do due" : "Event starts"), tag: e.id });
            }
            catch { } });
        setActive(a => [...a, ...due]);

    } }; tick(); const t = setInterval(tick, 1000); return () => clearInterval(t); }, [enabled, entries]);
    function create(e?: Entry) { setEditing(e || null); setTitle(e?.title || ""); setKind(e?.kind === "task" ? "To-do" : "Event"); setDate(e ? key(new Date(e.starts)) : day); setAt(e ? new Date(e.starts).toTimeString().slice(0, 5) : "09:00"); setMinutes(e?.minutes ?? 15); setSound(e?.sound || "Chime"); setNotes(e?.notes || ""); setOpen(true); }
    async function persist(e: Partial<Entry>) { const r = await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) }); if (!r.ok) {
        const data = await r.json() as {
            error?: string;
        };
        throw Error(data.error || "Could not save.");
    } await load(); }
    async function save(ev: React.FormEvent) { ev.preventDefault(); setBusy(true); try {
        await persist({ id: editing?.id, title, kind: kind === "To-do" ? "task" : "event", starts: new Date(date + "T" + at).toISOString(), minutes, sound, notes, done: editing?.done ?? 0 });
        setOpen(false);
        setNotice("Saved to your planner.");
    }
    catch (e) {
        setNotice(e instanceof Error ? e.message : "Could not save.");
    }
    finally {
        setBusy(false);
    } }
    async function complete(e: Entry) { try {
        await persist({ ...e, done: e.done ? 0 : 1 });
    }
    catch {
        setNotice("Could not update this to-do. Try again.");
    } }
    async function remove() { if (!editing)
        return; setBusy(true); try {
        const r = await fetch("/api/entries?id=" + encodeURIComponent(editing.id), { method: "DELETE" });
        if (!r.ok)
            throw Error();
        await load();
        setOpen(false);
        setNotice("Entry deleted.");
    }
    catch {
        setNotice("Could not delete. Try again.");
    }
    finally {
        setBusy(false);
    } }
    useEffect(() => { const context = (document as any).modelContext; if (!context?.registerTool)
        return; const c = new AbortController(); try {
        Promise.resolve(context.registerTool({ name: "start_calendar_entry", description: "Open the new event or to-do form. Does not save an entry.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input: unknown) { if (!input || typeof input !== "object" || Object.keys(input).length)
                throw Error("Expected an empty object"); create(); return { status: "form_opened" }; } }, { signal: c.signal })).catch(() => { });
    }
    catch { } return () => c.abort(); }, [day]);
    const first = new Date(month.getFullYear(), month.getMonth(), 1), start = new Date(first);
    start.setDate(1 - (first.getDay() + 6) % 7);
    const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
    const selected = entries.filter(e => key(new Date(e.starts)) === day && (filter === "all" || e.kind === "task"));
    const upcoming = entries.filter(e => !e.done && Date.parse(e.starts) >= now.getTime())[0];
    return <div className="app"><header className="topbar"><a className="brand" href="/"><span className="brandmark"><Bell size={21}/></span>daybell<span className="branddot">.</span></a><span className="tagline">PLAN IT. DO IT. OWN IT.</span><button className={"outline " + (enabled ? "is-enabled" : "")} onClick={enable}><Bell size={16}/>{enabled ? "Alerts enabled" : "Enable alerts"}</button><button className="outline" onClick={install}>Install app</button></header>
 <div className="accountbar"><span title={accountName}>Private calendar · {accountName}</span><button className="signout-button" onClick={async()=>{try{const r=await fetch("/api/auth/logout",{method:"POST"});if(!r.ok)throw Error();stopRinging();location.assign("/login");}catch{setNotice("Could not sign out. Please retry.");}}}>Sign out</button></div><main><section className="heading"><div><div className="eyebrow"><Sparkles size={15}/> A GOOD DAY STARTS HERE</div><h1>Big plans.<br /><span>Little reminders.</span></h1><p>Your time, your rhythm. Let's make today happen.</p></div><button className="primary" onClick={() => create()}><Plus size={18}/>Make a plan <ArrowUpRight size={18}/></button></section>
 <section className="overview"><div className="overview-title"><CalendarDays size={21}/><span>{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</span></div><div><strong>{entries.filter(e => key(new Date(e.starts)) === key(now) && e.kind === "event").length}</strong> events today</div><div><strong>{entries.filter(e => e.kind === "task" && !e.done).length}</strong> open to-dos</div><span className="timezone">{Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll("_", " ")}</span></section>
 {error && <div className="error" role="alert">{error}<button onClick={() => load()}>Retry</button></div>}
 <div className="workspace"><section className="calendar panel"><div className="panelhead"><div><h2>{month.toLocaleDateString([], { month: "long" })} <span>{month.getFullYear()}</span></h2></div><div className="controls"><button className="today" onClick={() => { setMonth(new Date()); setDay(key(new Date())); }}>Today</button><button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={19}/></button><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={19}/></button></div></div><div className="weekdays">{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => <span key={d}>{d}</span>)}</div><div className="grid">{days.map(d => { const k = key(d), items = entries.filter(e => key(new Date(e.starts)) === k); return <button key={k} onClick={() => setDay(k)} aria-label={d.toDateString() + ", " + items.length + " entries"} aria-pressed={day === k} className={"day " + (d.getMonth() !== month.getMonth() ? "muted " : "") + (day === k ? "selected " : "") + (k === key(now) ? "current" : "")}><span className="number">{d.getDate()}</span><div className="dayitems">{items.slice(0, 2).map(e => <span key={e.id} className={"chip " + e.kind + (e.done ? " completed" : "")}>{e.kind === "task" ? "✓ " : ""}{e.title}</span>)}{items.length > 2 && <span className="more">+{items.length - 2} more</span>}</div></button>; })}</div><footer className="legend"><span><i />Events</span><span><i className="taskdot"/>To-dos</span><span className="hint">Select a date to see your plans</span></footer></section>
 <aside className="agenda panel"><div className="panelhead"><div><div className="eyebrow">DAILY AGENDA</div><h2>{new Date(day + "T12:00").toLocaleDateString([], { month: "short", day: "numeric" })}<span className="weekday"> {new Date(day + "T12:00").toLocaleDateString([], { weekday: "short" })}</span></h2></div><button aria-label="Add entry on selected date" className="addsmall" onClick={() => create()}><Plus size={20}/></button></div><div className="filter"><button className={filter === "all" ? "chosen" : ""} onClick={() => setFilter("all")}>All entries</button><button className={filter === "task" ? "chosen" : ""} onClick={() => setFilter("task")}>To-dos</button></div><div className="agendalist">{loading ? <p className="empty">Loading your plans…</p> : selected.length ? selected.map(e => <div className={"entry " + (e.done ? "completed" : "")} key={e.id}><div className="entrytime">{time(e.starts)}{e.kind === "task" ? <Checkbox aria-label={"Complete " + e.title} checked={!!e.done} onCheckedChange={() => complete(e)}/> : <span className="eventmarker"/>}</div><button className="entrybody" onClick={() => create(e)}><span className={"type " + e.kind}>{e.kind === "task" ? "TO-DO" : "EVENT"}</span><h3>{e.title}</h3><span className="remind"><Bell size={13}/>{e.minutes === 0 ? "At start" : e.minutes + " min before"}</span></button></div>) : <div className="empty"><span className="emptyicon"><CalendarDays size={27}/></span><h3>An open day. Endless possibilities.</h3><p>No {filter === "task" ? "to-dos" : "plans"} for this day yet.</p><button onClick={() => create()}>Add your first entry <ArrowUpRight size={15}/></button></div>}</div><div className="agendabottom"><Check size={15}/>{selected.filter(e => e.done).length} of {selected.filter(e => e.kind === "task").length} to-dos completed</div></aside></div>
 <section className="bottomrow"><div className="nextup"><span className="nexticon"><Clock size={23}/></span><div><div className="eyebrow">UP NEXT</div><h3>{upcoming?.title || "Something good is up next"}</h3><p>{upcoming ? new Date(upcoming.starts).toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + time(upcoming.starts) : "Add an event or to-do, and we’ll keep it in view."}</p></div>{upcoming && <button aria-label="View next entry" onClick={() => { setDay(key(new Date(upcoming.starts))); setMonth(new Date(upcoming.starts)); }}><ArrowUpRight size={22}/></button>}</div><div className="reminderinfo"><Volume2 size={22}/><div><h3>Never miss your moment.</h3><p>Choose a sound and how many minutes ahead to be reminded.<br />Sound repeats until you stop it. Keep the app running; sleep or closing it stops browser alarms.</p></div></div></section>
 <footer className="pagefooter">LESS MENTAL CLUTTER. MORE YOU.<span>Calendar & to-dos · Saved securely online</span></footer></main>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="editor"><DialogTitle>{editing ? "Edit entry" : "A new plan"}</DialogTitle><DialogDescription>Give it a time. We’ll give you a nudge.</DialogDescription><form onSubmit={save}><label className="field">Title<input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="What’s on your calendar?"/></label><Choice label="Entry type" value={kind} onChange={setKind} items={["Event", "To-do"]}/><div className="formrow"><label className="field">Date<input type="date" required value={date} onInput={e => setDate(e.currentTarget.value)} onChange={e => setDate(e.target.value)}/></label><label className="field">Time<input type="time" required value={at} onInput={e => setAt(e.currentTarget.value)} onChange={e => setAt(e.target.value)}/></label></div><div className="reminderbox"><label className="field">Remind me (minutes before)<input type="number" min="0" max="10080" required value={minutes} onChange={e => setMinutes(Number(e.target.value))}/></label><div className="presets">{[0, 5, 15, 30, 60].map(m => <button type="button" className={minutes === m ? "active" : ""} key={m} onClick={() => setMinutes(m)}>{m === 0 ? "At time" : m + " min"}</button>)}</div><div className="formrow"><Choice label="Ringtone" value={sound} onChange={setSound} items={["Chime", "Marimba", "Bell", "Silent"]}/><button className="preview" type="button" onClick={() => play(sound)}><Volume2 size={17}/>Preview</button></div></div><label className="field">Notes <span>(optional)</span><textarea maxLength={4000} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything you’d like to remember"/></label><div className="formactions">{editing && <button type="button" className="delete" onClick={remove} disabled={busy}><Trash2 size={16}/>Delete</button>}<button className="primary" disabled={busy}>{busy ? "Saving…" : "Save entry"}</button></div></form></DialogContent></Dialog>
 <Dialog open={alarmInfo} onOpenChange={setAlarmInfo}><DialogContent><DialogTitle>Use Daybell as an app</DialogTitle><DialogDescription>Install from your browser for a separate app window.</DialogDescription><p>In Chrome or Edge, use the Install app option in the address bar or browser menu. On iPhone, use Share → Add to Home Screen.</p><p>Once an alarm starts, its sound loops until you press Stop ringing, including while the running app is minimized. Muting, closing, sleep, browser suspension, and phone background restrictions can interrupt it.</p><p>An installed web app is not a system alarm service. Keep it running and your device awake. Use a native alarm app for alarms that must work when the browser is closed.</p><button className="primary" onClick={()=>{setAlarmInfo(false);setActive([{id:"test",title:"Test alarm",kind:"event",starts:new Date().toISOString(),minutes:0,sound:"Chime",notes:"",done:0}]);void play("Chime");}}>Test continuous ringing</button></DialogContent></Dialog>
 {notice && <div className="toast" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div>}
 {active.length > 0 && <div className="alarm" role="alert"><Bell size={27}/><div className="eyebrow">REMINDER · ACTION NEEDED</div>{active.map(e => <div key={e.id}><h3>{e.title}</h3><p>{time(e.starts)} · {e.kind === "task" ? "To-do due" : "Event starts"}</p></div>)}<button className="primary" onClick={stopRinging}>Stop ringing</button></div>}
 </div>;
}


