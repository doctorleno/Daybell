import {database} from "@/db/raw";
import {sql} from "@/db/entry-queries";
import {getCurrentAccount,requireOrigin,renewSession} from "@/lib/auth";

import {recurrenceSchema,matchesDate,localFields} from "@/lib/recurrence";
import {z} from "zod";
const entry=z.object({id:z.string().uuid().optional(),title:z.string().trim().min(1).max(160),kind:z.enum(["task","event"]),starts:z.string().datetime(),minutes:z.number().int().min(0).max(10080),sound:z.enum(["Chime","Marimba","Bell","Silent"]),notes:z.string().max(4000),done:z.union([z.literal(0),z.literal(1)]),recurrence:recurrenceSchema.nullable().optional()});
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store, private","Vary":"Cookie"}});
const currentUser=getCurrentAccount;
const checkOrigin=requireOrigin;
function fail(e:unknown){console.error(e);return json({error:"Could not access your planner. Please try again."},503);}
export async function GET(req:Request){try{
 const user=await currentUser();if(!user)return json({error:"Please sign in to view your calendar."},401);
 const {results}=await database().prepare(sql.list).bind(user.userId).all();const response=json(results.map((row:any)=>({...row,recurrence:row.recurrence?JSON.parse(row.recurrence):null,completed:JSON.parse(row.completed??"[]")})));response.headers.set("X-Daybell-Account",user.userId);return await renewSession(req,response);
}catch(e){return fail(e);}}
export async function POST(req:Request){try{
 if(!checkOrigin(req))return json({error:"Request origin not allowed."},403);
 const user=await currentUser();if(!user)return json({error:"Please sign in to save your calendar."},401);
 let raw:unknown;try{raw=await req.json();}catch{return json({error:"Invalid entry."},400);}
 if(raw&&typeof raw==="object"&&"occurrence" in raw){
 const occurrence=z.object({id:z.string().uuid(),occurrence:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),done:z.union([z.literal(0),z.literal(1)])}).safeParse(raw);
 if(!occurrence.success)return json({error:"Invalid occurrence."},400);
 const v=occurrence.data;
 const parent=await database().prepare("SELECT starts,recurrence FROM entries WHERE id=? AND owner_id=?").bind(v.id,user.userId).first<{starts:string;recurrence:string|null}>();
 if(!parent)return json({error:"Entry not found."},404);
 try{if(!parent.recurrence||!matchesDate(parent.starts,recurrenceSchema.parse(JSON.parse(parent.recurrence)),v.occurrence))return json({error:"Invalid occurrence."},400);}catch{return json({error:"Invalid occurrence."},400);}
 if(v.done)await database().prepare("INSERT OR IGNORE INTO entry_completions (entry_id,occurrence) SELECT id,? FROM entries WHERE id=? AND owner_id=?").bind(v.occurrence,v.id,user.userId).run();
 else await database().prepare("DELETE FROM entry_completions WHERE entry_id=? AND occurrence=? AND EXISTS (SELECT 1 FROM entries WHERE id=? AND owner_id=?)").bind(v.id,v.occurrence,v.id,user.userId).run();
 return json({ok:true});
 }
 const parsed=entry.safeParse(raw);if(!parsed.success)return json({error:"Please check the title, date, time and reminder."},400);
 const b=parsed.data;
 if(b.recurrence?.until&&b.recurrence.until<localFields(b.starts,b.recurrence.timezone).date)return json({error:"The last repeat date must be on or after the start date."},400);
 if(b.id){
  const result=await database().prepare(sql.update).bind(b.title,b.kind,b.starts,b.minutes,b.sound,b.notes,b.recurrence?0:b.done,b.recurrence!==undefined?1:0,b.recurrence?JSON.stringify(b.recurrence):null,b.id,user.userId).run();
  if(!result.meta.changes)return json({error:"Entry not found."},404);
  return json({id:b.id});
 }
 const id=crypto.randomUUID();
 await database().prepare(sql.create).bind(id,b.title,b.kind,b.starts,b.minutes,b.sound,b.notes,b.recurrence?0:b.done,user.userId,b.recurrence?JSON.stringify(b.recurrence):null).run();
 return json({id},201);
}catch(e){return fail(e);}}
export async function DELETE(req:Request){try{
 if(!checkOrigin(req))return json({error:"Request origin not allowed."},403);
 const user=await currentUser();if(!user)return json({error:"Please sign in to edit your calendar."},401);
 const id=new URL(req.url).searchParams.get("id");if(!id)return json({error:"Missing entry."},400);
 const result=await database().prepare(sql.remove).bind(id,user.userId).run();
 return result.meta.changes?json({ok:true}):json({error:"Entry not found."},404);
}catch(e){return fail(e);}}


