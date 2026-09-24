import { database } from "@/db/raw";
import { z } from "zod";
const entry = z.object({ id: z.string().uuid().optional(), title: z.string().trim().min(1).max(160), kind: z.enum(["task", "event"]), starts: z.string().datetime(), minutes: z.number().int().min(0).max(10080), sound: z.enum(["Chime", "Marimba", "Bell", "Silent"]), notes: z.string().max(4000), done: z.union([z.literal(0), z.literal(1)]) });
function fail(e: unknown) { console.error(e); return Response.json({ error: "Could not access your planner. Please try again." }, { status: 503 }); }
export async function GET() { try {
    const { results } = await database().prepare("SELECT * FROM entries ORDER BY starts").all();
    return Response.json(results, { headers: { "Cache-Control": "no-store" } });
}
catch (e) {
    return fail(e);
} }
export async function POST(req: Request) {
    try {
        let raw: unknown;
        try {
            raw = await req.json();
        }
        catch {
            return Response.json({ error: "Invalid entry." }, { status: 400 });
        }
        const parsed = entry.safeParse(raw);
        if (!parsed.success)
            return Response.json({ error: "Please check the title, date, time and reminder." }, { status: 400 });
        const b = parsed.data, id = b.id ?? crypto.randomUUID();
        await database().prepare("INSERT INTO entries (id,title,kind,starts,minutes,sound,notes,done) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,kind=excluded.kind,starts=excluded.starts,minutes=excluded.minutes,sound=excluded.sound,notes=excluded.notes,done=excluded.done").bind(id, b.title, b.kind, b.starts, b.minutes, b.sound, b.notes, b.done).run();
        return Response.json({ id });
    }
    catch (e) {
        return fail(e);
    }
}
export async function DELETE(req: Request) { try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id)
        return Response.json({ error: "Missing entry" }, { status: 400 });
    await database().prepare("DELETE FROM entries WHERE id=?").bind(id).run();
    return Response.json({ ok: true });
}
catch (e) {
    return fail(e);
} }
