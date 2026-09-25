import {database} from "@/db/raw";
import {sql} from "@/db/entry-queries";
import {getCurrentAccount,requireOrigin,renewSession} from "@/lib/auth";

import {z} from "zod";
const entry=z.object({id:z.string().uuid().optional(),title:z.string().trim().min(1).max(160),kind:z.enum(["task","event"]),starts:z.string().datetime(),minutes:z.number().int().min(0).max(10080),sound:z.enum(["Chime","Marimba","Bell","Silent"]),notes:z.string().max(4000),done:z.union([z.literal(0),z.literal(1)])});
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store, private","Vary":"Cookie"}});
const currentUser=getCurrentAccount;
const checkOrigin=requireOrigin;
function fail(e:unknown){console.error(e);return json({error:"Could not access your planner. Please try again."},503);}
export async function GET(req:Request){try{
 const user=await currentUser();if(!user)return json({error:"Please sign in to view your calendar."},401);
 const {results}=await database().prepare(sql.list).bind(user.userId).all();const response=json(results);response.headers.set("X-Daybell-Account",user.userId);return await renewSession(req,response);
}catch(e){return fail(e);}}
export async function POST(req:Request){try{
 if(!checkOrigin(req))return json({error:"Request origin not allowed."},403);
 const user=await currentUser();if(!user)return json({error:"Please sign in to save your calendar."},401);
 let raw:unknown;try{raw=await req.json();}catch{return json({error:"Invalid entry."},400);}
 const parsed=entry.safeParse(raw);if(!parsed.success)return json({error:"Please check the title, date, time and reminder."},400);
 const b=parsed.data;
 if(b.id){
  const result=await database().prepare(sql.update).bind(b.title,b.kind,b.starts,b.minutes,b.sound,b.notes,b.done,b.id,user.userId).run();
  if(!result.meta.changes)return json({error:"Entry not found."},404);
  return json({id:b.id});
 }
 const id=crypto.randomUUID();
 await database().prepare(sql.create).bind(id,b.title,b.kind,b.starts,b.minutes,b.sound,b.notes,b.done,user.userId).run();
 return json({id},201);
}catch(e){return fail(e);}}
export async function DELETE(req:Request){try{
 if(!checkOrigin(req))return json({error:"Request origin not allowed."},403);
 const user=await currentUser();if(!user)return json({error:"Please sign in to edit your calendar."},401);
 const id=new URL(req.url).searchParams.get("id");if(!id)return json({error:"Missing entry."},400);
 const result=await database().prepare(sql.remove).bind(id,user.userId).run();
 return result.meta.changes?json({ok:true}):json({error:"Entry not found."},404);
}catch(e){return fail(e);}}


